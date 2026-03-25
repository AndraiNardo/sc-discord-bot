# Data Synchronization

The Star Citizen bot relies on accurate, up-to-date information regarding materials and locations. To achieve this, it integrates with the UEXCorp API.

## How it Works

The core synchronization logic is handled in `src/syncUexData.ts`. It performs two main tasks:

1.  **Commodities (Materials):** Fetches the latest commodities from UEXCorp and updates the `Material` database table. It attempts to map properties like `code` or `name` to the local IDs.
2.  **Destinations (Locations):** Fetches destinations and updates the `Location` database table, extracting properties like the destination `name` and `type` (e.g., Station, City).

The data fetching is executed on a schedule defined in `src/cron.ts` using `node-cron`.

## Configuration

To enable live data synchronization, you must set the `UEXCORP_API_KEY` in your `.env` file.

```env
UEX_API_KEY=your_uex_api_key_here
```

## Fallback (Mock Data)

If the `UEX_API_KEY` is not provided (or is set to a placeholder like `your_..._here` thanks to `isValidConfigValue`), or if the API request fails (e.g., due to network issues or rate limiting), the bot will automatically fall back to using mock data.

The `mockData()` function within `syncUexData.ts` seeds the database with a predefined list of common materials (e.g., Laranite, Agricium) and locations (e.g., Port Olisar, Lorville). This ensures the bot remains functional even during outages or in development environments without API access.

## Manual Sync

You can manually trigger a synchronization (useful for initial setup or testing) by running the script directly:

```bash
npx tsx src/syncUexData.ts
```
