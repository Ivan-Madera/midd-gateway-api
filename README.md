# Midd Gateway API

> **Authorization Gateway** — Servicio OAuth 2.0-inspired que provee emisión, verificación, introspección y revocación de tokens de acceso de corta duración para aplicaciones cliente. Construido con Node.js, Express y TypeScript sobre MySQL/Sequelize.

---

## Tabla de contenidos

1. [Descripción general](#descripción-general)
2. [Arquitectura del proyecto](#arquitectura-del-proyecto)
3. [Tecnologías utilizadas](#tecnologías-utilizadas)
4. [Instalación y configuración](#instalación-y-configuración)
5. [Variables de entorno](#variables-de-entorno)
6. [Comandos del proyecto](#comandos-del-proyecto)
7. [Guía de uso](#guía-de-uso)
8. [Endpoints de la API](#endpoints-de-la-api)
9. [Flujos principales](#flujos-principales)
10. [Documentación interna](#documentación-interna)
11. [Seguridad](#seguridad)
12. [Docker](#docker)
13. [Buenas prácticas implementadas](#buenas-prácticas-implementadas)
14. [Licencia](#licencia)

---

## Descripción general

`midd-gateway-api` es un **Gateway de autorización** que actúa como punto central de autenticación para sistemas que necesiten emitir y validar tokens de acceso de manera segura y controlada. Estandariza la comunicación implementando explícitamente el modelo **JSON:API**.

### ¿Qué problema soluciona?

Centraliza la lógica de autenticación evitando que cada microservicio o aplicación del ecosistema tenga que gestionar paralelamente sus propias credenciales y la expiración de tokens. El Gateway:

1. **Registra clientes** bajo estrictos hashes de seguridad (Argon2id).
2. **Emite tokens JWT** de corta duración (5 minutos) atados irrevocablemente a una sesión en BD.
3. **Verifica tokens _One-Time_**: Su verificación exitosa volatiliza la sesión y protege al microservicio end-point de _replay attacks_.
4. **Introspecciona variables**: Ofrece lecturas y metadatos del token sin interferir en su vida útil.

---

## Arquitectura del proyecto

El proyecto cuenta con una separación estricta Clean Architecture y DDD para aislar las responsabilidades y simplificar el _testing_:

```text
midd-gateway-api/
├── app.ts                          # Entrypoint: inicia el servidor y variables
├── src/
│   ├── config/                     # Config. de arranques (server, helmet, swagger, validador Joi ENV)
│   ├── controllers/                # Lógica de enrutamiento y extracción body HTTP (oauth.controller.ts)
│   ├── database/                   # Pool de Sequelize, migraciones y seeders
│   │   ├── models/                 # Modelos ORM (Client.model, Session.model, AuditLog.model)
│   │   └── transaction.ts          # Helpers unificados para manejo de transacciones BD
│   ├── entities/                   # Interfaces TS (jsonApiResponses, jwt.entities)
│   ├── errors/                     # Catálogo de errores de mapeo rápido
│   ├── middlewares/                # Capas defensivas (Rate limiting, Body struct validators, CORS)
│   ├── repositories/               # Query y Mutations aisladas contra base de datos
│   ├── routes/                     # Definición e inyección del Swagger local (oauth.routes.ts)
│   ├── services/                   # Core/Lógica (oauth.service.ts)
│   ├── tests/                      # Setup Unit Testing & Mocks (oauth.spec.ts aislados)
│   ├── utils/                      # Inyectables globales (log4js envoltorio, factory codes)
│   └── validators/                 # Reglas estáticas de req.body y express-validator
```

---

## Tecnologías utilizadas

| Categoría         | Tecnología                       | Versión                  |
| ----------------- | -------------------------------- | ------------------------ |
| Lenguaje          | TypeScript                       | ^5.3.3                   |
| Framework HTTP    | Express                          | ^4.19.2                  |
| Base de datos     | MySQL (mysql2) + Sequelize       | ^3.9.2 / ^6.37.1         |
| Core Cryptografía | **Argon2id**                     | ^0.44.0                  |
| Autenticación     | JSON Web Token (HS512)           | ^9.0.3                   |
| Seguridad API     | Helmet, CORS, express-rate-limit | ^8.0.0 / ^2.8.5 / ^8.2.1 |
| Testing/Cobertura | Jest (Natvie V8) + Supertest     | ^29.7.0                  |

---

## Instalación y configuración

### Requisitos previos

- Node.js ≥ 18.0.0 y NPM
- MySQL 5.7+ local (O contenedor configurado)

### Pasos de clonación

```bash
git clone <repo-url>
cd midd-gateway-api

# 1. Instalar dependencies
npm install

# 2. Plantilla ENV
cp .env.example .env

# 3. Base de Datos
npm run migrate # Modelos base
npm run seeder  # Población inicial de testing
```

---

## Variables de entorno (.env)

| Variable         | Descripción                                      |
| ---------------- | ------------------------------------------------ |
| `ENV`            | Entorno (`development`, `production`, etc.)      |
| `PORT`           | Puerto de escucha HTTP                           |
| `DB_DATABASE`    | Nombre de la DB local/remota MySQL               |
| `TOKEN`          | Regla bearer legacy obligatoria en ciertas rutas |
| `SECRET_KEY`     | Firma Base para los HS512 JWT                    |
| `MAX_CONNECTION` | Top connections Sequelize Pool                   |

---

## Comandos del proyecto

```bash
# Servidor en Local interactivo
npm run dev

# Generar compilación JS de Prod
npm run build

# Script Prod Node Nativo (Requiere Build previo)
npm start

# Testing unitario automatizado y reporte coverage
npm run jest
npx jest --coverage

# Automatización ORM
npm run migrate
npm run new:migration
```

---

## Endpoints de la API

_Mapeados en la raíz:_ `/api/v1`
_Headers Forzosos:_ `Content-Type: application/vnd.api+json`

### Módulo OAuth

| Método | Endpoint                       | Acción Principal                                |
| ------ | ------------------------------ | ----------------------------------------------- |
| `POST` | `/api/v1/oauth/client`         | Alta segura de Nuevo Cliente OAuth              |
| `POST` | `/api/v1/oauth/token`          | Creación Acoplada de Sesión + Token             |
| `POST` | `/api/v1/oauth/verify`         | Decrypt Token y Quema Inmediata de Sesión       |
| `POST` | `/api/v1/oauth/introspect`     | Metadatos Seguros Lectura Token                 |
| `POST` | `/api/v1/oauth/revoke-session` | Apagado asíncrono UUID único de sesión          |
| `POST` | `/api/v1/oauth/revoke-all`     | _Batch:_ Eliminar todas las sesiones vinculadas |

---

## Ejemplos de Interacciones Código y Request Base

**Payload `POST /oauth/token` (JSON:API Standard)**

```json
{
  "data": {
    "type": "oauth",
    "attributes": {
      "client_id": "TU-UUID-AQUI",
      "client_secret": "raw-secreto"
    }
  }
}
```

**Estructura Base de un Controlador Usando el Wrapper `JsonApi`**

```typescript
import { Handler } from 'express'
import { Codes } from '../utils/codeStatus'
import {
  JsonApiResponseError,
  JsonApiResponseData
} from '../utils/jsonApiResponses'

export const revokeOldSessions: Handler = async (req, res) => {
  const url = req.originalUrl
  try {
    const { client_id, client_secret } = req.body.data.attributes

    const oauthService = await revokeOldSessionsService(
      url,
      client_id,
      client_secret,
      req
    )

    return res.status(oauthService.status).json(oauthService.response)
  } catch (error) {
    return res.status(Codes.errorServer).json(JsonApiResponseError(error, url))
  }
}
```

---

## Seguridad Fortificada

- **`helmet` y `rateLimit`**: Bloquean ataques DOS pasivos con headers _CSP_. El enpoint de creación de tokens soporta menos peticiones simultáneas previniendo _Brute forcing_.
- **Argon2id Hashings**: Uso de algoritmos RAM-heavy previniendo extracciones eficaces y decaimientos DB pasivos de la información maestra de clientes.
- **Middlewares Defensivos**: El `validateResult` enruta las excepciones de `express-validator` rechazando _payloads_ mutilados inmediatamente antes de procesarlas o hacer logs pesados al controller.

---

## Docker

El contenedor nativo ha sido optimizado vía _Multi-Stage build_ en Alpine para generar un bloque limpio y exento del ambiente `devDependency`:

1. `Build Stage`: Transpila
2. `Final Stage`: Copia puros binarios generados bajo usuario seguro rootless usando _Dumb-init_ manejador PID1 previniendo _Zombies_.

```bash
docker build -t midd-gateway-api .
docker-compose up -d
```

_(Requiere previamente en el Engine `docker network create mysql_default`)_.

---

## Licencia

**MIT** — Ver detalles en el proyecto o la [MIT License documentation](https://opensource.org/licenses/MIT).

`Copyright (c) Ivan Madera`
