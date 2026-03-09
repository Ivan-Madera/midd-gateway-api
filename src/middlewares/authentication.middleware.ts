import { validationErrors } from '../errors/validation.errors'
import { Codes } from '../utils/codeStatus'
import { ErrorException } from '../utils/Exceptions'
import { JsonApiResponseError } from '../utils/jsonApiResponses'

export const methodValidator = (req: any, res: any, next: any): void => {
  const url = req.originalUrl
  let status = Codes.errorServer

  try {
    const httpMethod = req.method

    if (httpMethod !== 'POST') {
      status = Codes.notAcceptable
      throw new ErrorException(
        validationErrors.HTTP_METHOD,
        status,
        'El método HTTP no está permitido para este endpoint, verifique la solicitud.'
      )
    }

    return next()
  } catch (error) {
    return res.status(status).json(JsonApiResponseError(error, url))
  }
}

export const contentTypeValidator = (req: any, res: any, next: any): void => {
  const url = req.originalUrl
  let status = Codes.errorServer

  try {
    const content = req.get('Content-Type')

    if (content !== 'application/vnd.api+json') {
      status = Codes.unsupportedMedia
      throw new ErrorException(
        validationErrors.CONTENT_TYPE,
        status,
        'Content-Type no permitido para este endpoint, verifique la solicitud.'
      )
    }

    return next()
  } catch (error) {
    return res.status(status).json(JsonApiResponseError(error, url))
  }
}
