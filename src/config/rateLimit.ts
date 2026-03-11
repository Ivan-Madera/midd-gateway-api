import rateLimit from 'express-rate-limit'
import { type IJsonApiResponseError } from '../entities/jsonApiResponses.entities'

/**
 * General rate limiter applied to all routes.
 * Allows up to 1000 requests per IP every 15 minutes.
 */
export const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    code: 'RATE-001',
    status: 429,
    source: {
      pointer: '/api'
    },
    suggestedActions: 'Wait a few minutes before retrying.',
    title: 'Too Many Requests.',
    detail: 'You have exceeded the request limit. Please try again later.'
  } satisfies IJsonApiResponseError
})

/**
 * Strict rate limiter for authentication endpoints.
 * Allows up to 100 requests per IP every 15 minutes.
 */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    code: 'RATE-002',
    status: 429,
    source: {
      pointer: '/api/v1/oauth/token'
    },
    suggestedActions:
      'Wait 15 minutes before attempting new authentication requests.',
    title: 'Too Many Authentication Attempts.',
    detail:
      'You have exceeded the authentication request limit. Please try again later.'
  } satisfies IJsonApiResponseError
})
