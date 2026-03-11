import { Handler } from 'express'
import { Codes } from '../utils/codeStatus'
import { JsonApiResponseError } from '../utils/jsonApiResponses'
import { LogWarn } from '../utils/logger'
import {
  createTokenService,
  generatePasswordService,
  introspectService,
  registerClientService,
  revokeAllSessionsService,
  revokeOldSessionsService,
  revokeSessionService,
  verifyTokenService
} from '../services/oauth.service'

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

    const oauthService = await registerClientService(
      url,
      name,
      client_secret,
      req
    )

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

    const oauthService = await createTokenService(
      url,
      client_id,
      client_secret,
      req
    )

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

    const oauthService = await revokeAllSessionsService(
      url,
      client_id,
      client_secret,
      req
    )

    status = oauthService.status
    return res.status(status).json(oauthService.response)
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

    const oauthService = await revokeSessionService(
      url,
      client_id,
      client_secret,
      token,
      req
    )

    status = oauthService.status
    return res.status(status).json(oauthService.response)
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

    const oauthService = await introspectService(
      url,
      client_id,
      client_secret,
      token
    )

    status = oauthService.status
    return res.status(status).json(oauthService.response)
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

    const oauthService = await revokeOldSessionsService(
      url,
      client_id,
      client_secret,
      req
    )

    status = oauthService.status
    return res.status(status).json(oauthService.response)
  } catch (error) {
    LogWarn('revokeOldSessions', 'V1', error)
    return res.status(status).json(JsonApiResponseError(error, url))
  }
}

export const generatePassword: Handler = async (req, res) => {
  const url = req.originalUrl
  let status = Codes.success

  try {
    const oauthService = await generatePasswordService(url)

    status = oauthService.status
    return res.status(status).json(oauthService.response)
  } catch (error) {
    LogWarn('generatePassword', 'V1', error)
    return res.status(Codes.errorServer).json(JsonApiResponseError(error, url))
  }
}
