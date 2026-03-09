import { v4 as uuidv4 } from 'uuid'
import {
  type IJsonApiData,
  type IJsonApiResponseData,
  type IJsonApiResponseError,
  type IJsonApiResponseGeneric,
  type IJsonApiResponseMessage
} from '../entities/jsonApiResponses.entities'
import { Codes } from './codeStatus'

export const JsonApiResponseData = (
  type: string,
  attributes: any | any[],
  links: string,
  relationships?: any
): IJsonApiResponseData => {
  const uuid = uuidv4()
  const attributesArr = Array.isArray(attributes) ? attributes : [attributes]
  const result = attributesArr.map((obj) => {
    const mappedResult: IJsonApiData = {
      type,
      id: uuid,
      attributes: obj,
      links: {
        self: links
      }
    }

    if (relationships) {
      mappedResult.relationships = relationships
    }

    return mappedResult
  })

  const data = result.length === 1 ? result[0] : result

  return {
    data
  }
}

export const JsonApiResponseMessage = (
  type: string,
  message: string,
  links: string
): IJsonApiResponseMessage => {
  const uuid = uuidv4()

  return {
    data: {
      type,
      id: uuid,
      attributes: {
        message
      },
      links: {
        self: links
      }
    }
  }
}

export const JsonApiResponseError = (
  error: any,
  url: string
): IJsonApiResponseError => {
  const code = error.code || 'OAUTH-ERROR-000'
  const status = error.status || 500
  const pointer = url
  const suggestions = error.suggestions || 'Por favor intente nuevamente más tarde'
  const title = error.title || 'Error interno del servidor'
  const message = error.message || 'Ocurrió un error desconocido'

  return {
    code,
    status,
    source: {
      pointer
    },
    suggestedActions: suggestions,
    title,
    detail: message
  }
}

export const JsonApiResponseGeneric = (
  status: number,
  response:
    | IJsonApiResponseData
    | IJsonApiResponseMessage
    | IJsonApiResponseError
): IJsonApiResponseGeneric => {
  return {
    status,
    response
  }
}

export const JsonApiResponseValidator = (
  pointer: string,
  detail: string
): IJsonApiResponseError => {
  return {
    code: 'OAUTH-ERROR-001',
    status: Codes.unprocessableContent,
    source: {
      pointer
    },
    suggestedActions: 'Verifique el cuerpo de la solicitud.',
    title: 'Cuerpo de solicitud inválido.',
    detail
  }
}
