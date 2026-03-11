import { DataTypes, type Model, type Optional } from 'sequelize'
import { sequelize } from '../config'

export interface AuditLogAttributes {
  id: number
  event_type: string
  client_id: number | null
  external_client_id: string | null
  details: any | null
  ip_address: string | null
  user_agent: string | null
  created_at: Date
}

export interface AuditLogCreationAttributes extends Optional<
  AuditLogAttributes,
  | 'id'
  | 'client_id'
  | 'external_client_id'
  | 'details'
  | 'ip_address'
  | 'user_agent'
  | 'created_at'
> {}

export interface AuditLogInstance
  extends
    Model<AuditLogAttributes, AuditLogCreationAttributes>,
    AuditLogAttributes {}

const AuditLog = sequelize.define<AuditLogInstance>(
  'audit_logs',
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
      allowNull: false
    },
    event_type: {
      type: DataTypes.STRING,
      allowNull: false
    },
    client_id: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    external_client_id: {
      type: DataTypes.UUID,
      allowNull: true
    },
    details: {
      type: DataTypes.JSON,
      allowNull: true
    },
    ip_address: {
      type: DataTypes.STRING,
      allowNull: true
    },
    user_agent: {
      type: DataTypes.STRING,
      allowNull: true
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
      allowNull: false
    }
  },
  {
    tableName: 'audit_logs',
    timestamps: false
  }
)

export default AuditLog
