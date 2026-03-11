import { Request, Response } from 'express'
import { Codes } from '../utils/codeStatus'
import * as oauthService from '../services/oauth.service'
import {
  registerClient,
  createToken,
  verifyToken,
  revokeAllSessions,
  revokeSession,
  introspect,
  revokeOldSessions,
  generatePassword
} from '../controllers/oauth.controller'

jest.mock('../services/oauth.service')
jest.mock('../utils/logger', () => ({
  LogWarn: jest.fn(),
  LogMark: jest.fn(),
  LogInfo: jest.fn(),
  LogError: jest.fn(),
  MessageInfo: jest.fn(),
  MessageWarn: jest.fn()
}))

describe('OAuth Controller Tests', () => {
  let mockRequest: Partial<Request>
  let mockResponse: Partial<Response>
  let responseJson: jest.Mock
  let responseStatus: jest.Mock

  beforeEach(() => {
    responseJson = jest.fn()
    responseStatus = jest.fn().mockReturnValue({ json: responseJson })
    mockResponse = {
      status: responseStatus
    }

    // Configuración base por defecto para el request
    mockRequest = {
      originalUrl: '/test-url',
      body: {
        data: {
          attributes: {}
        }
      }
    }

    jest.clearAllMocks()
  })

  describe('registerClient', () => {
    it('should call registerClientService and return success', async () => {
      mockRequest.body.data.attributes = {
        name: 'Test App',
        client_secret: 'secret'
      }
      const serviceResult = { status: Codes.success, response: { data: 'ok' } }
      ;(oauthService.registerClientService as jest.Mock).mockResolvedValue(
        serviceResult
      )

      await registerClient(
        mockRequest as Request,
        mockResponse as Response,
        jest.fn()
      )

      expect(oauthService.registerClientService).toHaveBeenCalledWith(
        '/test-url',
        'Test App',
        'secret',
        mockRequest
      )
      expect(responseStatus).toHaveBeenCalledWith(Codes.success)
      expect(responseJson).toHaveBeenCalledWith({ data: 'ok' })
    })

    it('should catch errors and return errorServer status', async () => {
      ;(oauthService.registerClientService as jest.Mock).mockRejectedValue(
        new Error('fail')
      )

      await registerClient(
        mockRequest as Request,
        mockResponse as Response,
        jest.fn()
      )

      expect(responseStatus).toHaveBeenCalledWith(Codes.errorServer)
      expect(responseJson).toHaveBeenCalled()
    })
  })

  describe('createToken', () => {
    it('should call createTokenService and return success', async () => {
      mockRequest.body.data.attributes = {
        client_id: 'client1',
        client_secret: 'secret1'
      }
      const serviceResult = {
        status: Codes.success,
        response: { token: '123' }
      }
      ;(oauthService.createTokenService as jest.Mock).mockResolvedValue(
        serviceResult
      )

      await createToken(
        mockRequest as Request,
        mockResponse as Response,
        jest.fn()
      )

      expect(oauthService.createTokenService).toHaveBeenCalledWith(
        '/test-url',
        'client1',
        'secret1',
        mockRequest
      )
      expect(responseStatus).toHaveBeenCalledWith(Codes.success)
      expect(responseJson).toHaveBeenCalledWith({ token: '123' })
    })
  })

  describe('verifyToken', () => {
    it('should call verifyTokenService and return success', async () => {
      mockRequest.body.data.attributes = { token: 'token123' }
      const serviceResult = { status: Codes.success, response: { valid: true } }
      ;(oauthService.verifyTokenService as jest.Mock).mockResolvedValue(
        serviceResult
      )

      await verifyToken(
        mockRequest as Request,
        mockResponse as Response,
        jest.fn()
      )

      expect(oauthService.verifyTokenService).toHaveBeenCalledWith(
        '/test-url',
        'token123',
        mockRequest
      )
      expect(responseStatus).toHaveBeenCalledWith(Codes.success)
    })
  })

  describe('revokeAllSessions', () => {
    it('should call revokeAllSessionsService and return success', async () => {
      mockRequest.body.data.attributes = {
        client_id: 'c1',
        client_secret: 's1'
      }
      const serviceResult = {
        status: Codes.success,
        response: { revoked: true }
      }
      ;(oauthService.revokeAllSessionsService as jest.Mock).mockResolvedValue(
        serviceResult
      )

      await revokeAllSessions(
        mockRequest as Request,
        mockResponse as Response,
        jest.fn()
      )

      expect(oauthService.revokeAllSessionsService).toHaveBeenCalledWith(
        '/test-url',
        'c1',
        's1',
        mockRequest
      )
      expect(responseStatus).toHaveBeenCalledWith(Codes.success)
    })
  })

  describe('revokeSession', () => {
    it('should call revokeSessionService and return success', async () => {
      mockRequest.body.data.attributes = {
        client_id: 'c1',
        client_secret: 's1',
        token: 't1'
      }
      const serviceResult = {
        status: Codes.success,
        response: { revoked: true }
      }
      ;(oauthService.revokeSessionService as jest.Mock).mockResolvedValue(
        serviceResult
      )

      await revokeSession(
        mockRequest as Request,
        mockResponse as Response,
        jest.fn()
      )

      expect(oauthService.revokeSessionService).toHaveBeenCalledWith(
        '/test-url',
        'c1',
        's1',
        't1',
        mockRequest
      )
      expect(responseStatus).toHaveBeenCalledWith(Codes.success)
    })
  })

  describe('introspect', () => {
    it('should call introspectService and return success', async () => {
      mockRequest.body.data.attributes = {
        client_id: 'c1',
        client_secret: 's1',
        token: 't1'
      }
      const serviceResult = {
        status: Codes.success,
        response: { active: true }
      }
      ;(oauthService.introspectService as jest.Mock).mockResolvedValue(
        serviceResult
      )

      await introspect(
        mockRequest as Request,
        mockResponse as Response,
        jest.fn()
      )

      expect(oauthService.introspectService).toHaveBeenCalledWith(
        '/test-url',
        'c1',
        's1',
        't1'
      )
      expect(responseStatus).toHaveBeenCalledWith(Codes.success)
    })
  })

  describe('revokeOldSessions', () => {
    it('should call revokeOldSessionsService and return success', async () => {
      mockRequest.body.data.attributes = {
        client_id: 'c1',
        client_secret: 's1'
      }
      const serviceResult = {
        status: Codes.success,
        response: { revoked: true }
      }
      ;(oauthService.revokeOldSessionsService as jest.Mock).mockResolvedValue(
        serviceResult
      )

      await revokeOldSessions(
        mockRequest as Request,
        mockResponse as Response,
        jest.fn()
      )

      expect(oauthService.revokeOldSessionsService).toHaveBeenCalledWith(
        '/test-url',
        'c1',
        's1',
        mockRequest
      )
      expect(responseStatus).toHaveBeenCalledWith(Codes.success)
    })
  })

  describe('generatePassword', () => {
    it('should call generatePasswordService and return success', async () => {
      const serviceResult = {
        status: Codes.success,
        response: { password: 'pwd' }
      }
      ;(oauthService.generatePasswordService as jest.Mock).mockResolvedValue(
        serviceResult
      )

      await generatePassword(
        mockRequest as Request,
        mockResponse as Response,
        jest.fn()
      )

      expect(oauthService.generatePasswordService).toHaveBeenCalledWith(
        '/test-url'
      )
      expect(responseStatus).toHaveBeenCalledWith(Codes.success)
    })
  })
})
