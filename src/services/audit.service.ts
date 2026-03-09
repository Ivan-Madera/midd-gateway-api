import { type Request } from 'express'
import AuditLog from '../database/models/AuditLog.model'
import { type ClientInstance } from '../database/models/Client.model'

export enum AuditEventType {
    TOKEN_CREATED = 'TOKEN_CREATED',
    TOKEN_REVOKED = 'TOKEN_REVOKED',
    CLIENT_LOCKED = 'CLIENT_LOCKED',
    CLIENT_REGISTERED = 'CLIENT_REGISTERED',
    FAILED_LOGIN_ATTEMPT = 'FAILED_LOGIN_ATTEMPT',
    TOKEN_REUSE_DETECTION = 'TOKEN_REUSE_DETECTION'
}

export const logEvent = async (
    eventType: AuditEventType,
    client?: ClientInstance | null,
    details?: any,
    req?: Request
): Promise<void> => {
    try {
        const ipAddress = req?.ip || req?.headers['x-forwarded-for'] || req?.socket.remoteAddress
        const userAgent = req?.headers['user-agent']

        await AuditLog.create({
            event_type: eventType,
            client_id: client?.id || null,
            external_client_id: client?.client_id || null,
            details: details || null,
            ip_address: ipAddress ? String(ipAddress) : null,
            user_agent: userAgent ? String(userAgent) : null
        })
    } catch (error) {
        // We don't want to break the main flow if logging fails
        console.error('Failed to create audit log:', error)
    }
}
