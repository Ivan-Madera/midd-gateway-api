import { Codes } from '../utils/codeStatus'
import { JsonApiResponseError } from '../utils/jsonApiResponses'
import env from '../config/callEnv'

export const baseRoute = (_req: any, res: any, _next: any): void => {
  const html = `<!doctype html>
  <html lang="es">
    <head>
      <meta charset="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <title>Midd Gateway API · Ivan Madera</title>
      <style>
        body { margin: 0; padding: 0; height: 100vh; width: 100vw; overflow: hidden; font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Ubuntu, Cantarell, Noto Sans, Helvetica Neue, Arial; color: #e5e7eb; background: #0f172a; display: flex; align-items: center; justify-content: center; }
        .card { max-width: 920px; width: 100%; background: linear-gradient(180deg, rgba(17,24,39,.9), rgba(17,24,39,.85)); border: 1px solid rgba(255,255,255,.06); border-radius: 16px; box-shadow: 0 10px 30px rgba(0,0,0,.35), inset 0 1px 0 rgba(255,255,255,.04); overflow: hidden; }
        .header { display: flex; align-items: center; gap: 14px; padding: 22px 24px; border-bottom: 1px solid rgba(255,255,255,.06); }
        .logo { width: 40px; height: 40px; border-radius: 10px; background: linear-gradient(135deg, #22c55e, #06b6d4); display: grid; place-items: center; color: #052e16; font-weight: 800; box-shadow: 0 6px 20px rgba(34,197,94,.35); }
        .title { font-size: 18px; font-weight: 700; letter-spacing: .2px; }
        .subtitle { color: #9ca3af; font-size: 13px; margin-top: 2px; }
        .content { padding: 28px 24px; display: grid; gap: 18px; }
        .badge-row { display: flex; flex-wrap: wrap; gap: 10px; }
        .badge { display: inline-flex; align-items: center; gap: 8px; padding: 8px 12px; background: rgba(255,255,255,.05); border: 1px solid rgba(255,255,255,.08); border-radius: 999px; font-size: 12px; color: #e5e7eb; }
        .dot { width: 8px; height: 8px; border-radius: 50%; background: #22c55e; box-shadow: 0 0 0 3px rgba(34,197,94,.18); }
        .grid { display: grid; gap: 14px; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); }
        .tile { padding: 14px; border-radius: 12px; background: rgba(255,255,255,.04); border: 1px solid rgba(255,255,255,.08); }
        .k { font-size: 12px; color: #9ca3af; }
        .v { font-weight: 700; margin-top: 4px; }
        .btn-docs { display: inline-flex; align-items: center; gap: 8px; padding: 12px 24px; background: linear-gradient(135deg, #22c55e, #06b6d4); color: #052e16; font-weight: 700; font-size: 14px; border-radius: 10px; text-decoration: none; box-shadow: 0 6px 20px rgba(34,197,94,.35); transition: transform .15s ease, box-shadow .15s ease; }
        .btn-docs:hover { transform: translateY(-2px); box-shadow: 0 8px 28px rgba(34,197,94,.45); }
        .btn-docs svg { width: 18px; height: 18px; }
        .docs-section { display: flex; justify-content: center; padding-top: 4px; }
                 .footer { padding: 16px 24px; border-top: 1px solid rgba(255,255,255,.06); color: #9ca3af; font-size: 12px; }
      </style>
    </head>
    <body>
      <main class="card" role="main">
        <section class="header">
          <div class="logo" aria-hidden="true">🚀</div>
          <div>
            <div class="title">Midd Gateway API</div>
            <div class="subtitle">API de gestión y ruteo para el Gateway.</div>
          </div>
        </section>
        <section class="content">
          <div class="badge-row">
            <span class="badge"><span class="dot"></span> En línea</span>
            <span class="badge">Entorno: <strong>${env.ENV}</strong></span>
            <span class="badge">Puerto: <strong>${env.PORT}</strong></span>
            <span class="badge">Versión de Node: <strong>${
              process.versions.node
            }</strong></span>
          </div>
                     <div class="grid">
             <div class="tile">
               <div class="k">Tecnologías</div>
               <div class="v">Node.js, Express, TypeScript, MySQL, Sequelize</div>
             </div>
             <div class="tile">
               <div class="k">Documentación</div>
               <div class="v">Swagger UI integrado para documentación automática</div>
             </div>
             <div class="tile">
               <div class="k">Seguridad</div>
               <div class="v">Helmet, CORS, JWT, validaciones robustas</div>
             </div>
           </div>
            ${
              env.ENV !== 'production'
                ? `<div class="docs-section">
              <a href="/docs" class="btn-docs">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6zm-1 2 5 5h-5V4zM6 20V4h5v7h7v9H6z"/><path d="M8 12h8v2H8zm0 4h5v2H8z"/></svg>
                Ver Documentación API
              </a>
            </div>`
                : ''
            }
        </section>
        <footer class="footer">© ${new Date().getFullYear()} · Made with ❤️ by Ivan Madera</footer>
      </main>
    </body>
  </html>`

  const status = Codes.success
  return res.status(status).type('html').send(html)
}

export const headerNoCache = (req: any, res: any, next: any): void => {
  const url = req.originalUrl
  const status = Codes.errorServer

  try {
    res.setHeader('Cache-Control', 'no-store')
    return next()
  } catch (error) {
    return res.status(status).json(JsonApiResponseError(error, url))
  }
}
