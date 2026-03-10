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
import { verifyToken as verifyJwt } from '../utils/tokens'
import { JwtPayload } from '../entities/jwt.entities'
import { LogWarn } from '../utils/logger'
import { AuditEventType, logEvent } from '../services/audit.service'
import { createTokenService, registerClientService, verifyTokenService } from '../services/oauth.service'

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

    const oauthService = await registerClientService(url, name, client_secret, req)

    status = oauthService.status
    return res.status(status).json(oauthService.response)
  } catch (error) {
    LogWarn('registerClient', 'V1', error)
    return res.status(status).json(JsonApiResponseError(error, url))
  }
}

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

    const oauthService = await createTokenService(url, client_id, client_secret, req)

    status = oauthService.status
    return res.status(status).json(oauthService.response)
  } catch (error) {
    LogWarn('createToken', 'V1', error)
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
          code: 'OAUTH-ERROR-005',
          suggestions: 'Verifique el token en los atributos de la solicitud.',
          title: 'Token faltante.'
        },
        status,
        'El token es obligatorio'
      )
    }

    const oauthService = await verifyTokenService(url, token, req)

    status = oauthService.status
    return res.status(status).json(oauthService.response)
  } catch (error) {
    LogWarn('verifyToken', 'V1', error)
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
          code: 'OAUTH-ERROR-004',
          suggestions: 'Verifique las credenciales del cliente en la solicitud.',
          title: 'Cliente no autorizado.'
        },
        status,
        'Cliente no encontrado o inactivo'
      )
    }

    const ok = await argon2.verify(client.secret_hash, client_secret)
    if (!ok) {
      status = Codes.unauthorized
      throw new ErrorException(
        {
          code: 'OAUTH-ERROR-004',
          suggestions: 'Verifique las credenciales del cliente en la solicitud.',
          title: 'Cliente no autorizado.'
        },
        status,
        'El cliente no pudo ser autenticado'
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

    await logEvent(AuditEventType.TOKEN_REVOKED, client, { msg: 'Cierre masivo de sesiones: Todas las sesiones activas del cliente han sido invalidadas.', type: 'all' }, req)

    status = Codes.success
    return res.status(status).json(
      JsonApiResponseData(
        'revocation',
        {
          revoked: true,
          message: 'Se han revocado todas las sesiones del cliente.'
        },
        url
      )
    )
  } catch (error) {
    LogWarn('revokeAllSessions', 'V1', error)
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
          code: 'OAUTH-ERROR-005',
          suggestions: 'Verifique el token en los atributos de la solicitud.',
          title: 'Token faltante.'
        },
        status,
        'El token es obligatorio'
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
          code: 'OAUTH-ERROR-004',
          suggestions: 'Verifique las credenciales del cliente en la solicitud.',
          title: 'Cliente no autorizado.'
        },
        status,
        'Cliente no encontrado o inactivo'
      )
    }

    const ok = await argon2.verify(client.secret_hash, client_secret)
    if (!ok) {
      status = Codes.unauthorized
      throw new ErrorException(
        {
          code: 'OAUTH-ERROR-004',
          suggestions: 'Verifique las credenciales del cliente en la solicitud.',
          title: 'Cliente no autorizado.'
        },
        status,
        'El cliente no pudo ser autenticado'
      )
    }

    const decoded = await verifyJwt(token).catch((e: any) => {
      status = Codes.unauthorized
      throw new ErrorException(
        {
          code: 'OAUTH-ERROR-006',
          suggestions: 'El token podría estar mal formado o ser inválido.',
          title: 'Fallo en la verificación del token.'
        },
        status,
        e.message || 'El token es inválido.'
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
          code: 'OAUTH-ERROR-009',
          suggestions: 'Asegúrese de que el token pertenece a este cliente.',
          title: 'Sesión no encontrada.'
        },
        status,
        'La sesión asociada con este token no existe o no pertenece a este cliente.'
      )
    }

    session.revoked_at = new Date()
    await session.save()

    await logEvent(AuditEventType.TOKEN_REVOKED, client, { msg: 'Cierre de sesión individual completado.', session_id: session.id, type: 'single' }, req)

    status = Codes.success
    return res.status(status).json(
      JsonApiResponseData(
        'revocation',
        {
          revoked: true,
          message: 'La sesión asociada con el token ha sido revocada.'
        },
        url
      )
    )
  } catch (error) {
    LogWarn('revokeSession', 'V1', error)
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
          code: 'OAUTH-ERROR-005',
          suggestions: 'Verifique el token en los atributos de la solicitud.',
          title: 'Token faltante.'
        },
        status,
        'El token es obligatorio'
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
          code: 'OAUTH-ERROR-004',
          suggestions: 'Verifique las credenciales del cliente en la solicitud.',
          title: 'Cliente no autorizado.'
        },
        status,
        'Cliente no encontrado o inactivo'
      )
    }

    const ok = await argon2.verify(client.secret_hash, client_secret)
    if (!ok) {
      status = Codes.unauthorized
      throw new ErrorException(
        {
          code: 'OAUTH-ERROR-004',
          suggestions: 'Verifique las credenciales del cliente en la solicitud.',
          title: 'Cliente no autorizado.'
        },
        status,
        'El cliente no pudo ser autenticado'
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
    LogWarn('introspect', 'V1', error)
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
          code: 'OAUTH-ERROR-004',
          suggestions: 'Verifique las credenciales del cliente en la solicitud.',
          title: 'Cliente no autorizado.'
        },
        status,
        'Cliente no encontrado o inactivo'
      )
    }

    const ok = await argon2.verify(client.secret_hash, client_secret)
    if (!ok) {
      status = Codes.unauthorized
      throw new ErrorException(
        {
          code: 'OAUTH-ERROR-004',
          suggestions: 'Verifique las credenciales del cliente en la solicitud.',
          title: 'Cliente no autorizado.'
        },
        status,
        'El cliente no pudo ser autenticado'
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

    await logEvent(AuditEventType.TOKEN_REVOKED, client, { msg: 'Depuración automática: Cierre de sesiones con más de 24 horas de inactividad.', count: affectedCount, type: 'old_sessions' }, req)

    status = Codes.success
    return res.status(status).json(
      JsonApiResponseData(
        'revocation',
        {
          revoked: true,
          count: affectedCount,
          message: `Se han revocado ${affectedCount} sesiones con más de 24 horas de antigüedad.`
        },
        url
      )
    )
  } catch (error) {
    LogWarn('revokeOldSessions', 'V1', error)
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
    LogWarn('generatePassword', 'V1', error)
    return res.status(Codes.errorServer).json(JsonApiResponseError(error, url))
  }
}
