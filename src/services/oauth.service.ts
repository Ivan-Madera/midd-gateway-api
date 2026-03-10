import Client from '../database/models/Client.model'
import { Codes } from '../utils/codeStatus'
import { ErrorException } from '../utils/Exceptions'
import { v4 as uuidv4 } from 'uuid'
import { AuditEventType, logEvent } from './audit.service'
import argon2 from 'argon2'
import {
  JsonApiResponseData,
  JsonApiResponseError,
  JsonApiResponseGeneric
} from '../utils/jsonApiResponses'
import { LogWarn } from '../utils/logger'

export const registerClientService = async (
  url: string,
  name: string,
  clientSecret: string,
  req: any
) => {
  let status = Codes.errorServer

  try {
    const existingClient = await Client.findOne({
      where: { name, is_active: true }
    })

    if (existingClient) {
      status = Codes.badRequest
      throw new ErrorException(
        {
          code: 'OAUTH-ERROR-007',
          suggestions: 'Elija un nombre diferente para el componente cliente.',
          title: 'Nombre de cliente ya en uso.'
        },
        status,
        'Ya existe un cliente con el nombre especificado.'
      )
    }

    const secretHash = await argon2.hash(clientSecret, {
      type: argon2.argon2id,
      memoryCost: 19456,
      timeCost: 2,
      parallelism: 1
    })

    const clientId = uuidv4()

    const newClient = await Client.create({
      name,
      client_id: clientId,
      secret_hash: secretHash,
      is_active: true
    })

    await logEvent(
      AuditEventType.CLIENT_REGISTERED,
      newClient,
      { msg: 'Registro de nuevo cliente completado satisfactoriamente.', name },
      req
    )

    status = Codes.success
    return JsonApiResponseGeneric(
      status,
      JsonApiResponseData(
        'client',
        {
          client_id: newClient.client_id
        },
        url
      )
    )
  } catch (error) {
    LogWarn('registerClientService', 'V1', error)
    return JsonApiResponseGeneric(status, JsonApiResponseError(error, url))
  }
}
