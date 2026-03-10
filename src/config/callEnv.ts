import dotenv from 'dotenv'
import Joi from 'joi'
dotenv.config()

interface IEnv {
  ENV: string
  PORT: number
  DB_DATABASE: string
  DB_USERNAME: string
  DB_PASSWORD: string
  DB_HOST: string
  DB_PORT: number
  SECRET_KEY: string
  MAX_CONNECTION: number
  MIN_CONNECTION: number
  DB_ACQUIRE: number
  DB_IDLE: number
  DB_EVICT: number
  TOKEN_LIFETIME: number
}

const schema = Joi.object({
  ENV: Joi.string().required(),
  PORT: Joi.number().required(),
  DB_DATABASE: Joi.string().required(),
  DB_USERNAME: Joi.string().required(),
  DB_PASSWORD: Joi.string().required(),
  DB_HOST: Joi.string().required(),
  DB_PORT: Joi.number().required(),
  SECRET_KEY: Joi.string().required(),
  MAX_CONNECTION: Joi.number().empty('').default(72),
  MIN_CONNECTION: Joi.number().empty('').default(0),
  DB_ACQUIRE: Joi.number().empty('').default(30000),
  DB_IDLE: Joi.number().empty('').default(5000),
  DB_EVICT: Joi.number().empty('').default(5000),
  TOKEN_LIFETIME: Joi.number().empty('').default(3600)
})
  .unknown()
  .required()

const { error, value: env } = schema.validate(process.env)

if (error) {
  throw new Error(
    `Error en la configuración de las variables de entorno: ${error.message}`
  )
}

export default env as IEnv
