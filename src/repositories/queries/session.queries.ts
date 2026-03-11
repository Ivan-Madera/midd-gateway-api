import Session, { SessionInstance } from '../../database/models/Session.model'

export const findOneSessionByID = async (
  sessionId: number,
  attributes?: string[]
): Promise<SessionInstance | null> => {
  return await Session.findOne({
    where: {
      id: sessionId
    },
    attributes
  })
}

export const findOneSessionByIDandClientID = async (
  sessionId: number,
  clientId: number,
  attributes?: string[]
): Promise<SessionInstance | null> => {
  return await Session.findOne({
    where: {
      id: sessionId,
      client_id: clientId
    },
    attributes
  })
}
