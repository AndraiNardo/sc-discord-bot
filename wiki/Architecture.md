# Architecture

This document outlines the high-level architecture of the Star Citizen bot.

## Core Components

The bot is structured into several key areas:

1.  **Discord Interaction Layer (`discord.js`):**
    *   **Commands (`src/commands/`):** Slash commands for interacting with the bot. Uses `SlashCommandBuilder` and structured execution functions.
    *   **Interactions (`src/interactions.ts`):** Handles button clicks on contract embeds, progressing the contract through its various states.
    *   **Event Handling (`src/index.ts`):** Listens for events like `ready` and `interactionCreate` to route actions.

2.  **Data Layer (Sequelize & PostgreSQL):**
    *   **Models (`src/models/`):** Defines the schema for `Contract`, `Location`, and `Material`. Uses TypeScript decorators/classes for strong typing.
    *   **Connection (`src/database.ts`):** Establishes the connection to the PostgreSQL database using the `DATABASE_URL` environment variable.

3.  **Synchronization Layer (UEXCorp API):**
    *   **Data Fetching (`src/syncUexData.ts`):** Periodically polls the UEXCorp API to update the `Material` and `Location` tables. Includes a fallback mechanism (`mockData`) if the API is unavailable.
    *   **Scheduling (`src/cron.ts`):** Uses `node-cron` to schedule the sync task.

4.  **Utilities:**
    *   **Configuration (`src/utils/config.ts`):** Helpers like `isValidConfigValue` to ensure environment variables are correctly set and aren't just placeholder text.
