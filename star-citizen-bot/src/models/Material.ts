import { Model, DataTypes } from "sequelize";
import sequelize from "../database.js";

export class Material extends Model {
  public id!: string;
  public name!: string;
}

Material.init(
  {
    id: {
      type: DataTypes.STRING,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
  },
  {
    sequelize,
    modelName: "Material",
    tableName: "materials",
    timestamps: false,
  },
);
