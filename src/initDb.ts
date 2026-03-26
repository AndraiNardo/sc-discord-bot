import sequelize from "./database.js";
import { Material } from "./models/Material.js";
import { Location } from "./models/Location.js";
import { Contract } from "./models/Contract.js";

export async function initDb() {
  try {
    await sequelize.authenticate();
    console.log("Database connection has been established successfully.");

    // Sync models (creates tables if they don't exist)
    await sequelize.sync({ alter: true });
    console.log("Models synchronized successfully.");
  } catch (error) {
    console.error("Unable to connect to the database:", error);
  }
}

initDb();
