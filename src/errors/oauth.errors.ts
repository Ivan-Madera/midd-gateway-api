export const oauthErrors = {
  CLIENT_CREDENTIALS_INVALID: {
    code: 'OAUTH-ERROR-004',
    suggestions:
      'Verifique las credenciales del cliente en los atributos de la solicitud.',
    title: 'Cliente no autorizado.'
  },
  INVALID_TOKEN: {
    code: 'OAUTH-ERROR-005',
    suggestions: 'El token podría estar mal formado o ser inválido.',
    title: 'Fallo en la verificación del token.'
  },
  CLIENT_ALREADY_EXISTS: {
    code: 'OAUTH-ERROR-006',
    suggestions: 'Elija un nombre diferente para el componente cliente.',
    title: 'Nombre de cliente ya en uso.'
  },
  SESSION_REVOKED: {
    code: 'OAUTH-ERROR-007',
    suggestions: 'Autentíquese de nuevo para obtener un nuevo token.',
    title: 'Sesión revocada.'
  },
  SESSION_NOT_FOUND: {
    code: 'OAUTH-ERROR-008',
    suggestions: 'Asegúrese de que el token pertenece a este cliente.',
    title: 'Sesión no encontrada.'
  },
  ACCOUNT_BLOCKED: {
    code: 'OAUTH-ERROR-009',
    suggestions: 'Espere unos minutos antes de intentar nuevamente.',
    title: 'Cuenta bloqueada.'
  }
}
