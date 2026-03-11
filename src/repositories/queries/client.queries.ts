import Client, { ClientInstance } from "../../database/models/Client.model"

export const findClientByPK = async (
  id: number,
  attributes?: string[]
): Promise<ClientInstance | null> => {
  return await Client.findByPk(id, {
    attributes
  })
}

export const findOneClientByID = async (
  clientId: string,
  attributes?: string[]
): Promise<ClientInstance | null> => {
  return await Client.findOne({
    where: {
      client_id: clientId,
      is_active: true
    },
    attributes
  })
}

export const findOneClientByName = async (
  name: string,
  attributes?: string[]
): Promise<ClientInstance | null> => {
  return await Client.findOne({
    where: {
      name,
      is_active: true
    },
    attributes
  })
}