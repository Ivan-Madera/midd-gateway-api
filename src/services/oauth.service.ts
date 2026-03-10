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
import { createAccessToken } from '../utils/tokens'
import { verifyToken as verifyJwt } from '../utils/tokens'
import Session from '../database/models/Session.model'
import env from '../config/callEnv'
import { JwtPayload } from '../entities/jwt.entities'

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

export const createTokenService = async (
  url: string,
  clientId: string,
  clientSecret: string,
  req: any
) => {
  let status = Codes.errorServer

  try {
    const client = await Client.findOne({
      where: {
        client_id: clientId,
        is_active: true
      }
    })

    if (!client) {
      status = Codes.unauthorized
      throw new ErrorException(
        {
          code: 'OAUTH-ERROR-004',
          suggestions:
            'Verifique las credenciales del cliente en la solicitud.',
          title: 'Cliente no autorizado.'
        },
        status,
        'Cliente no encontrado o inactivo'
      )
    }

    // Check for lockout
    if (client.lockout_until && client.lockout_until > new Date()) {
      status = Codes.unauthorized
      throw new ErrorException(
        {
          code: 'OAUTH-ERROR-010',
          suggestions: 'Espere unos minutos antes de intentar nuevamente.',
          title: 'Cuenta bloqueada.'
        },
        status,
        `Demasiados intentos fallidos. Intente de nuevo después de ${client.lockout_until.toISOString()}`
      )
    }

    const ok = await argon2.verify(client.secret_hash, clientSecret)
    if (!ok) {
      // Increment failed attempts
      client.failed_attempts += 1
      if (client.failed_attempts >= 5) {
        client.lockout_until = new Date(Date.now() + 15 * 60 * 1000) // 15 minutes lockout
        await logEvent(
          AuditEventType.CLIENT_LOCKED,
          client,
          {
            msg: 'Cliente bloqueado temporalmente por seguridad tras exceder el límite de 5 intentos fallidos.'
          },
          req
        )
      }
      await client.save()

      await logEvent(
        AuditEventType.FAILED_LOGIN_ATTEMPT,
        client,
        {
          msg: 'Intento de inicio de sesión fallido. Credenciales incorrectas.',
          client_id: clientId
        },
        req
      )

      status = Codes.unauthorized
      throw new ErrorException(
        {
          code: 'OAUTH-ERROR-004',
          suggestions:
            'Verifique las credenciales del cliente en la solicitud.',
          title: 'Cliente no autorizado.'
        },
        status,
        'El cliente no pudo ser autenticado'
      )
    }

    // Reset failed attempts on success
    client.failed_attempts = 0
    client.lockout_until = null
    await client.save()

    const session = await Session.create({
      client_id: client.id,
      expires_at: new Date(Date.now() + env.TOKEN_LIFETIME * 60 * 1000)
    })

    const accessToken = createAccessToken({
      uid: client.id,
      sid: session.id
    })

    await logEvent(
      AuditEventType.TOKEN_CREATED,
      client,
      {
        msg: 'Token de acceso generado exitosamente. Inicio de sesión registrado.',
        session_id: session.id
      },
      req
    )

    status = Codes.success
    return JsonApiResponseGeneric(
      status,
      JsonApiResponseData('session', { accessToken }, url)
    )
  } catch (error) {
    LogWarn('createTokenService', 'V1', error)
    return JsonApiResponseGeneric(status, JsonApiResponseError(error, url))
  }
}

export const verifyTokenService = async (
  url: string,
  token: string,
  req: any
) => {
  let status = Codes.errorServer

  try {
    const decoded = (await verifyJwt(token).catch((e: any) => {
      status = Codes.unauthorized
      throw new ErrorException(
        {
          code: 'OAUTH-ERROR-006',
          suggestions: 'Renueve el token utilizando el endpoint oauth/token.',
          title: 'Fallo en la verificación del token.'
        },
        status,
        e.message || 'El token es inválido o ha expirado.'
      )
    })) as JwtPayload

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
        await logEvent(
          AuditEventType.TOKEN_REUSE_DETECTION,
          client,
          {
            session_id: session.id,
            msg: 'ALERTA DE SEGURIDAD: Reutilización de token detectada. Todas las sesiones del cliente han sido revocadas preventivamente.'
          },
          req
        )
      }

      status = Codes.unauthorized
      throw new ErrorException(
        {
          code: 'OAUTH-ERROR-008',
          suggestions: 'Autentíquese de nuevo para obtener un nuevo token.',
          title: 'Sesión revocada.'
        },
        status,
        'La sesión asociada con este token ha sido revocada o ya no existe.'
      )
    }

    // Invalida la sesión para que el token funcione como single-use
    session.revoked_at = new Date()
    await session.save()

    status = Codes.success
    return JsonApiResponseGeneric(
      status,
      JsonApiResponseData(
        'verification',
        {
          valid: true
        },
        url
      )
    )
  } catch (error) {
    LogWarn('verifyTokenService', 'V1', error)
    return JsonApiResponseGeneric(status, JsonApiResponseError(error, url))
  }
}
