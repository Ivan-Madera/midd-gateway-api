import { Router } from 'express'
import { issueToken, registerClient } from '../controllers/oauth.controller'
import {
  contentTypeValidator,
  methodValidator
} from '../middlewares/authentication.middleware'

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
router.post('/oauth/token', [methodValidator, contentTypeValidator], issueToken)

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

export { router as OAuth }
