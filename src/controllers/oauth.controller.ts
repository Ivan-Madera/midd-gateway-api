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
import { createAccessToken, verifyToken as verifyJwt } from '../utils/tokens'
import { v4 as uuidv4 } from 'uuid'
import { JwtPayload } from '../entities/jwt.entities'

export const createToken: Handler = async (req, res) => {
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
        client_id: client_id,
        is_active: true
      }
    })

    if (!client) {
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

    const existingClient = await Client.findOne({ where: { name, is_active: true } })
    if (existingClient) {
      status = Codes.badRequest
      throw new ErrorException(
        {
          code: 'OAUTH-004',
          suggestions: 'Choose a different name for the client component.',
          title: 'Client name already in use.'
        },
        status,
        'A client with the specified name already exists.'
      )
    }

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

export const verifyToken: Handler = async (req, res) => {
  const url = req.originalUrl
  let status = Codes.errorServer

  try {
    const {
      body: {
        data: { attributes }
      }
    } = req

    const { token } = attributes

    if (!token) {
      status = Codes.badRequest
      throw new ErrorException(
        {
          code: 'OAUTH-002',
          suggestions: 'Check the token in the request payload.',
          title: 'Token missing.'
        },
        status,
        'Token is required'
      )
    }

    const decoded = await verifyJwt(token).catch((e: any) => {
      status = Codes.unauthorized
      throw new ErrorException(
        {
          code: 'OAUTH-003',
          suggestions: 'Renew the token utilizing the oauth/token endpoint.',
          title: 'Token verification failed.'
        },
        status,
        e.message || 'The token is invalid or has expired.'
      )
    }) as JwtPayload

    const session = await Session.findOne({
      where: {
        id: decoded.sid
      }
    })

    if (!session || session.revoked_at !== null) {
      // if (session && session.revoked_at !== null) {
      //   // Al detectar el uso de un token ya revocado, se revocan todos los tokens activos del mismo cliente por seguridad.
      //   await Session.update(
      //     { revoked_at: new Date() },
      //     {
      //       where: {
      //         client_id: session.client_id,
      //         revoked_at: null
      //       }
      //     }
      //   )
      // }

      status = Codes.unauthorized
      throw new ErrorException(
        {
          code: 'OAUTH-005',
          suggestions: 'Authenticate again to get a new token.',
          title: 'Session revoked.'
        },
        status,
        'The session associated with this token has been revoked or no longer exists.'
      )
    }

    // Invalida la sesión para que el token funcione como single-use
    session.revoked_at = new Date()
    await session.save()

    status = Codes.success
    return res.status(status).json(
      JsonApiResponseData(
        'verification',
        {
          valid: true
        },
        url
      )
    )
  } catch (error) {
    status = Codes.unauthorized
    return res.status(status).json(JsonApiResponseError(error, url))
  }
}

export const revokeAllSessions: Handler = async (req, res) => {
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
        client_id: client_id,
        is_active: true
      }
    })

    if (!client) {
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

    await Session.update(
      { revoked_at: new Date() },
      {
        where: {
          client_id: client.id,
          revoked_at: null
        }
      }
    )

    status = Codes.success
    return res.status(status).json(
      JsonApiResponseData(
        'revocation',
        {
          revoked: true,
          message: 'All sessions for the client have been revoked.'
        },
        url
      )
    )
  } catch (error) {
    return res.status(status).json(JsonApiResponseError(error, url))
  }
}

export const revokeSession: Handler = async (req, res) => {
  const url = req.originalUrl
  let status = Codes.errorServer

  try {
    const {
      body: {
        data: { attributes }
      }
    } = req

    const { client_id, client_secret, token } = attributes

    if (!token) {
      status = Codes.badRequest
      throw new ErrorException(
        {
          code: 'OAUTH-002',
          suggestions: 'Check the token in the request payload.',
          title: 'Token missing.'
        },
        status,
        'Token is required'
      )
    }

    const client = await Client.findOne({
      where: {
        client_id: client_id,
        is_active: true
      }
    })

    if (!client) {
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

    const decoded = await verifyJwt(token).catch((e: any) => {
      status = Codes.unauthorized
      throw new ErrorException(
        {
          code: 'OAUTH-003',
          suggestions: 'The token might be malformed or invalid.',
          title: 'Token verification failed.'
        },
        status,
        e.message || 'The token is invalid.'
      )
    }) as JwtPayload

    const session = await Session.findOne({
      where: {
        id: decoded.sid,
        client_id: client.id
      }
    })

    if (!session) {
      status = Codes.badRequest
      throw new ErrorException(
        {
          code: 'OAUTH-006',
          suggestions: 'Ensure the token belongs to this client.',
          title: 'Session not found.'
        },
        status,
        'The session associated with this token does not exist or does not belong to this client.'
      )
    }

    session.revoked_at = new Date()
    await session.save()

    status = Codes.success
    return res.status(status).json(
      JsonApiResponseData(
        'revocation',
        {
          revoked: true,
          message: 'The session associated with the token has been revoked.'
        },
        url
      )
    )
  } catch (error) {
    return res.status(status).json(JsonApiResponseError(error, url))
  }
}
