import env from './callEnv'

export const options = {
  definition: {
    openapi: '3.1.1',
    info: {
      title: 'Midd Gateway API',
      version: '1.0.0',
      description: 'API de gestión y ruteo para el Gateway.'
    },
    license: {
      name: 'MIT License',
      url: 'https://opensource.org/licenses/MIT'
    },
    servers: [
      {
        url: env.ENV === 'production' ? '' : `http://127.0.0.1:${env.PORT}`
      }
    ]
  },
  apis: ['./src/routes/**/*.*']
}

export const custom = {
  customSiteTitle: 'midd-gateway-api',
  swaggerOptions: {
    persistAuthorization: true
  }
}
