import { Transaction } from 'sequelize'
import Client, {
  ClientCreationAttributes,
  ClientInstance
} from '../../database/models/Client.model'

export const createClient = async (
  values: ClientCreationAttributes,
  transaction?: Transaction
): Promise<ClientInstance> => {
  return await Client.create(values, {
    transaction
  })
}
