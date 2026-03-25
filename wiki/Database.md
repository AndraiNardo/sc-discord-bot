# Database Schema

The bot uses a local SQLite database and Sequelize ORM to manage its data. There are three primary tables: `Contracts`, `Materials`, and `Locations`.

## Contracts Table (`contracts`)

The core table that stores all player-to-player material requests.

| Column | Type | Description |
| :--- | :--- | :--- |
| `id` | INTEGER | Primary Key, Auto-incrementing ID. |
| `creatorId` | STRING | Discord User ID of the Contract Maker. |
| `contractorId` | STRING | Discord User ID of the player who accepted the job (nullable). |
| `materialId` | STRING | Foreign Key linking to the `Materials` table. |
| `locationId` | STRING | Foreign Key linking to the `Locations` table. |
| `quantity` | INTEGER | Amount of material requested. |
| `quality` | INTEGER | The quality of the material (default: 500). Values below 500 trigger warnings upon creation. |
| `reward` | FLOAT | The payout in aUEC. |
| `deadline` | DATE | Expiration timestamp for the contract. |
| `status` | ENUM | Current state (`OPEN`, `ACCEPTED`, `PROOF_PROVIDED`, `MEETUP_ESTABLISHED`, `DELIVERED`, `COMPLETED`). |
| `channelId` | STRING | Discord Channel ID of the private contract thread (nullable). |
| `messageId` | STRING | Discord Message ID of the public contract embed (nullable). |
| `createdAt` | DATE | Timestamp of creation (managed by Sequelize). |
| `updatedAt` | DATE | Timestamp of last update (managed by Sequelize). |

## Materials Table (`materials`)

Stores the types of items that can be requested, usually populated via the UEXCorp API.

| Column | Type | Description |
| :--- | :--- | :--- |
| `id` | STRING | Primary Key, e.g., 'LARI', 'GOLD'. Extracted from UEX code or generated from name. |
| `name` | STRING | Display name of the material (e.g., 'Laranite'). |
| `createdAt` | DATE | Timestamp of creation (managed by Sequelize). |
| `updatedAt` | DATE | Timestamp of last update (managed by Sequelize). |

## Locations Table (`locations`)

Stores valid drop-off points, usually populated via the UEXCorp API.

| Column | Type | Description |
| :--- | :--- | :--- |
| `id` | STRING | Primary Key, internal UEX ID. |
| `name` | STRING | Display name of the location (e.g., 'Lorville'). |
| `type` | STRING | Classification of the location (e.g., 'City', 'Station'). |
| `createdAt` | DATE | Timestamp of creation (managed by Sequelize). |
| `updatedAt` | DATE | Timestamp of last update (managed by Sequelize). |

## Relationships

*   A **Contract** belongs to one **Material** (`materialId`).
*   A **Contract** belongs to one **Location** (`locationId`).

*Note: Sequelize models explicitly define associated properties (e.g., `public readonly Material?: Material;`) for improved TypeScript type safety.*
