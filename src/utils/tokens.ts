import jwt from 'jsonwebtoken'
import env from '../config/callEnv'

export const createAccessToken = (payload: any) => {
  return jwt.sign(payload, env.SECRET_KEY, {
    algorithm: 'HS512',
    expiresIn: '5m',
    issuer: 'authorization-gateway'
  })
}