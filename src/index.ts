import {
  Client,
  GatewayIntentBits,
  Collection,
  REST,
  Routes,
  SlashCommandBuilder,
  OAuth2Scopes,
  PermissionFlagsBits,
  Events,
} from "discord.js";
import type { Interaction, ClientOptions } from "discord.js";
import dotenv from "dotenv";
import sequelize from "./database.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { setupCronJobs } from "./cron.js";
import { isValidConfigValue } from "./utils/config.js";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export interface Command {
  data: SlashCommandBuilder | any;
  execute: (interaction: Interaction) => Promise<any>;
  autocomplete?: (interaction: Interaction) => Promise<any>;
}

// Define extended client to hold commands
export class CustomClient extends Client {
  commands: Collection<string, Command>;

  constructor(options: ClientOptions) {
    super(options);
    this.commands = new Collection();
  }
}

const client = new CustomClient({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages],
});

const token = process.env.DISCORD_TOKEN;

const commandsPath = path.join(__dirname, "commands");
const commandFiles = fs
  .readdirSync(commandsPath)
  .filter((file) => file.endsWith(".ts") || file.endsWith(".js"));

const commandsData: any[] = [];

for (const file of commandFiles) {
  const filePath = path.join(commandsPath, file);
  const commandUrl = `file://${filePath}`;
  try {
    const module = await import(commandUrl);
    const command = module.default;
    if ("data" in command && "execute" in command) {
      client.commands.set(command.data.name, command);
      commandsData.push(command.data.toJSON());
    } else {
      console.log(
        `[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`,
      );
    }
  } catch (error) {
    console.error(`Failed to load command at ${filePath}:`, error);
  }
}


client.once(Events.ClientReady, async () => {
  console.log(`Logged in as ${client.user?.tag}!`);

  try {
    await sequelize.authenticate();
    console.log("Database connected.");

    if (client.user && token) {
      try {
        const rest = new REST({ version: '10' }).setToken(token);
        console.log('Started refreshing application (/) commands.');

        await rest.put(
          Routes.applicationCommands(client.user.id),
          { body: commandsData },
        );

        console.log('Successfully reloaded application (/) commands.');
      } catch (error) {
        console.error('Failed to register application commands:', error);
      }

      const inviteLink = `https://discord.com/oauth2/authorize?client_id=${client.user.id}&permissions=8&scope=bot%20applications.commands`;
      console.log(`Invite link: ${inviteLink}`);
    }
  } catch (error) {
    console.error("Database connection failed:", error);
  }
});

client.on(Events.InteractionCreate, async (interaction: Interaction) => {
  if (interaction.isChatInputCommand()) {
    const command = client.commands.get(interaction.commandName);
    if (!command) return;

    try {
      await command.execute(interaction);
    } catch (error) {
      console.error(error);
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
      console.error(error);
    }
  } else if (interaction.isButton()) {
    import("./interactions.js")
      .then((module) => module.handleButtonInteraction(interaction))
      .catch(console.error);
  }
});


setupCronJobs(client);

if (isValidConfigValue(token)) {
  client.login(token);
} else {
  console.warn("DISCORD_TOKEN not set or is default. Bot will not connect.");
}

export default client;
