import jwt from 'jsonwebtoken'
import env from '../config/callEnv'

export const createAccessToken = (payload: any) => {
  return jwt.sign(payload, env.SECRET_KEY, {
    algorithm: 'HS512',
    expiresIn: '5m',
    issuer: 'authorization-gateway'
  })
}

export async function verifyToken(token: string) {
  return jwt.verify(token, env.SECRET_KEY, {
    issuer: 'authorization-gateway',
  })
}
