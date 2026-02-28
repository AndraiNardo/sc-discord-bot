import cron from "node-cron";
import { Op } from "sequelize";
import { Contract } from "./models/Contract.js";
import { Client, BaseGuildTextChannel, EmbedBuilder } from "discord.js";
import dotenv from "dotenv";

dotenv.config();

export function setupCronJobs(client: Client) {
  console.log("Setting up cron jobs...");

  // 1. Relist Expired Contracts
  // Runs every 5 minutes
  cron.schedule("*/5 * * * *", async () => {
    try {
      const now = new Date();
      const expiredContracts = await Contract.findAll({
        where: {
          status: "OPEN",
          deadline: { [Op.lt]: now },
        },
      });

      if (expiredContracts.length > 0) {
        console.log(
          `Found ${expiredContracts.length} expired contracts. Relisting...`,
        );
        const contractsChannelId = process.env.CONTRACTS_CHANNEL_ID;

        let channel: BaseGuildTextChannel | undefined;
        if (
          contractsChannelId &&
          contractsChannelId !== "your_contracts_board_channel_id_here"
        ) {
          channel = client.channels.cache.get(
            contractsChannelId,
          ) as BaseGuildTextChannel;
        }

        for (const contract of expiredContracts) {
          // Extend deadline by 24 hours for simplicity
          const newDeadline = new Date(now);
          newDeadline.setHours(newDeadline.getHours() + 24);
          await contract.update({ deadline: newDeadline });

          if (channel && contract.messageId) {
            try {
              const message = await channel.messages.fetch(contract.messageId);
              if (message) {
                const embed = EmbedBuilder.from(message.embeds[0] as any);

                // Update the deadline field
                const fields = embed.data.fields || [];
                const deadlineFieldIndex = fields.findIndex(
                  (f) => f.name === "Deadline",
                );
                if (deadlineFieldIndex !== -1) {
                  fields[deadlineFieldIndex]!.value =
                    `<t:${Math.floor(newDeadline.getTime() / 1000)}:R>`;
                  embed.setFields(fields);
                }

                await message.edit({ embeds: [embed.toJSON()] });
                console.log(`Contract #${contract.id} relisted.`);
              }
            } catch (err) {
              console.error(
                `Failed to update message for contract #${contract.id}:`,
                err,
              );
            }
          }
        }
      }
    } catch (error) {
      console.error("Error running expiration cron job:", error);
    }
  });

  // 2. Cleanup Archived Channels
  // Runs once a month on the 1st at midnight
  cron.schedule("0 0 1 * *", async () => {
    try {
      console.log("Running monthly cleanup for archived channels...");
      const twoMonthsAgo = new Date();
      twoMonthsAgo.setMonth(twoMonthsAgo.getMonth() - 2);

      const oldContracts = await Contract.findAll({
        where: {
          status: "COMPLETED",
          updatedAt: { [Op.lt]: twoMonthsAgo },
          channelId: { [Op.not]: null },
        },
      });

      console.log(`Found ${oldContracts.length} old contracts to clean up.`);

      for (const contract of oldContracts) {
        if (contract.channelId) {
          try {
            const guildId = process.env.GUILD_ID;
            if (guildId) {
              const guild = client.guilds.cache.get(guildId);
              if (guild) {
                const channel = guild.channels.cache.get(contract.channelId);
                if (channel) {
                  await channel.delete(
                    "Monthly cleanup of old completed contracts",
                  );
                  console.log(`Deleted channel for contract #${contract.id}`);
                }
              }
            }
          } catch (err) {
            console.error(
              `Failed to delete channel for contract #${contract.id}:`,
              err,
            );
          }
          // Nullify channelId to prevent re-attempts
          await contract.update({ channelId: null });
        }
      }
    } catch (error) {
      console.error("Error running cleanup cron job:", error);
    }
  });
}
