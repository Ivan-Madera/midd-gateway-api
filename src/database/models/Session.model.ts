import { DataTypes, type Model, type Optional } from 'sequelize'
import { sequelize } from '../config'

interface SessionAttributes {
  id: number
  client_id: number
  expires_at: Date
  revoked_at: Date | null
  created_at: Date
  updated_at: Date
}

export interface SessionCreationAttributes extends Optional<
  SessionAttributes,
  'id' | 'revoked_at' | 'created_at' | 'updated_at'
> {}

export interface SessionInstance
  extends
    Model<SessionAttributes, SessionCreationAttributes>,
    SessionAttributes {}

const Session = sequelize.define<SessionInstance>(
  'sessions',
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    client_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    expires_at: {
      type: DataTypes.DATE,
      allowNull: false
    },
    revoked_at: {
      type: DataTypes.DATE,
      allowNull: true
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
    tableName: 'sessions',
    timestamps: false
  }
)

export default Session
