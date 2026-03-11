import { Attributes, Transaction, UpdateOptions } from "sequelize"
import Session, { SessionCreationAttributes, SessionInstance } from "../../database/models/Session.model"

export const createSession = async (
  values: SessionCreationAttributes,
  transaction?: Transaction
): Promise<SessionInstance> => {
  return await Session.create(values, {
    transaction
  })
}

export const updateSession = async (
  values: Partial<SessionCreationAttributes>,
  options: UpdateOptions<Attributes<SessionInstance>>
): Promise<number[]> => {
  return await Session.update(values, options)
}