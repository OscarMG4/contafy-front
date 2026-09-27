# contafy-front

Aplicación web SaaS para estudios contables en Perú. Interfaz para gestionar la contabilidad de las empresas cliente sobre la API de Contafy.

> Proyecto en desarrollo activo. Los módulos crecen por etapas.

## Stack

| | |
|---|---|
| Framework | Next.js 16 (App Router, Turbopack) |
| UI | React 19 · Ant Design 6 · Recharts |
| Datos | React Query · Axios |
| Estado | Zustand |
| Validación | Zod |
| Lenguaje | TypeScript |

## Proyectos relacionados

- **contafy-back**: API REST multi-tenant (Laravel 13).
- **contafy-crm**: panel de administración de la plataforma (Next.js).

## Módulos actuales

| Sección | Rutas |
|---|---|
| Dashboard | `/dashboard` |
| Clientes (empresas) | `/companies` |
| Proveedores | `/partners/suppliers` |
| Compras | `/purchases` · `/purchases/additional-costs/new` |
| Inventario | `/inventory/products` · `/inventory/warehouses` · `/inventory/receptions` · `/inventory/kardex` |
| Contabilidad | `/accounting/chart-of-accounts` · `/accounting/categories` · `/accounting/periods` · `/accounting/proration` |
| Reportes | `/reports` · `/reports/purchase-register` |

Las opciones del menú que aún no tienen página muestran un placeholder (`app/(app)/[...slug]`).

## Puesta en marcha

```bash
cp .env.example .env.local   # NEXT_PUBLIC_API_URL → URL de contafy-back (…/api/v1)
npm install
npm run dev                  # http://localhost:3000
```

Requiere `contafy-back` levantado. No hay registro público: los estudios y su usuario administrador se crean desde `contafy-crm`, y con esas credenciales se inicia sesión aquí.

| Script | Uso |
|---|---|
| `npm run dev` | servidor de desarrollo |
| `npm run build` · `npm start` | build y servidor de producción |
| `npm run lint` | ESLint |

## Estructura

```
src/
├── app/                    solo rutas (delgadas)
│   ├── (auth)/             login · layout con panel de marca
│   ├── (app)/              rutas privadas · layout con sidebar + header
│   │   └── [...slug]/      placeholder de módulos aún no creados
│   └── layout.tsx          providers + tema (cookie → sin parpadeo)
├── proxy.ts                protección de rutas (antes "middleware")
├── core/                   infraestructura transversal
│   ├── config/             env, navigation (menú lateral)
│   ├── http/               apiClient, ApiError
│   ├── session/            cookies de sesión
│   ├── theme/              paleta y tema antd claro/oscuro
│   └── providers/
├── shared/                 UI y utilidades reutilizables (layout, ui, lib)
└── modules/<modulo>/       un módulo por contexto del backend
    ├── domain/             tipos y reglas puras
    ├── infrastructure/     llamadas a la API
    ├── application/        hooks (React Query) / stores
    └── presentation/       componentes
```

### Cliente HTTP

`core/http/api-client.ts` envía en cada petición:

- `Authorization: Bearer <token>`
- `X-Tenant`: estudio contable de la sesión.
- `X-Company`: empresa cliente seleccionada.

Ante un `401` intenta renovar el token con el refresh token (`/auth/refresh`) y reintenta la petición; si falla, redirige al login.

**Nuevo módulo:** crea `src/modules/<modulo>/…`, su página en `src/app/(app)/<ruta>/page.tsx` y agrégalo a `src/core/config/navigation.tsx`.
