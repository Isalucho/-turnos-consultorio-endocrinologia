# Turnos — Consultorio de Endocrinología

Aplicación web para que pacientes se registren y saquen turnos online, y para que la
administradora del consultorio gestione horarios de atención, bloqueos y turnos desde un panel.

## Stack

- **Next.js 16** (App Router) + TypeScript + Tailwind CSS + shadcn/ui
- **PostgreSQL** vía **Prisma 7** (driver adapter `@prisma/adapter-pg`)
- **Auth.js (next-auth v5)** con Credentials provider (email + contraseña), sesiones JWT y roles
  `PACIENTE` / `ADMIN`
- **Resend** + React Email para los emails de confirmación/cancelación/reprogramación de turnos

## Requisitos previos

- Node.js 20+
- Una base de datos PostgreSQL. Recomendado: [Neon](https://neon.tech) (tiene plan gratuito y se
  integra directo con Vercel).

## Configuración local

1. Instalar dependencias:

   ```bash
   npm install
   ```

2. Copiar `.env.example` a `.env` y completar las variables:

   ```bash
   cp .env.example .env
   ```

   - `DATABASE_URL`: cadena de conexión a tu base Postgres (Neon, local, etc.)
   - `AUTH_SECRET`: generar con `openssl rand -base64 32` (o `node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"`)
   - `ADMIN_EMAIL` / `ADMIN_PASSWORD` / `ADMIN_NAME`: credenciales del usuario administrador que
     va a crear el script de seed
   - `RESEND_API_KEY` / `EMAIL_FROM`: opcional en desarrollo. Si se deja vacío, los emails se
     loguean en la consola del servidor en vez de enviarse.

3. Crear las tablas en la base de datos:

   ```bash
   npm run db:migrate
   ```

4. Crear el usuario administrador (usa `ADMIN_EMAIL` / `ADMIN_PASSWORD` del `.env`):

   ```bash
   npm run db:seed
   ```

5. Levantar el servidor de desarrollo:

   ```bash
   npm run dev
   ```

   Abrir [http://localhost:3000](http://localhost:3000). Registrate como paciente desde
   `/registro`, o iniciá sesión como administradora en `/login` con las credenciales del seed.

   > Antes de sacar turnos vas a necesitar cargar al menos una franja horaria desde
   > `/admin/horarios` (como admin), si no `/turnos` va a mostrar "no hay horarios disponibles".

## Scripts

| Comando | Descripción |
| --- | --- |
| `npm run dev` | Servidor de desarrollo |
| `npm run build` | Build de producción |
| `npm run start` | Corre el build de producción |
| `npm run lint` | ESLint |
| `npm run db:migrate` | Aplica migraciones de Prisma (`prisma migrate dev`) |
| `npm run db:seed` | Crea/actualiza el usuario admin |
| `npm run db:studio` | Abre Prisma Studio para inspeccionar la base |

## Estructura relevante

```
prisma/schema.prisma       Modelo de datos (User, WorkingHours, BlockedDate, Appointment)
prisma/seed.ts              Script que crea el usuario admin
prisma.config.ts            Configuración de Prisma 7 (CLI / migraciones)
src/auth.ts                 Configuración de Auth.js (Credentials, JWT, roles)
src/proxy.ts                 Protección de rutas por rol (reemplaza a middleware.ts en Next 16)
src/lib/availability.ts      Cálculo de horarios disponibles
src/lib/email.ts             Envío de emails transaccionales (Resend)
src/app/registro, /login     Alta de cuenta e inicio de sesión
src/app/turnos               Sacar turno, mis turnos (cancelar/reprogramar) — rol PACIENTE
src/app/admin                Turnos, horarios, bloqueos, pacientes — rol ADMIN
```

## Despliegue en producción (Vercel + Supabase/Neon + Resend)

1. **Base de datos**: crear un proyecto en [Supabase](https://supabase.com) o
   [Neon](https://neon.tech) y copiar el `DATABASE_URL`.
   > **Importante (Supabase + Vercel):** usar el connection string del **"Transaction pooler"**
   > (puerto `6543`), no el "Session pooler" (`5432`). Vercel corre en funciones serverless de
   > vida corta, y el Session pooler puede colgar las conexiones desde ese entorno. El Transaction
   > pooler está pensado justo para este caso.
2. **Email**: crear cuenta en [Resend](https://resend.com), generar una `RESEND_API_KEY`. Para
   producción hay que verificar un dominio propio en Resend; mientras tanto se puede usar el
   remitente de pruebas `onboarding@resend.dev`.
3. **Hosting**: importar el repositorio en [Vercel](https://vercel.com/new) (o usar `vercel` CLI)
   y configurar las variables de entorno (`DATABASE_URL`, `AUTH_SECRET`, `RESEND_API_KEY`,
   `EMAIL_FROM`).
4. Correr las migraciones contra la base de producción (`DATABASE_URL` apuntando a Supabase/Neon):

   ```bash
   npm run db:migrate
   ```

5. Crear el usuario admin en producción:

   ```bash
   DATABASE_URL="..." ADMIN_EMAIL="..." ADMIN_PASSWORD="..." npm run db:seed
   ```

6. Hacer deploy en Vercel (se dispara automáticamente en cada push, o `vercel deploy` manual).
