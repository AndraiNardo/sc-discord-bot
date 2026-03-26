import {
  Client,
  GatewayIntentBits,
  Collection,
  REST,
  Routes,
} from "discord.js";
import dotenv from "dotenv";
import sequelize from "./database.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { setupCronJobs } from "./cron.js";
import { isValidConfigValue } from "./utils/config.js";
import { logError } from "./utils/logger.js";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Define extended client to hold commands
export class CustomClient extends Client {
  commands: Collection<string, any>;

  constructor(options: any) {
    super(options);
    this.commands = new Collection();
  }
}

const client = new CustomClient({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages],
});

client.once("ready", async () => {
  console.log(`Logged in as ${client.user?.tag}!`);

  try {
    await sequelize.authenticate();
    console.log("Database connected.");
  } catch (error) {
    logError("Database connection failed", error);
  }
});

client.on("interactionCreate", async (interaction: any) => {
  if (interaction.isChatInputCommand()) {
    const command = client.commands.get(interaction.commandName);
    if (!command) return;

    try {
      await command.execute(interaction);
    } catch (error) {
      logError(`Error executing command ${interaction.commandName}`, error);
      if (interaction.replied || interaction.deferred) {
        await interaction.followUp({
          content: "There was an error while executing this command!",
          ephemeral: true,
        });
      } else {
        await interaction.reply({
          content: "There was an error while executing this command!",
          ephemeral: true,
        });
      }
    }
  } else if (interaction.isAutocomplete()) {
    const command = client.commands.get(interaction.commandName);
    if (!command) return;

    try {
      if (command.autocomplete) {
        await command.autocomplete(interaction);
      }
    } catch (error) {
      logError(`Error in autocomplete for command ${interaction.commandName}`, error);
    }
  } else if (interaction.isButton()) {
    import("./interactions.js")
      .then((module) => module.handleButtonInteraction(interaction))
      .catch((err) => logError("Error handling button interaction", err));
  }
});

const commandsPath = path.join(__dirname, "commands");
const commandFiles = fs
  .readdirSync(commandsPath)
  .filter((file) => file.endsWith(".ts") || file.endsWith(".js"));

for (const file of commandFiles) {
  const filePath = path.join(commandsPath, file);
  const commandUrl = `file://${filePath}`;
  import(commandUrl)
    .then((module) => {
      const command = module.default;
      if ("data" in command && "execute" in command) {
        client.commands.set(command.data.name, command);
      } else {
        console.log(
          `[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`,
        );
      }
    })
    .catch((err) => logError(`Error loading command from ${filePath}`, err));
}

setupCronJobs(client);

const token = process.env.DISCORD_TOKEN;
if (isValidConfigValue(token)) {
  client.login(token);
} else {
  console.warn("DISCORD_TOKEN not set or is default. Bot will not connect.");
}

export default client;
