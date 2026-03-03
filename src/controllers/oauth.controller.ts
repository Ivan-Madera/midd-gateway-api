import { Handler } from 'express'
import { Codes } from '../utils/codeStatus'
import {
  JsonApiResponseData,
  JsonApiResponseError
} from '../utils/jsonApiResponses'
import Client from '../database/models/Client.model'
import { ErrorException } from '../utils/Exceptions'
import argon2 from 'argon2'
import Session from '../database/models/Session.model'
import { createAccessToken } from '../utils/tokens'
import { v4 as uuidv4 } from 'uuid'

export const issueToken: Handler = async (req, res) => {
  const url = req.originalUrl
  let status = Codes.errorServer

  try {
    const {
      body: {
        data: { attributes }
      }
    } = req

    const { client_id, client_secret } = attributes

    const client = await Client.findOne({
      where: {
        client_id: client_id
      }
    })

    if (!client || !client.is_active) {
      status = Codes.unauthorized
      throw new ErrorException(
        {
          code: 'OAUTH-001',
          suggestions: 'Check the client credentials in the request.',
          title: 'Client unauthorized.'
        },
        status,
        'Client not found or inactive'
      )
    }

    const ok = await argon2.verify(client.secret_hash, client_secret)
    if (!ok) {
      status = Codes.unauthorized
      throw new ErrorException(
        {
          code: 'OAUTH-001',
          suggestions: 'Check the client credentials in the request.',
          title: 'Client unauthorized.'
        },
        status,
        "Client can't be authenticated"
      )
    }

    const session = await Session.create({
      client_id: client.id,
      expires_at: new Date(Date.now() + 10 * 60 * 1000)
    })

    const accessToken = createAccessToken({
      uid: client.id,
      sid: session.id
    })

    status = Codes.success
    return res
      .status(status)
      .json(JsonApiResponseData('session', { accessToken }, url))
  } catch (error) {
    return res.status(status).json(JsonApiResponseError(error, url))
  }
}

export const registerClient: Handler = async (req, res) => {
  const url = req.originalUrl
  let status = Codes.errorServer

  try {
    const {
      body: {
        data: { attributes }
      }
    } = req

    const { name, client_secret } = attributes

    const secretHash = await argon2.hash(client_secret, {
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

    status = Codes.success
    return res.status(status).json(
      JsonApiResponseData(
        'client',
        {
          client_id: newClient.client_id
        },
        url
      )
    )
  } catch (error) {
    return res.status(status).json(JsonApiResponseError(error, url))
  }
}
