# Midd Gateway API

> **Authorization Gateway** — Servicio OAuth 2.0-inspired que provee emisión, verificación, introspección y revocación de tokens de acceso de corta duración para aplicaciones cliente. Construido con Node.js, Express y TypeScript sobre MySQL/Sequelize.

---

## Tabla de contenidos

- [Descripción general](#descripción-general)
- [Arquitectura del proyecto](#arquitectura-del-proyecto)
- [Tecnologías utilizadas](#tecnologías-utilizadas)
- [Instalación y configuración](#instalación-y-configuración)
- [Variables de entorno](#variables-de-entorno)
- [Comandos del proyecto](#comandos-del-proyecto)
- [Guía de uso](#guía-de-uso)
- [Endpoints de la API](#endpoints-de-la-api)
- [Flujos principales](#flujos-principales)
- [Documentación interna](#documentación-interna)
- [Seguridad](#seguridad)
- [Docker](#docker)
- [Buenas prácticas implementadas](#buenas-prácticas-implementadas)
- [Roadmap](#roadmap)
- [Licencia](#licencia)

---

## Descripción general

`midd-gateway-api` es un **Gateway de autorización** que actúa como punto central de autenticación para sistemas que necesiten emitir y validar tokens de acceso de manera segura y controlada.

### ¿Qué problema soluciona?

Centraliza la lógica de autenticación evitando que cada microservicio o aplicación tenga que gestionar sus propias credenciales y tokens. El Gateway:

1. **Registra clientes** con un nombre único y un secreto hasheado con Argon2id.
2. **Emite tokens JWT** de corta duración (5 minutos) vinculados a una sesión persistente en base de datos.
3. **Verifica tokens** de uso único: tras una verificación exitosa, la sesión queda revocada automáticamente.
4. **Introspecciona tokens** para obtener metadatos sin consumirlos.
5. **Revoca sesiones** de forma individual, masiva o por antigüedad (> 24 h).

---

## Arquitectura del proyecto

```
midd-gateway-api/
├── app.ts                          # Entrypoint: inicia el servidor
├── src/
│   ├── config/
│   │   ├── callEnv.ts              # Carga y valida variables de entorno con Joi
│   │   ├── helmet.ts               # Configuración de CSP y HSTS
│   │   ├── rateLimit.ts            # Limitadores de tasa (general y auth)
│   │   ├── server.ts               # Clase Server: configura middlewares, rutas y Swagger
│   │   └── swagger.ts              # Opciones y metadata de Swagger UI
│   ├── controllers/
│   │   └── oauth.controller.ts     # Lógica de negocio para los endpoints OAuth
│   ├── database/
│   │   ├── config.ts               # Pool de conexión Sequelize (MySQL)
│   │   ├── transaction.ts          # Helpers: manageTransaction, commit, rollback
│   │   ├── models/
│   │   │   ├── Client.model.ts     # Modelo ORM de clientes OAuth
│   │   │   └── Session.model.ts    # Modelo ORM de sesiones/tokens
│   │   ├── migrations/             # Migraciones de Sequelize CLI
│   │   ├── seeders/                # Seeders de Sequelize CLI
│   │   └── config/                 # Configuración específica de Sequelize CLI
│   ├── entities/
│   │   ├── jsonApiResponses.entities.ts  # Interfaces TypeScript de respuestas JSON:API
│   │   └── jwt.entities.ts               # Interface del payload JWT
│   ├── errors/
│   │   └── validation.errors.ts    # Catálogo de errores de validación reutilizables
│   ├── middlewares/
│   │   ├── authentication.middleware.ts  # checkAuth, methodValidator, contentTypeValidator, checkBearer
│   │   ├── shared.middleware.ts          # baseRoute (landing HTML) y headerNoCache
│   │   └── validation.middleware.ts      # validateResult (express-validator)
│   ├── repositories/
│   │   ├── mutations/
│   │   │   └── user.mutations.ts   # Operaciones de escritura (createUser, updateUser)
│   │   └── queries/
│   │       └── user.queries.ts     # Operaciones de lectura (findAllUsers)
│   ├── routes/
│   │   └── oauth.routes.ts         # Definición de rutas OAuth con documentación Swagger
│   ├── services/
│   │   ├── users.service.ts        # Servicios de usuario (token, CRUD con transacciones)
│   │   └── diaries.service.ts      # Servicio de ejemplo con datos en memoria
│   ├── tests/
│   │   └── diaries.spec.ts         # Tests de ejemplo con Jest
│   ├── utils/
│   │   ├── codeStatus.ts           # Enum de códigos HTTP
│   │   ├── Exceptions.ts           # Clase ErrorException personalizada
│   │   ├── httpClient.ts           # Cliente HTTP Axios (GET, POST, PUT)
│   │   ├── jsonApiResponses.ts     # Factories de respuestas JSON:API
│   │   ├── logger.ts               # Logger estructurado con log4js
│   │   └── tokens.ts               # createAccessToken y verifyToken (JWT HS512)
│   └── validators/
│       └── diaries.validators.ts   # Validadores express-validator de ejemplo
```

---

## Tecnologías utilizadas

| Categoría          | Tecnología                         | Versión                  |
| ------------------ | ---------------------------------- | ------------------------ |
| Lenguaje           | TypeScript                         | ^5.3.3                   |
| Runtime            | Node.js                            | ≥ 18.0.0                 |
| Framework HTTP     | Express                            | ^4.19.2                  |
| ORM                | Sequelize                          | ^6.37.1                  |
| Base de datos      | MySQL (mysql2)                     | ^3.9.2                   |
| Autenticación      | JSON Web Token (HS512)             | ^9.0.3                   |
| Hashing            | Argon2id                           | ^0.44.0                  |
| Documentación      | Swagger UI Express + swagger-jsdoc | ^5.0.1 / ^6.2.8          |
| Seguridad          | Helmet, CORS, express-rate-limit   | ^8.0.0 / ^2.8.5 / ^8.2.1 |
| Validación de env  | Joi                                | ^17.13.3                 |
| Validación de body | express-validator                  | 7.3.0                    |
| Logging            | log4js                             | ^6.9.1                   |
| HTTP Client        | Axios                              | 1.12.0                   |
| UUID               | uuid                               | ^11.0.3                  |
| Testing            | Jest + Supertest + ts-jest         | ^29.7.0                  |
| Dev server         | ts-node-dev                        | ^2.0.0                   |

---

## Instalación y configuración

### Requisitos previos

- **Node.js** ≥ 18.0.0
- **npm** ≥ 9.0.0
- **MySQL** 5.7+ / 8.x

### Pasos de instalación

```bash
# 1. Clonar el repositorio
git clone <repo-url>
cd midd-gateway-api

# 2. Instalar dependencias
npm install

# 3. Configurar variables de entorno
cp .env.example .env
# Editar .env con los valores correspondientes

# 4. Ejecutar migraciones para crear las tablas
npm run migrate

# 5. (Opcional) Ejecutar seeders
npm run seeder
```

---

## Variables de entorno

Todas las variables son **obligatorias** a menos que se indique un valor por defecto. La validación ocurre en el arranque mediante **Joi**; si alguna variable falta o es inválida, el proceso no inicia.

| Variable         | Tipo     | Default | Descripción                                      |
| ---------------- | -------- | ------- | ------------------------------------------------ |
| `ENV`            | `string` | —       | Entorno (`development`, `production`, etc.)      |
| `PORT`           | `number` | —       | Puerto en el que escucha el servidor             |
| `DB_DATABASE`    | `string` | —       | Nombre de la base de datos MySQL                 |
| `DB_USERNAME`    | `string` | —       | Usuario de MySQL                                 |
| `DB_PASSWORD`    | `string` | —       | Contraseña de MySQL                              |
| `DB_HOST`        | `string` | —       | Host de MySQL                                    |
| `DB_PORT`        | `number` | —       | Puerto de MySQL                                  |
| `TOKEN`          | `string` | —       | Token estático para `checkAuth` (header `token`) |
| `SECRET_KEY`     | `string` | —       | Clave secreta para firmar/verificar JWTs         |
| `MAX_CONNECTION` | `number` | `72`    | Máximo de conexiones en el pool                  |
| `MIN_CONNECTION` | `number` | `0`     | Mínimo de conexiones en el pool                  |
| `DB_ACQUIRE`     | `number` | `30000` | Tiempo máximo (ms) para adquirir una conexión    |
| `DB_IDLE`        | `number` | `5000`  | Tiempo (ms) antes de liberar una conexión idle   |
| `DB_EVICT`       | `number` | `5000`  | Intervalo (ms) para eviction del pool            |

```env
# .env.example
ENV=development
PORT=3000
DB_DATABASE=gateway_db
DB_USERNAME=root
DB_PASSWORD=secret
DB_HOST=127.0.0.1
DB_PORT=3306
TOKEN=my-static-api-token
SECRET_KEY=my-super-secret-key
MAX_CONNECTION=72
MIN_CONNECTION=0
DB_ACQUIRE=30000
DB_IDLE=5000
DB_EVICT=5000
```

---

## Comandos del proyecto

```bash
# Desarrollo con hot-reload
npm run dev

# Compilar TypeScript a JavaScript (output: /build)
npm run build

# Iniciar en producción (requiere build previo)
npm start

# Ejecutar tests con Jest
npm run jest

# Base de datos — migrations
npm run migrate          # Aplicar migraciones pendientes
npm run migrate:undo     # Revertir todas las migraciones

# Base de datos — seeders
npm run seeder           # Ejecutar todos los seeders
npm run seeder:undo      # Revertir todos los seeders

# Generar esqueletos (Sequelize CLI)
npm run new:migration    # Nueva migración vacía
npm run new:seeder       # Nuevo seeder vacío
```

---

## Guía de uso

### Desarrollo local

```bash
npm run dev
# → Server listening on http://127.0.0.1:3000
# → Swagger UI disponible en http://127.0.0.1:3000/docs
```

La pantalla raíz (`GET /`) muestra una landing page con información del entorno, versión de Node y un acceso directo a la documentación (solo disponible fuera de producción).

---

## Endpoints de la API

Base URL: `/api/v1`

Todos los endpoints requieren:

- **Método**: `POST`
- **Content-Type**: `application/vnd.api+json`

### OAuth — `[V1] OAuth`

| Método | Endpoint                       | Descripción                                      |
| ------ | ------------------------------ | ------------------------------------------------ |
| `POST` | `/api/v1/oauth/client`         | Registrar un nuevo cliente OAuth                 |
| `POST` | `/api/v1/oauth/token`          | Emitir un token de acceso                        |
| `POST` | `/api/v1/oauth/verify`         | Verificar (y consumir) un token                  |
| `POST` | `/api/v1/oauth/introspect`     | Introspeccionar un token sin consumirlo          |
| `POST` | `/api/v1/oauth/revoke-session` | Revocar una sesión específica                    |
| `POST` | `/api/v1/oauth/revoke-all`     | Revocar todas las sesiones activas de un cliente |
| `POST` | `/api/v1/oauth/revoke-old`     | Revocar sesiones de más de 24 horas              |

### Estructura de request (JSON:API)

```json
{
  "data": {
    "type": "oauth",
    "attributes": {
      "client_id": "78b02e73-aa49-410a-b50a-e374d9f94218",
      "client_secret": "your-super-secret-string"
    }
  }
}
```

### Ejemplos de respuesta exitosa

**Emitir token (`/oauth/token`)**

```json
{
  "data": {
    "type": "session",
    "id": "uuid-v4",
    "attributes": {
      "accessToken": "eyJhbGciOiJIUzUxMiIsInR5cCI6IkpXVCJ9..."
    },
    "links": { "self": "/api/v1/oauth/token" }
  }
}
```

**Verificar token (`/oauth/verify`)**

```json
{
  "data": {
    "type": "verification",
    "id": "uuid-v4",
    "attributes": { "valid": true },
    "links": { "self": "/api/v1/oauth/verify" }
  }
}
```

**Error estándar**

```json
{
  "code": "OAUTH-001",
  "status": 401,
  "source": { "pointer": "/api/v1/oauth/token" },
  "suggestedActions": "Check the client credentials in the request.",
  "title": "Client unauthorized.",
  "detail": "Client not found or inactive"
}
```

---

## Flujos principales

### 1. Registro de cliente

```
POST /api/v1/oauth/client
  │
  ├─ Verificar nombre único (Client.findOne)
  ├─ Hashear client_secret con Argon2id (type: argon2id, memoryCost: 19456)
  ├─ Generar client_id (UUIDv4)
  └─ Persistir en tabla `clients`
     → Retorna { client_id }
```

### 2. Emisión de token

```
POST /api/v1/oauth/token
  │
  ├─ authLimiter (máx 100 req / 15 min)
  ├─ Buscar cliente activo por client_id
  ├─ Verificar client_secret con Argon2.verify
  ├─ Crear sesión en tabla `sessions` (expires_at = now + 5 min)
  └─ Firmar JWT HS512 (payload: { uid, sid }, expiresIn: "5m", issuer: "authorization-gateway")
     → Retorna { accessToken }
```

### 3. Verificación de token (single-use)

```
POST /api/v1/oauth/verify
  │
  ├─ Decodificar y verificar JWT (issuer check)
  ├─ Buscar sesión por sid (decoded.sid)
  ├─ Validar que revoked_at === null
  ├─ Marcar session.revoked_at = now  ← token queda invalidado
  └─ Retorna { valid: true }
```

### 4. Introspección

```
POST /api/v1/oauth/introspect
  │
  ├─ Autenticar cliente (client_id + client_secret)
  ├─ Decodificar JWT sin lanzar excepción
  ├─ Si la sesión existe y no está revocada → active: true
  │    + client_id, sub, sid, exp, iat
  └─ Si el token expiró o la sesión fue revocada → active: false
```

---

## Documentación interna

### `src/utils/tokens.ts`

| Función                      | Descripción                                                              |
| ---------------------------- | ------------------------------------------------------------------------ |
| `createAccessToken(payload)` | Firma un JWT con HS512, expiración 5 min, issuer `authorization-gateway` |
| `verifyToken(token)`         | Verifica la firma y el issuer; rechaza tokens expirados o malformados    |

### `src/utils/jsonApiResponses.ts`

| Función                                        | Descripción                                                          |
| ---------------------------------------------- | -------------------------------------------------------------------- |
| `JsonApiResponseData(type, attributes, links)` | Construye una respuesta `{ data: { type, id, attributes, links } }`  |
| `JsonApiResponseMessage(type, message, links)` | Respuesta con mensaje de texto plano                                 |
| `JsonApiResponseError(error, url)`             | Serializa cualquier error al formato JSON:API de error               |
| `JsonApiResponseGeneric(status, response)`     | Envuelve respuesta y status en un objeto genérico para servicios     |
| `JsonApiResponseValidator(pointer, detail)`    | Respuesta de error de validación con código `ERROR-001` y status 422 |

### `src/utils/Exceptions.ts` — `ErrorException`

Extiende `Error` añadiendo los campos `code`, `status`, `suggestions` y `title` para que `JsonApiResponseError` los serialice automáticamente.

```typescript
throw new ErrorException(
  { code: 'OAUTH-001', suggestions: '...', title: 'Client unauthorized.' },
  401,
  'Client not found or inactive'
)
```

### `src/utils/logger.ts`

Logger basado en **log4js** con timestamp localizado `es-MX`.

| Export                             | Nivel | Uso                                  |
| ---------------------------------- | ----- | ------------------------------------ |
| `LogMark(msg)`                     | MARK  | Inicialización, parámetros de pool   |
| `LogInfo(msg)`                     | INFO  | Servidor listo, conexión DB exitosa  |
| `LogError(msg)`                    | ERROR | Fallos de conexión DB                |
| `LogWarn(service, version, error)` | WARN  | Errores no críticos en controladores |

### `src/utils/httpClient.ts`

Wrappers sobre Axios (`getHttp`, `postHttp`, `putHttp`) que normalizan errores de red y retornan siempre `{ status, data }`.

### `src/config/server.ts` — Clase `Server`

| Método                   | Descripción                                                               |
| ------------------------ | ------------------------------------------------------------------------- |
| `initializeDB()`         | Llama a `sequelize.authenticate()` para verificar la conexión al arrancar |
| `configureSecurity()`    | Aplica Helmet (CSP, HSTS, frameguard) y deshabilita `x-powered-by`        |
| `configureMiddlewares()` | CORS, rate limiter general, no-cache header, JSON y URL-encoded parsers   |
| `configureSwagger()`     | Monta Swagger UI en `/docs` (solo si `ENV !== 'production'`)              |
| `configureRoutes()`      | Registra el router OAuth bajo `/api/v1`                                   |
| `listen()`               | Registra `baseRoute` en `GET /` e inicia el servidor HTTP                 |
| `close()`                | Cierra el pool de Sequelize (útil en tests)                               |
| `getService()`           | Expone la instancia Express para supertest                                |

---

## Seguridad

| Capa                       | Mecanismo                                                                                           |
| -------------------------- | --------------------------------------------------------------------------------------------------- |
| Hashing de secretos        | **Argon2id** (memoryCost: 19456, timeCost: 2, parallelism: 1 — recomendación OWASP)                 |
| Firma de tokens            | **JWT HS512** con validación de issuer                                                              |
| Tokens de uso único        | La sesión se revoca inmediatamente al verificar un token                                            |
| Headers HTTP               | **Helmet** — CSP restrictiva, HSTS (2 años + preload), X-Frame-Options DENY, X-Powered-By eliminado |
| Rate limiting              | `generalLimiter`: 1000 req/15 min · `authLimiter` en `/oauth/token`: 100 req/15 min                 |
| Validación de Content-Type | Fuerza `application/vnd.api+json` en todos los endpoints                                            |
| Cache                      | `Cache-Control: no-store` en todas las respuestas                                                   |
| Conexión DB productiva     | SSL (`require: true`, `rejectUnauthorized: false`) en `ENV=production`                              |

### Catálogo de errores

| Código      | HTTP | Descripción                                              |
| ----------- | ---- | -------------------------------------------------------- |
| `OAUTH-001` | 401  | Cliente no encontrado, inactivo o credenciales inválidas |
| `OAUTH-002` | 400  | Token ausente en el cuerpo del request                   |
| `OAUTH-003` | 401  | Token inválido o expirado                                |
| `OAUTH-004` | 400  | Nombre de cliente ya registrado                          |
| `OAUTH-005` | 401  | Sesión revocada o inexistente                            |
| `OAUTH-006` | 400  | Sesión no pertenece al cliente                           |
| `ERROR-002` | 406  | Método HTTP no permitido                                 |
| `ERROR-003` | 415  | Content-Type no permitido                                |
| `ERROR-004` | 401  | Authorization header ausente                             |
| `ERROR-005` | 401  | Token Bearer inválido                                    |
| `ERROR-006` | 401  | Appkey estática inválida                                 |
| `RATE-001`  | 429  | Límite general excedido                                  |
| `RATE-002`  | 429  | Límite de autenticación excedido                         |
| `ERROR-001` | 422  | Error de validación del body                             |

---

## Docker

El proyecto incluye un `Dockerfile` multi-stage optimizado:

- **Stage `build`**: Usa `node:20-alpine3.19`, instala dependencias, compila TypeScript.
- **Stage final**: Usa `node:lts-alpine3.19`, copia solo artefactos de producción, ejecuta con `dumb-init` como usuario `node` (no root).
- Timezone: `America/Mexico_City`.

```bash
# Construir imagen
docker build -t midd-gateway-api .

# Levantar con docker-compose (requiere red externa mysql_default)
docker-compose up -d
```

> **Nota**: El `docker-compose.yaml` espera una red externa llamada `mysql_default`. Asegúrate de tenerla creada con `docker network create mysql_default` o ajusta el nombre según tu entorno.

---

## Base de datos

### Modelo `clients`

| Campo                       | Tipo                  | Descripción                          |
| --------------------------- | --------------------- | ------------------------------------ |
| `id`                        | INT AUTO_INCREMENT PK | Identificador interno                |
| `name`                      | VARCHAR               | Nombre único del cliente             |
| `client_id`                 | UUID UNIQUE           | Identificador público del cliente    |
| `secret_hash`               | VARCHAR               | Hash Argon2id del secreto            |
| `is_active`                 | BOOLEAN               | Estado del cliente (default: `true`) |
| `created_at` / `updated_at` | DATETIME              | Timestamps manuales                  |

### Modelo `sessions`

| Campo                       | Tipo                  | Descripción                         |
| --------------------------- | --------------------- | ----------------------------------- |
| `id`                        | INT AUTO_INCREMENT PK | Identificador de sesión             |
| `client_id`                 | INT FK → clients.id   | Cliente propietario                 |
| `expires_at`                | DATETIME              | Expiración del token (now + 5 min)  |
| `revoked_at`                | DATETIME NULL         | Fecha de revocación (null = activa) |
| `created_at` / `updated_at` | DATETIME              | Timestamps manuales                 |

Las migraciones crean además **índices** en `client_id` y `revoked_at` para optimizar las consultas de revocación.

---

## Buenas prácticas implementadas

- **Arquitectura en capas**: `routes → controllers → models` (con `services` y `repositories` disponibles para lógica más compleja).
- **Respuestas estandarizadas JSON:API** en todos los endpoints (éxito, mensaje y error).
- **Variables de entorno validadas** en arranque con Joi; fallo rápido ante configuración incorrecta.
- **Errores tipados** con `ErrorException` que lleva código, sugerencias y título para respuestas descriptivas.
- **Tokens de uso único** para verificación, previniendo replay attacks.
- **Multi-stage Docker** para imágenes de producción ligeras y seguras.
- **Logger estructurado** con log4js y separación de niveles (INFO, WARN, ERROR, MARK).
- **Pool de conexiones** configurable vía variables de entorno.
- **Transacciones Sequelize** para operaciones de escritura con rollback automático.
- **ESLint + Prettier** configurados para consistencia de código.

---

## Roadmap

Basado en el código existente, las siguientes mejoras son candidatas naturales:

- [ ] **Refresh tokens**: Implementar un token de larga duración para renovar el access token sin re-autenticarse.
- [ ] **Rotación de secretos de cliente**: Endpoint para actualizar el `client_secret` de un cliente existente.
- [ ] **Endpoint de desactivación de cliente**: Marcar `is_active = false` para deshabilitar un cliente sin eliminarlo.
- [ ] **Auto-revocación en cadena**: Activar la lógica comentada en `verifyToken` que revoca todas las sesiones del cliente al detectarse un token ya revocado (prevención de token replay en profundidad).
- [ ] **Paginado en revocación masiva**: Limitar el batch de `revokeOldSessions` para evitar timeouts en tablas grandes.
- [ ] **Tests de integración**: Extender `src/tests/` con specs para los endpoints OAuth usando Supertest.
- [ ] **Métricas y health check**: Endpoint `GET /health` que exponga estado de la conexión a BD y uptime.
- [ ] **Audit log**: Registrar en tabla dedicada los eventos de emisión, verificación y revocación de tokens.

---

## Licencia

**MIT** — Ver [LICENSE](https://opensource.org/licenses/MIT)

```
Copyright (c) Ivan Madera
```
