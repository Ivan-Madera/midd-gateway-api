import { Handler } from 'express'
import { Op } from 'sequelize'
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
import { LogWarn } from '../utils/logger'
import { AuditEventType, logEvent } from '../services/audit.service'

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

    // Check for lockout
    if (client.lockout_until && client.lockout_until > new Date()) {
      status = Codes.unauthorized
      throw new ErrorException(
        {
          code: 'OAUTH-007',
          suggestions: 'Wait a few minutes before trying again.',
          title: 'Account locked.'
        },
        status,
        `Too many failed attempts. Try again after ${client.lockout_until.toISOString()}`
      )
    }

    const ok = await argon2.verify(client.secret_hash, client_secret)
    if (!ok) {
      // Increment failed attempts
      client.failed_attempts += 1
      if (client.failed_attempts >= 5) {
        client.lockout_until = new Date(Date.now() + 15 * 60 * 1000) // 15 minutes lockout
        await logEvent(AuditEventType.CLIENT_LOCKED, client, { reason: 'Too many failed attempts' }, req)
      }
      await client.save()

      await logEvent(AuditEventType.FAILED_LOGIN_ATTEMPT, client, { client_id: client_id }, req)

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

    // Reset failed attempts on success
    client.failed_attempts = 0
    client.lockout_until = null
    await client.save()

    const session = await Session.create({
      client_id: client.id,
      expires_at: new Date(Date.now() + 5 * 60 * 1000)
    })

    const accessToken = createAccessToken({
      uid: client.id,
      sid: session.id
    })

    await logEvent(AuditEventType.TOKEN_CREATED, client, { session_id: session.id }, req)

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

    await logEvent(AuditEventType.CLIENT_REGISTERED, newClient, { name }, req)

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
      if (session && session.revoked_at !== null) {
        // Al detectar el uso de un token ya revocado, se revocan todos los tokens activos del mismo cliente por seguridad.
        await Session.update(
          { revoked_at: new Date() },
          {
            where: {
              client_id: session.client_id,
              revoked_at: null
            }
          }
        )

        const client = await Client.findByPk(session.client_id)
        await logEvent(AuditEventType.TOKEN_REUSE_DETECTION, client, {
          session_id: session.id,
          msg: 'Detectado uso de token ya revocado. Se han revocado todas las sesiones del cliente.'
        }, req)
      }

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

    await logEvent(AuditEventType.TOKEN_REVOKED, client, { type: 'all' }, req)

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

    await logEvent(AuditEventType.TOKEN_REVOKED, client, { session_id: session.id, type: 'single' }, req)

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

export const introspect: Handler = async (req, res) => {
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

    let active = false
    let introspectionData: any = { active }

    try {
      const decoded = await verifyJwt(token) as any
      const session = await Session.findOne({
        where: {
          id: decoded.sid,
          client_id: client.id
        }
      })

      if (session && session.revoked_at === null) {
        active = true
        introspectionData = {
          active,
          client_id: client.client_id,
          sub: client.name,
          sid: session.id,
          exp: Math.floor(session.expires_at.getTime() / 1000),
          iat: Math.floor(session.created_at.getTime() / 1000)
        }
      }
    } catch (e) {
      active = false
      LogWarn('OAuth', 'V1', e)
    }

    status = Codes.success
    return res.status(status).json(
      JsonApiResponseData(
        'introspection',
        introspectionData,
        url
      )
    )
  } catch (error) {
    return res.status(status).json(JsonApiResponseError(error, url))
  }
}

export const revokeOldSessions: Handler = async (req, res) => {
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

    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000)

    const [affectedCount] = await Session.update(
      { revoked_at: new Date() },
      {
        where: {
          client_id: client.id,
          revoked_at: null,
          created_at: {
            [Op.lt]: twentyFourHoursAgo
          }
        }
      }
    )

    await logEvent(AuditEventType.TOKEN_REVOKED, client, { count: affectedCount, type: 'old_sessions' }, req)

    status = Codes.success
    return res.status(status).json(
      JsonApiResponseData(
        'revocation',
        {
          revoked: true,
          count: affectedCount,
          message: `Revoked ${affectedCount} sessions older than 24 hours.`
        },
        url
      )
    )
  } catch (error) {
    return res.status(status).json(JsonApiResponseError(error, url))
  }
}

export const generatePassword: Handler = async (req, res) => {
  const url = req.originalUrl
  const status = Codes.success

  try {
    const defaultLength = 16
    const charsetLowercase = 'abcdefghijklmnopqrstuvwxyz'
    const charsetUppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
    const charsetNumbers = '0123456789'
    const charsetSymbols = '!@#$%^&*()-_=+[]{}|;:,.<>?'

    const allChars =
      charsetLowercase + charsetUppercase + charsetNumbers + charsetSymbols

    let password = ''
    let hasLowercase = false
    let hasUppercase = false
    let hasNumbers = false
    let hasSymbols = false

    // We keep generating until we hit a password that definitively satisfies all strict criteria
    while (
      !(hasLowercase && hasUppercase && hasNumbers && hasSymbols)
    ) {
      password = ''
      hasLowercase = false
      hasUppercase = false
      hasNumbers = false
      hasSymbols = false

      const { randomBytes } = await import('crypto')
      const buffer = randomBytes(defaultLength)

      for (let i = 0; i < defaultLength; i++) {
        const charIndex = buffer[i] % allChars.length
        const char = allChars[charIndex]

        if (charsetLowercase.includes(char)) hasLowercase = true
        if (charsetUppercase.includes(char)) hasUppercase = true
        if (charsetNumbers.includes(char)) hasNumbers = true
        if (charsetSymbols.includes(char)) hasSymbols = true

        password += char
      }
    }

    return res.status(status).json(
      JsonApiResponseData(
        'password',
        {
          password
        },
        url
      )
    )
  } catch (error) {
    return res.status(Codes.errorServer).json(JsonApiResponseError(error, url))
  }
}
