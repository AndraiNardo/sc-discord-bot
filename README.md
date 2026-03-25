# Star Citizen Bot

This repository contains a Discord bot built with TypeScript and discord.js for managing in-game contracts for materials (minerals, minables, etc.) in Star Citizen. It allows authorized users to create contracts that other players can accept, complete, or cancel. The bot uses a PostgreSQL database via Sequelize to store data and synchronizes commodity and destination data from the UEXCorp 2.0 API.

## Prerequisites

- Node.js (v18 or higher recommended)
- PostgreSQL database
- A Discord Bot Token
- (Optional) UEXCorp API key (for data synchronization)

## Setup and Booting the Bot

1.  **Clone the repository:**
    ```bash
    git clone <repository_url>
    cd star-citizen-bot
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Configure environment variables:**
    Create a `.env` file in the `star-citizen-bot` directory and configure the following variables:
    ```env
    # Discord Configuration
    DISCORD_TOKEN=your_discord_bot_token
    CONTRACT_MAKER_ROLE_ID=your_role_id_for_contract_makers
    CONTRACTS_CHANNEL_ID=your_channel_id_for_posting_contracts

    # Database Configuration
    DATABASE_URL=postgres://user:password@localhost:5432/your_database_name

    # API Keys
    UEX_API_KEY=your_uex_api_key_here # Optional, for syncing data
    ```
    *Note: The bot uses a utility (`isValidConfigValue`) to check if variables like `DISCORD_TOKEN` are set and not using placeholder values like `your_..._here`.*

4.  **Initialize the Database:**
    The bot needs to create the necessary tables in your PostgreSQL database. Run the initialization script:
    ```bash
    npx tsx src/initDb.ts
    ```

5.  **Run the Bot:**
    *   **Development mode** (with auto-reload):
        ```bash
        npm run dev
        ```
    *   **Production mode**:
        Compile the TypeScript code and run the generated JavaScript:
        ```bash
        npx tsc
        node dist/index.js
        ```

## Features Overview

*   **Contract Management:** Create, accept, and manage material contracts directly within Discord. Contracts include material type, location, quantity, quality (default 500), and reward.
*   **Data Synchronization:** Automatically syncs commodity and destination data from UEXCorp, with a fallback to mock data if the API is unreachable.
*   **Automated Tasks:** Uses `node-cron` for scheduling tasks (e.g., syncing data).

For detailed documentation on how the bot works, its commands, and architecture, please refer to the [GitHub Wiki](https://github.com/your-username/star-citizen-bot/wiki).
