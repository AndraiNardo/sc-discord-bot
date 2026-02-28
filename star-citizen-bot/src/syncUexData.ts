import axios from "axios";
import dotenv from "dotenv";
import sequelize from "./database.js";
import { Material } from "./models/Material.js";
import { Location } from "./models/Location.js";
import { fileURLToPath } from "url";

dotenv.config();

const UEXCORP_API_KEY = process.env.UEXCORP_API_KEY;
const UEXCORP_API_BASE = "https://api.uexcorp.space/2.0";

export async function syncUexData() {
  if (!UEXCORP_API_KEY || UEXCORP_API_KEY === "your_uexcorp_api_key_here") {
    console.warn(
      "UEXCORP_API_KEY not found in environment variables. Mocking data instead.",
    );
    await mockData();
    return;
  }

  try {
    console.log("Fetching materials from UEXCorp...");
    // Endpoint examples for UEXCorp 2.0 (these may need to be adjusted based on their actual documentation)
    const commoditiesRes = await axios.get(`${UEXCORP_API_BASE}/commodities`, {
      headers: { "api-key": UEXCORP_API_KEY },
    });

    if (commoditiesRes.data && commoditiesRes.data.data) {
      const materials = commoditiesRes.data.data.map((c: any) => ({
        id: c.code || c.name.replace(/\s+/g, "_").toUpperCase(),
        name: c.name,
      }));
      await Material.bulkCreate(materials, { ignoreDuplicates: true });
      console.log(`Synced ${materials.length} materials.`);
    }

    console.log("Fetching locations from UEXCorp...");
    const destinationsRes = await axios.get(
      `${UEXCORP_API_BASE}/destinations`,
      {
        headers: { "api-key": UEXCORP_API_KEY },
      },
    );

    if (destinationsRes.data && destinationsRes.data.data) {
      const locations = destinationsRes.data.data.map((d: any) => ({
        id: d.id.toString(),
        name: d.name,
        type: d.type?.name || "Unknown",
      }));
      await Location.bulkCreate(locations, { ignoreDuplicates: true });
      console.log(`Synced ${locations.length} locations.`);
    }
  } catch (error) {
    console.error("Failed to sync data from UEXCorp:", error);
    console.log("Falling back to mock data...");
    await mockData();
  }
}

async function mockData() {
  const materials = [
    { id: "LARI", name: "Laranite" },
    { id: "AGRI", name: "Agricium" },
    { id: "GOLD", name: "Gold" },
    { id: "TITA", name: "Titanium" },
    { id: "SCRAP", name: "Scrap" },
    { id: "MEDS", name: "Medical Supplies" },
  ];

  const locations = [
    { id: "LOC_1", name: "Port Olisar", type: "Station" },
    { id: "LOC_2", name: "Grim HEX", type: "Station" },
    { id: "LOC_3", name: "Lorville", type: "City" },
    { id: "LOC_4", name: "Area18", type: "City" },
    { id: "LOC_5", name: "New Babbage", type: "City" },
    { id: "LOC_6", name: "Orison", type: "City" },
  ];

  await Material.bulkCreate(materials, { ignoreDuplicates: true });
  await Location.bulkCreate(locations, { ignoreDuplicates: true });
  console.log("Mock data seeded.");
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  (async () => {
    await sequelize.authenticate();
    await syncUexData();
    process.exit(0);
  })();
}
