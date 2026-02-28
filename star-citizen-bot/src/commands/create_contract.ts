import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  AutocompleteInteraction,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
  TextChannel,
} from "discord.js";
import { Op } from "sequelize";
import { Material } from "../models/Material.js";
import { Location } from "../models/Location.js";
import { Contract } from "../models/Contract.js";

export default {
  data: new SlashCommandBuilder()
    .setName("create_contract")
    .setDescription("Creates a new contract for materials")
    .addStringOption((option) =>
      option
        .setName("material")
        .setDescription("The material needed")
        .setRequired(true)
        .setAutocomplete(true),
    )
    .addStringOption((option) =>
      option
        .setName("location")
        .setDescription("The drop-off location")
        .setRequired(true)
        .setAutocomplete(true),
    )
    .addIntegerOption((option) =>
      option
        .setName("quantity")
        .setDescription("The amount of material needed")
        .setRequired(true)
        .setMinValue(1),
    )
    .addNumberOption((option) =>
      option
        .setName("reward")
        .setDescription("The payment for completing the contract (in aUEC)")
        .setRequired(true)
        .setMinValue(1),
    )
    .addIntegerOption(
      (option) =>
        option
          .setName("deadline_hours")
          .setDescription("Number of hours until the contract expires")
          .setRequired(true)
          .setMinValue(1)
          .setMaxValue(720), // max 30 days
    ),

  async autocomplete(interaction: AutocompleteInteraction) {
    const focusedValue = interaction.options.getFocused(true);
    let choices: any[] = [];

    if (focusedValue.name === "material") {
      const materials = await Material.findAll({
        where: {
          name: { [Op.iLike]: `%${focusedValue.value}%` },
        },
        limit: 25,
      });
      choices = materials.map((m: any) => ({ name: m.name, value: m.id }));
    } else if (focusedValue.name === "location") {
      const locations = await Location.findAll({
        where: {
          name: { [Op.iLike]: `%${focusedValue.value}%` },
        },
        limit: 25,
      });
      choices = locations.map((l: any) => ({
        name: `${l.name} (${l.type})`,
        value: l.id,
      }));
    }

    await interaction.respond(choices);
  },

  async execute(interaction: ChatInputCommandInteraction) {
    const makerRoleId = process.env.CONTRACT_MAKER_ROLE_ID;

    // Check if user has the role to make contracts
    if (
      makerRoleId &&
      !(interaction.member as any).roles.cache.has(makerRoleId)
    ) {
      return interaction.reply({
        content: "You do not have permission to create contracts.",
        ephemeral: true,
      });
    }

    const materialId = interaction.options.getString("material", true);
    const locationId = interaction.options.getString("location", true);
    const quantity = interaction.options.getInteger("quantity", true);
    const reward = interaction.options.getNumber("reward", true);
    const deadlineHours = interaction.options.getInteger(
      "deadline_hours",
      true,
    );

    const material = await Material.findByPk(materialId);
    const location = await Location.findByPk(locationId);

    if (!material)
      return interaction.reply({
        content: "Invalid material selected.",
        ephemeral: true,
      });
    if (!location)
      return interaction.reply({
        content: "Invalid location selected.",
        ephemeral: true,
      });

    const deadline = new Date();
    deadline.setHours(deadline.getHours() + deadlineHours);

    try {
      // Defer reply as database operation might take a moment
      await interaction.deferReply({ ephemeral: true });

      const contract = await Contract.create({
        creatorId: interaction.user.id,
        materialId: material.id,
        locationId: location.id,
        quantity: quantity,
        reward: reward,
        deadline: deadline,
        status: "OPEN",
      });

      const contractsChannelId = process.env.CONTRACTS_CHANNEL_ID;
      if (
        !contractsChannelId ||
        contractsChannelId === "your_contracts_board_channel_id_here"
      ) {
        return interaction.editReply(
          "Contract created in database, but no CONTRACTS_CHANNEL_ID set in .env to post it.",
        );
      }

      const channel = interaction.client.channels.cache.get(contractsChannelId);
      if (!channel || !channel.isTextBased()) {
        return interaction.editReply(
          "Could not find the specified contracts channel.",
        );
      }

      const embed = new EmbedBuilder()
        .setTitle(`📝 New Contract: #${contract.id}`)
        .setColor(0x00ff00)
        .addFields(
          { name: "Material", value: material.name, inline: true },
          { name: "Quantity", value: quantity.toString(), inline: true },
          {
            name: "Reward",
            value: `${reward.toLocaleString()} aUEC`,
            inline: true,
          },
          { name: "Drop-off Location", value: location.name, inline: true },
          {
            name: "Deadline",
            value: `<t:${Math.floor(deadline.getTime() / 1000)}:R>`,
            inline: true,
          },
          { name: "Creator", value: `<@${interaction.user.id}>`, inline: true },
        )
        .setFooter({ text: 'Click "Accept" below to take this contract!' });

      const acceptButton = new ButtonBuilder()
        .setCustomId(`accept_contract_${contract.id}`)
        .setLabel("Accept Contract")
        .setStyle(ButtonStyle.Primary);

      const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
        acceptButton,
      );

      const message = await (channel as TextChannel).send({
        embeds: [embed.toJSON()],
        components: [row],
      });

      // Update contract with the message ID
      await contract.update({ messageId: message.id });

      await interaction.editReply(
        `Contract #${contract.id} created successfully and posted in <#${contractsChannelId}>.`,
      );
    } catch (error) {
      console.error(error);
      if (interaction.deferred) {
        await interaction.editReply(
          "An error occurred while creating the contract.",
        );
      } else {
        await interaction.reply({
          content: "An error occurred while creating the contract.",
          ephemeral: true,
        });
      }
    }
  },
};
