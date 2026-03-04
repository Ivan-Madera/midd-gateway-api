import { Router } from 'express'
import {
  createToken,
  registerClient,
  verifyToken,
  revokeAllSessions,
  revokeSession,
  introspect,
  revokeOldSessions,
  generatePassword
} from '../controllers/oauth.controller'
import {
  contentTypeValidator,
  methodValidator
} from '../middlewares/authentication.middleware'
import { authLimiter } from '../config/rateLimit'

const router = Router()

/**
 * @swagger
 * /api/v1/oauth/token:
 *   post:
 *     tags: ["[V1] OAuth"]
 *     summary: Issue access token
 *     description: Issue a new access token for a client.
 *     requestBody:
 *       content:
 *         application/vnd.api+json:
 *           schema:
 *             type: object
 *             properties:
 *               data:
 *                 type: object
 *                 properties:
 *                   type:
 *                     type: string
 *                     default: oauth
 *                   attributes:
 *                     type: object
 *                     properties:
 *                       client_id:
 *                         type: string
 *                       client_secret:
 *                         type: string
 *             example:
 *               data:
 *                 type: oauth
 *                 attributes:
 *                   client_id: "78b02e73-aa49-410a-b50a-e374d9f94218"
 *                   client_secret: "your-super-secret-string"
 *     responses:
 *       200:
 *         description: Request exitoso.
 *       400:
 *          description: Ocurrio un error durante el proceso.
 *       401:
 *          description: Usuario / Cliente no autorizado.
 *       415:
 *         description: Tipo de medio no soportado.
 *       422:
 *         description: Contenido no procesable.
 *       500:
 *         description: Mensaje de error.
 */
router.post('/oauth/token', [authLimiter, methodValidator, contentTypeValidator], createToken)

/**
 * @swagger
 * /api/v1/oauth/client:
 *   post:
 *     tags: ["[V1] OAuth"]
 *     summary: Register a new client
 *     description: Register a new client for OAuth.
 *     requestBody:
 *       content:
 *         application/vnd.api+json:
 *           schema:
 *             type: object
 *             properties:
 *               data:
 *                 type: object
 *                 properties:
 *                   type:
 *                     type: string
 *                     default: oauth
 *                   attributes:
 *                     type: object
 *                     properties:
 *                       name:
 *                         type: string
 *                       client_secret:
 *                         type: string
 *             example:
 *               data:
 *                 type: oauth
 *                 attributes:
 *                   name: "My Awesome App"
 *                   client_secret: "your-super-secret-string"
 *     responses:
 *       200:
 *         description: Request exitoso.
 *       400:
 *          description: Ocurrio un error durante el proceso.
 *       415:
 *         description: Tipo de medio no soportado.
 *       422:
 *         description: Contenido no procesable.
 *       500:
 *         description: Mensaje de error.
 */
router.post(
  '/oauth/client',
  [methodValidator, contentTypeValidator],
  registerClient
)

/**
 * @swagger
 * /api/v1/oauth/verify:
 *   post:
 *     tags: ["[V1] OAuth"]
 *     summary: Verify access token
 *     description: Verify an existing OAuth access token.
 *     requestBody:
 *       content:
 *         application/vnd.api+json:
 *           schema:
 *             type: object
 *             properties:
 *               data:
 *                 type: object
 *                 properties:
 *                   type:
 *                     type: string
 *                     default: oauth
 *                   attributes:
 *                     type: object
 *                     properties:
 *                       token:
 *                         type: string
 *             example:
 *               data:
 *                 type: oauth
 *                 attributes:
 *                   token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9"
 *     responses:
 *       200:
 *         description: Request exitoso.
 *       400:
 *          description: Ocurrio un error durante el proceso.
 *       401:
 *          description: Token no valido o expirado.
 *       415:
 *         description: Tipo de medio no soportado.
 *       422:
 *         description: Contenido no procesable.
 *       500:
 *         description: Mensaje de error.
 */
router.post(
  '/oauth/verify',
  [methodValidator, contentTypeValidator],
  verifyToken
)

/**
 * @swagger
 * /api/v1/oauth/revoke-all:
 *   post:
 *     tags: ["[V1] OAuth"]
 *     summary: Revoke all sessions for a client
 *     description: Revoke all active sessions and their associated tokens for a specific client.
 *     requestBody:
 *       content:
 *         application/vnd.api+json:
 *           schema:
 *             type: object
 *             properties:
 *               data:
 *                 type: object
 *                 properties:
 *                   type:
 *                     type: string
 *                     default: oauth
 *                   attributes:
 *                     type: object
 *                     properties:
 *                       client_id:
 *                         type: string
 *                       client_secret:
 *                         type: string
 *             example:
 *               data:
 *                 type: oauth
 *                 attributes:
 *                   client_id: "78b02e73-aa49-410a-b50a-e374d9f94218"
 *                   client_secret: "your-super-secret-string"
 *     responses:
 *       200:
 *         description: All sessions revoked successfully.
 *       401:
 *          description: Client unauthorized.
 *       500:
 *         description: Server error.
 */
router.post(
  '/oauth/revoke-all',
  [methodValidator, contentTypeValidator],
  revokeAllSessions
)

/**
 * @swagger
 * /api/v1/oauth/revoke-session:
 *   post:
 *     tags: ["[V1] OAuth"]
 *     summary: Revoke a specific session
 *     description: Revoke a specific session and its associated token for a client.
 *     requestBody:
 *       content:
 *         application/vnd.api+json:
 *           schema:
 *             type: object
 *             properties:
 *               data:
 *                 type: object
 *                 properties:
 *                   type:
 *                     type: string
 *                     default: oauth
 *                   attributes:
 *                     type: object
 *                     properties:
 *                       client_id:
 *                         type: string
 *                       client_secret:
 *                         type: string
 *                       token:
 *                         type: string
 *             example:
 *               data:
 *                 type: oauth
 *                 attributes:
 *                   client_id: "78b02e73-aa49-410a-b50a-e374d9f94218"
 *                   client_secret: "your-super-secret-string"
 *                   token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9"
 *     responses:
 *       200:
 *         description: Session revoked successfully.
 *       404:
 *          description: Session not found.
 *       401:
 *          description: Client unauthorized.
 *       500:
 *         description: Server error.
 */
router.post(
  '/oauth/revoke-session',
  [methodValidator, contentTypeValidator],
  revokeSession
)

/**
 * @swagger
 * /api/v1/oauth/introspect:
 *   post:
 *     tags: ["[V1] OAuth"]
 *     summary: Introspect access token
 *     description: Returns metadata about the token, including whether it is active or not (RFC 7662).
 *     requestBody:
 *       content:
 *         application/vnd.api+json:
 *           schema:
 *             type: object
 *             properties:
 *               data:
 *                 type: object
 *                 properties:
 *                   type:
 *                     type: string
 *                     default: oauth
 *                   attributes:
 *                     type: object
 *                     properties:
 *                       client_id:
 *                         type: string
 *                       client_secret:
 *                         type: string
 *                       token:
 *                         type: string
 *             example:
 *               data:
 *                 type: oauth
 *                 attributes:
 *                   client_id: "78b02e73-aa49-410a-b50a-e374d9f94218"
 *                   client_secret: "your-super-secret-string"
 *                   token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9"
 *     responses:
 *       200:
 *         description: Introspection result returned.
 *       401:
 *          description: Client unauthorized.
 *       500:
 *         description: Server error.
 */
router.post(
  '/oauth/introspect',
  [methodValidator, contentTypeValidator],
  introspect
)

/**
 * @swagger
 * /api/v1/oauth/revoke-old:
 *   post:
 *     tags: ["[V1] OAuth"]
 *     summary: Revoke old sessions
 *     description: Revoke all sessions for a client created more than 24 hours ago.
 *     requestBody:
 *       content:
 *         application/vnd.api+json:
 *           schema:
 *             type: object
 *             properties:
 *               data:
 *                 type: object
 *                 properties:
 *                   type:
 *                     type: string
 *                     default: oauth
 *                   attributes:
 *                     type: object
 *                     properties:
 *                       client_id:
 *                         type: string
 *                       client_secret:
 *                         type: string
 *             example:
 *               data:
 *                 type: oauth
 *                 attributes:
 *                   client_id: "78b02e73-aa49-410a-b50a-e374d9f94218"
 *                   client_secret: "your-super-secret-string"
 *     responses:
 *       200:
 *         description: Old sessions revoked successfully.
 *       401:
 *          description: Client unauthorized.
 *       500:
 *         description: Server error.
 */
router.post(
  '/oauth/revoke-old',
  [methodValidator, contentTypeValidator],
  revokeOldSessions
)


/**
 * @swagger
 * /api/v1/oauth/password-generator:
 *   post:
 *     tags: ["[V1] OAuth"]
 *     summary: Generate a robust password
 *     description: Returns a 16-character cryptographically secure password including uppercase, lowercase, numbers, and symbols. Requires an empty POST payload or any JSON API compatible payload.
 *     requestBody:
 *       content:
 *         application/vnd.api+json:
 *     responses:
 *       200:
 *         description: Password generated successfully.
 *       401:
 *          description: Client unauthorized.
 *       500:
 *         description: Server error.
 */
router.post(
  '/oauth/password-generator',
  [authLimiter, methodValidator, contentTypeValidator],
  generatePassword
)

export { router as OAuth }
