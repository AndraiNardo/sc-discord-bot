import { Sequelize } from "sequelize";
import dotenv from "dotenv";

dotenv.config();

const sequelize = new Sequelize({
  dialect: "sqlite",
  storage: process.env.DATABASE_STORAGE || "database.sqlite",
  logging: false, // Set to true to see SQL queries in the console
});

export default sequelize;
