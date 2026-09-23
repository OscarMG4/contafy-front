# contafy-front

Frontend de Contafy · Next.js 16 (App Router, Turbopack) · React 19 · Ant Design 6 · React Query · Zustand · Axios.

## Puesta en marcha

```bash
cp .env.example .env.local   # NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1
npm install
npm run dev                  # http://localhost:3000
```

Con el backend y su seeder: empresa `demo`, usuario `admin@contafy.test`, contraseña `password123`.

## Estructura

```
src/
├── app/                    solo rutas (delgadas)
│   ├── (auth)/             login, register · layout con panel de marca
│   ├── (app)/              rutas privadas · layout con sidebar + header
│   │   ├── dashboard/
│   │   └── [...slug]/      placeholder de módulos aún no creados
│   └── layout.tsx          providers + tema (cookie → sin parpadeo)
├── proxy.ts                protección de rutas (antes "middleware")
├── core/                   infraestructura transversal
│   ├── config/             env, navigation (menú lateral)
│   ├── http/               apiClient (Bearer + X-Tenant, 401 → login), ApiError
│   ├── session/            cookies de sesión
│   ├── theme/              paleta morado/negro/blanco, tema antd claro/oscuro
│   └── providers/
├── shared/                 UI y utilidades reutilizables (layout, ui, lib)
└── modules/<modulo>/       un módulo por contexto del backend
    ├── domain/             tipos y reglas puras
    ├── infrastructure/     llamadas a la API
    ├── application/        hooks (React Query) / stores
    └── presentation/       componentes
```

**Nuevo módulo:** crea `src/modules/<modulo>/…`, su página en `src/app/(app)/<ruta>/page.tsx` y agrégalo a `src/core/config/navigation.tsx`.

El dashboard usa datos de ejemplo en `modules/dashboard/infrastructure/dashboard.api.ts`; reemplázalos por el endpoint real cuando exista.
