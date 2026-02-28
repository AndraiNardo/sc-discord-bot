import {
  ButtonInteraction,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
  TextChannel,
  ChannelType,
  Guild,
  PermissionsBitField,
  BaseGuildTextChannel,
} from "discord.js";
import type { OverwriteData } from "discord.js";
import { Contract } from "./models/Contract.js";
import { Material } from "./models/Material.js";
import { Location } from "./models/Location.js";

export async function handleButtonInteraction(interaction: ButtonInteraction) {
  const customId = interaction.customId;

  try {
    if (customId.startsWith("accept_contract_")) {
      await handleAcceptContract(interaction);
    } else if (customId.startsWith("submit_proof_")) {
      await handleSubmitProof(interaction);
    } else if (customId.startsWith("proof_correct_")) {
      await handleProofDecision(interaction, true);
    } else if (customId.startsWith("proof_incorrect_")) {
      await handleProofDecision(interaction, false);
    } else if (customId.startsWith("delivery_completed_")) {
      await handleDeliveryCompleted(interaction);
    } else if (customId.startsWith("payment_sent_")) {
      await handlePaymentSent(interaction);
    }
  } catch (error) {
    console.error("Error handling button interaction:", error);
    if (interaction.deferred || interaction.replied) {
      await interaction.followUp({
        content: "An error occurred while processing this action.",
        ephemeral: true,
      });
    } else {
      await interaction.reply({
        content: "An error occurred while processing this action.",
        ephemeral: true,
      });
    }
  }
}

async function handleAcceptContract(interaction: ButtonInteraction) {
  const contractorRoleId = process.env.CONTRACTOR_ROLE_ID;
  if (
    contractorRoleId &&
    !(interaction.member as any).roles.cache.has(contractorRoleId)
  ) {
    return interaction.reply({
      content: "You do not have the required role to accept contracts.",
      ephemeral: true,
    });
  }

  const contractId = parseInt(interaction.customId.split("_")[2] as string);
  const contract = await Contract.findByPk(contractId, {
    include: [Material, Location],
  });

  if (!contract)
    return interaction.reply({
      content: "Contract not found.",
      ephemeral: true,
    });
  if (contract.status !== "OPEN")
    return interaction.reply({
      content: "This contract is no longer open.",
      ephemeral: true,
    });

  await interaction.deferReply({ ephemeral: true });

  // Update contract status
  await contract.update({
    status: "ACCEPTED",
    contractorId: interaction.user.id,
  });

  const guild = interaction.guild as Guild;
  const creatorId = contract.creatorId;
  const contractorId = interaction.user.id;

  // Create a new channel for the contract
  const categoryId = process.env.CONTRACTS_CATEGORY_ID; // Optional category to put channels in

  const permissionOverwrites: OverwriteData[] = [
    {
      id: guild.roles.everyone,
      deny: [PermissionsBitField.Flags.ViewChannel],
    },
    {
      id: contractorId,
      allow: [
        PermissionsBitField.Flags.ViewChannel,
        PermissionsBitField.Flags.SendMessages,
        PermissionsBitField.Flags.AttachFiles,
      ],
    },
    // The bot itself
    {
      id: interaction.client.user.id,
      allow: [
        PermissionsBitField.Flags.ViewChannel,
        PermissionsBitField.Flags.SendMessages,
        PermissionsBitField.Flags.ManageChannels,
        PermissionsBitField.Flags.EmbedLinks,
      ],
    },
  ];

  const channelName = `contract-${contract.id}`;
  const newChannel = await guild.channels.create({
    name: channelName,
    type: ChannelType.GuildText,
    parent: categoryId || null,
    permissionOverwrites: permissionOverwrites,
  });

  await contract.update({ channelId: newChannel.id });

  // Update original message
  const originalMessage = interaction.message;
  const embed = EmbedBuilder.from(originalMessage.embeds[0] as any)
    .setColor(0xffff00) // Yellow for accepted
    .setFooter({ text: `Accepted by @${interaction.user.tag}` });

  await originalMessage.edit({ embeds: [embed.toJSON()], components: [] }); // Remove accept button

  // Send instructions in the new channel
  const instructionsEmbed = new EmbedBuilder()
    .setTitle(`Contract #${contract.id} - Ongoing`)
    .setDescription(
      `<@${contractorId}>, you have accepted this contract! \n\nPlease collect **${contract.quantity}x ${(contract as any).Material?.name}** and prepare to deliver it to **${(contract as any).Location?.name}**.\n\n**Next Step:** Once you have the items, post a screenshot of your inventory in this channel as proof, then click the "Submit Proof" button below.`,
    )
    .setColor(0x0099ff);

  const submitButton = new ButtonBuilder()
    .setCustomId(`submit_proof_${contract.id}`)
    .setLabel("Submit Proof")
    .setStyle(ButtonStyle.Success);

  const row = new ActionRowBuilder<ButtonBuilder>().addComponents(submitButton);

  await newChannel.send({
    content: `<@${contractorId}>`,
    embeds: [instructionsEmbed.toJSON()],
    components: [row],
  });
  await interaction.editReply(
    `You have accepted the contract! Please proceed to <#${newChannel.id}>.`,
  );
}

async function handleSubmitProof(interaction: ButtonInteraction) {
  const contractId = parseInt(interaction.customId.split("_")[2] as string);
  const contract = await Contract.findByPk(contractId);

  if (!contract)
    return interaction.reply({
      content: "Contract not found.",
      ephemeral: true,
    });
  if (interaction.user.id !== contract.contractorId)
    return interaction.reply({
      content: "Only the contractor can submit proof.",
      ephemeral: true,
    });
  if (contract.status !== "ACCEPTED")
    return interaction.reply({
      content: "Proof can only be submitted for accepted contracts.",
      ephemeral: true,
    });

  await interaction.deferReply({ ephemeral: true });

  // Lock channel for contractor
  const channel = interaction.channel as TextChannel;
  await channel.permissionOverwrites.edit(contract.contractorId as string, {
    SendMessages: false,
  });

  // Add creator to channel
  await channel.permissionOverwrites.create(contract.creatorId as string, {
    ViewChannel: true,
    SendMessages: true,
  });

  await contract.update({ status: "PROOF_PROVIDED" });

  // Remove the "Submit Proof" button from the previous message
  await interaction.message.edit({ components: [] });

  const verificationEmbed = new EmbedBuilder()
    .setTitle("Proof Submitted for Review")
    .setDescription(
      `<@${contract.creatorId}>, the contractor has submitted proof above. Please verify if it is correct.`,
    )
    .setColor(0xffa500);

  const correctButton = new ButtonBuilder()
    .setCustomId(`proof_correct_${contract.id}`)
    .setLabel("Correct")
    .setStyle(ButtonStyle.Success);

  const incorrectButton = new ButtonBuilder()
    .setCustomId(`proof_incorrect_${contract.id}`)
    .setLabel("Incorrect")
    .setStyle(ButtonStyle.Danger);

  const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
    correctButton,
    incorrectButton,
  );

  await channel.send({
    content: `<@${contract.creatorId}>`,
    embeds: [verificationEmbed.toJSON()],
    components: [row],
  });
  await interaction.editReply(
    "Proof submitted. The contract creator has been pinged to verify.",
  );
}

async function handleProofDecision(
  interaction: ButtonInteraction,
  isCorrect: boolean,
) {
  const contractId = parseInt(interaction.customId.split("_")[2] as string);
  const contract = await Contract.findByPk(contractId);

  if (!contract)
    return interaction.reply({
      content: "Contract not found.",
      ephemeral: true,
    });
  if (interaction.user.id !== contract.creatorId)
    return interaction.reply({
      content: "Only the creator can verify proof.",
      ephemeral: true,
    });
  if (contract.status !== "PROOF_PROVIDED")
    return interaction.reply({
      content: "Proof is not currently pending review.",
      ephemeral: true,
    });

  await interaction.deferUpdate(); // Acknowledge button press without new ephemeral reply

  const channel = interaction.channel as TextChannel;

  if (isCorrect) {
    await contract.update({ status: "MEETUP_ESTABLISHED" });

    // Unlock channel for contractor to talk
    await channel.permissionOverwrites.edit(contract.contractorId as string, {
      SendMessages: true,
    });

    // Remove correct/incorrect buttons
    await interaction.message.edit({ components: [] });

    const meetupEmbed = new EmbedBuilder()
      .setTitle("Proof Accepted - Arrange Meetup")
      .setDescription(
        `<@${contract.creatorId}> and <@${contract.contractorId}>, the proof has been verified. \n\nPlease use this channel to establish a mutual date and time to meet up in-game and transfer the items. \n\nThe auto-repost timer for this contract is now paused.\n\nOnce the items have been successfully delivered, click the button below.`,
      )
      .setColor(0x00ff00);

    const deliveredButton = new ButtonBuilder()
      .setCustomId(`delivery_completed_${contract.id}`)
      .setLabel("Delivery Completed")
      .setStyle(ButtonStyle.Primary);

    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
      deliveredButton,
    );

    await channel.send({ embeds: [meetupEmbed.toJSON()], components: [row] });
  } else {
    // Revert status to ACCEPTED
    await contract.update({ status: "ACCEPTED" });

    // Unlock channel for contractor so they can send new proof
    await channel.permissionOverwrites.edit(contract.contractorId as string, {
      SendMessages: true,
    });

    // Remove correct/incorrect buttons
    await interaction.message.edit({ components: [] });

    const incorrectEmbed = new EmbedBuilder()
      .setTitle("Proof Rejected")
      .setDescription(
        `<@${contract.creatorId}> has marked the proof as incorrect. \n\nPlease discuss what was wrong, and <@${contract.contractorId}> can submit new proof below.`,
      )
      .setColor(0xff0000);

    const submitButton = new ButtonBuilder()
      .setCustomId(`submit_proof_${contract.id}`)
      .setLabel("Submit New Proof")
      .setStyle(ButtonStyle.Success);

    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
      submitButton,
    );

    await channel.send({
      content: `<@${contract.contractorId}>`,
      embeds: [incorrectEmbed.toJSON()],
      components: [row],
    });
  }
}

async function handleDeliveryCompleted(interaction: ButtonInteraction) {
  const contractId = parseInt(interaction.customId.split("_")[2] as string);
  const contract = await Contract.findByPk(contractId);

  if (!contract)
    return interaction.reply({
      content: "Contract not found.",
      ephemeral: true,
    });
  // Allow either party to click it
  if (
    interaction.user.id !== contract.contractorId &&
    interaction.user.id !== contract.creatorId
  ) {
    return interaction.reply({
      content: "Only the contractor or creator can mark this completed.",
      ephemeral: true,
    });
  }
  if (contract.status !== "MEETUP_ESTABLISHED")
    return interaction.reply({
      content: "Delivery cannot be completed right now.",
      ephemeral: true,
    });

  await interaction.deferUpdate();

  await contract.update({ status: "DELIVERED" });

  const channel = interaction.channel as TextChannel;

  // Lock channel for contractor
  await channel.permissionOverwrites.edit(contract.contractorId as string, {
    SendMessages: false,
  });

  // Remove delivery button
  await interaction.message.edit({ components: [] });

  const paymentEmbed = new EmbedBuilder()
    .setTitle("Delivery Completed - Awaiting Payment")
    .setDescription(
      `<@${contract.creatorId}>, the delivery has been marked as complete! \n\nPlease transfer **${contract.reward.toLocaleString()} aUEC** to the contractor in-game.\n\nUpload a screenshot of the completed mo.Trader transaction here as proof, then click "Payment Sent".`,
    )
    .setColor(0x0099ff);

  const paymentButton = new ButtonBuilder()
    .setCustomId(`payment_sent_${contract.id}`)
    .setLabel("Payment Sent")
    .setStyle(ButtonStyle.Success);

  const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
    paymentButton,
  );

  await channel.send({
    content: `<@${contract.creatorId}>`,
    embeds: [paymentEmbed.toJSON()],
    components: [row],
  });
}

async function handlePaymentSent(interaction: ButtonInteraction) {
  const contractId = parseInt(interaction.customId.split("_")[2] as string);
  const contract = await Contract.findByPk(contractId);

  if (!contract)
    return interaction.reply({
      content: "Contract not found.",
      ephemeral: true,
    });
  if (interaction.user.id !== contract.creatorId)
    return interaction.reply({
      content: "Only the creator can confirm payment.",
      ephemeral: true,
    });
  if (contract.status !== "DELIVERED")
    return interaction.reply({
      content: "Payment cannot be confirmed yet.",
      ephemeral: true,
    });

  await interaction.deferUpdate();

  await contract.update({ status: "COMPLETED" });

  const channel = interaction.channel as TextChannel;

  // Remove payment button
  await interaction.message.edit({ components: [] });

  const completedEmbed = new EmbedBuilder()
    .setTitle("Contract Completed!")
    .setDescription(
      `<@${contract.contractorId}>, you have been paid! This contract is now fully complete.\n\nThis channel will be archived and automatically deleted in 2 months.`,
    )
    .setColor(0x00ff00);

  await channel.send({
    content: `<@${contract.contractorId}>`,
    embeds: [completedEmbed.toJSON()],
  });

  // Update original message in the board
  const contractsChannelId = process.env.CONTRACTS_CHANNEL_ID;
  if (contractsChannelId && contract.messageId) {
    const boardChannel = interaction.client.channels.cache.get(
      contractsChannelId,
    ) as BaseGuildTextChannel;
    if (boardChannel) {
      try {
        const originalMessage = await boardChannel.messages.fetch(
          contract.messageId,
        );
        if (originalMessage) {
          const boardEmbed = EmbedBuilder.from(originalMessage.embeds[0] as any)
            .setColor(0x808080) // Gray for completed
            .setTitle(`✅ Contract #${contract.id} - COMPLETED`);
          await originalMessage.edit({ embeds: [boardEmbed.toJSON()] });
        }
      } catch (e) {
        console.log("Could not update original board message.");
      }
    }
  }
}
