import { Model, DataTypes } from "sequelize";
import sequelize from "../database.js";

export class Location extends Model {
  public id!: string;
  public name!: string;
  public type!: string;
}

Location.init(
  {
    id: {
      type: DataTypes.STRING,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    type: {
      type: DataTypes.STRING,
      allowNull: true,
    },
  },
  {
    sequelize,
    modelName: "Location",
    tableName: "locations",
    timestamps: false,
  },
);
