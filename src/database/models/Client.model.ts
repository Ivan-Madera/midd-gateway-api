import { DataTypes, type Model, type Optional } from 'sequelize'
import { sequelize } from '../config'

interface ClientAttributes {
  id: number
  name: string
  client_id: string
  secret_hash: string
  is_active: boolean
  created_at: Date
  updated_at: Date
}

export interface ClientCreationAttributes extends Optional<
  ClientAttributes,
  'id' | 'is_active' | 'created_at' | 'updated_at'
> {}

export interface ClientInstance
  extends Model<ClientAttributes, ClientCreationAttributes>, ClientAttributes {}

const Client = sequelize.define<ClientInstance>(
  'clients',
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
      allowNull: false
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    client_id: {
      type: DataTypes.UUID,
      unique: true,
      allowNull: false
    },
    secret_hash: {
      type: DataTypes.STRING,
      allowNull: false
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
      allowNull: false
    },
    updated_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
      allowNull: false
    }
  },
  {
    tableName: 'clients',
    timestamps: false
  }
)

export default Client
