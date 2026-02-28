import { Model, DataTypes } from "sequelize";
import sequelize from "../database.js";
import { Material } from "./Material.js";
import { Location } from "./Location.js";

export class Contract extends Model {
  public id!: number;
  public creatorId!: string;
  public contractorId!: string | null;
  public materialId!: string;
  public locationId!: string;
  public quantity!: number;
  public reward!: number;
  public deadline!: Date;
  public status!:
    | "OPEN"
    | "ACCEPTED"
    | "PROOF_PROVIDED"
    | "MEETUP_ESTABLISHED"
    | "DELIVERED"
    | "COMPLETED";
  public channelId!: string | null;
  public messageId!: string | null;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Contract.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    creatorId: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    contractorId: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    materialId: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    locationId: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    quantity: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    reward: {
      type: DataTypes.FLOAT,
      allowNull: false,
    },
    deadline: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM(
        "OPEN",
        "ACCEPTED",
        "PROOF_PROVIDED",
        "MEETUP_ESTABLISHED",
        "DELIVERED",
        "COMPLETED",
      ),
      defaultValue: "OPEN",
      allowNull: false,
    },
    channelId: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    messageId: {
      type: DataTypes.STRING,
      allowNull: true,
    },
  },
  {
    sequelize,
    modelName: "Contract",
    tableName: "contracts",
    timestamps: true,
  },
);

Contract.belongsTo(Material, { foreignKey: "materialId" });
Contract.belongsTo(Location, { foreignKey: "locationId" });
