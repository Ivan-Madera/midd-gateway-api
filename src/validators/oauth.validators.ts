import { body } from 'express-validator'
import { validateResult } from '../middlewares/validation.middleware'

export const registerClientValidator = [
  body('data').notEmpty().isObject(),
  body('data.type').notEmpty().isString(),
  body('data.attributes').notEmpty().isObject(),
  body('data.attributes.name').notEmpty().isString(),
  body('data.attributes.client_secret').notEmpty().isString(),
  (req: any, res: any, next: any) => {
    validateResult(req, res, next)
  }
]

export const createTokenValidator = [
  body('data').notEmpty().isObject(),
  body('data.type').notEmpty().isString(),
  body('data.attributes').notEmpty().isObject(),
  body('data.attributes.client_id').notEmpty().isString(),
  body('data.attributes.client_secret').notEmpty().isString(),
  (req: any, res: any, next: any) => {
    validateResult(req, res, next)
  }
]

export const verifyTokenValidator = [
  body('data').notEmpty().isObject(),
  body('data.type').notEmpty().isString(),
  body('data.attributes').notEmpty().isObject(),
  body('data.attributes.token').notEmpty().isString(),
  (req: any, res: any, next: any) => {
    validateResult(req, res, next)
  }
]

export const revokeAllSessionsValidator = [
  body('data').notEmpty().isObject(),
  body('data.type').notEmpty().isString(),
  body('data.attributes').notEmpty().isObject(),
  body('data.attributes.client_id').notEmpty().isString(),
  body('data.attributes.client_secret').notEmpty().isString(),
  (req: any, res: any, next: any) => {
    validateResult(req, res, next)
  }
]

export const revokeSessionValidator = [
  body('data').notEmpty().isObject(),
  body('data.type').notEmpty().isString(),
  body('data.attributes').notEmpty().isObject(),
  body('data.attributes.client_id').notEmpty().isString(),
  body('data.attributes.client_secret').notEmpty().isString(),
  body('data.attributes.token').notEmpty().isString(),
  (req: any, res: any, next: any) => {
    validateResult(req, res, next)
  }
]

export const introspectValidator = [
  body('data').notEmpty().isObject(),
  body('data.type').notEmpty().isString(),
  body('data.attributes').notEmpty().isObject(),
  body('data.attributes.client_id').notEmpty().isString(),
  body('data.attributes.client_secret').notEmpty().isString(),
  body('data.attributes.token').notEmpty().isString(),
  (req: any, res: any, next: any) => {
    validateResult(req, res, next)
  }
]

export const revokeOldSessionsValidator = [
  body('data').notEmpty().isObject(),
  body('data.type').notEmpty().isString(),
  body('data.attributes').notEmpty().isObject(),
  body('data.attributes.client_id').notEmpty().isString(),
  body('data.attributes.client_secret').notEmpty().isString(),
  (req: any, res: any, next: any) => {
    validateResult(req, res, next)
  }
]
