# Antigravity & Cursor Project Guidelines - SaaS Petshop White-Label

## 🎨 Design System & Visual Identity (Dark Mode Aesthetic)
1. **Color Palette & Theme Tokens**:
   - Canvas / Background: `bg-matte-canvas` (`#0f1419`), `bg-background` (`#0e1511`)
   - Containers & Surfaces: `bg-surface-container` (`#1a211d`), `bg-surface-container-high` (`#242c27`), `bg-elevated-card` (`#1e293b`)
   - Primary Accent (Emerald Green): `#4edea3` (`text-primary`, `bg-primary`, `bg-primary-container` `#10b981`)
   - Hairline Borders: `border-hairline-border` (`#334155`)
   - Typography: Font Family `Hanken Grotesk` with Google Material Symbols Outlined icons.
2. **Styling Rules**:
   - Use Tailwind CSS utility classes exclusively.
   - Do NOT create separate `.css` files.
   - Use subtle glassmorphism (`backdrop-blur-md`), glow accents (`emerald-glow-sm`), extruded shadows (`extruded-shadow`), and responsive grid/flex layouts.

## 🏗️ Architecture & Layout Inheritance (App Router - DRY)
1. **Layout Hierarchy**:
   - Area do Cliente: Governed by `app/client/layout.tsx`. Contains `ClientSidebar`, `ClientHeader`, and `ClientBottomNav`. Subpages under `/client/*` (`/client`, `/client/pets`, `/client/agenda`, `/client/historico`) MUST NOT render duplicate navigation bars or headers.
   - Area do Admin: Governed by `app/admin/layout.tsx`.
2. **Responsive Component Strategy**:
   - Build a unified layout per page utilizing Tailwind's responsive prefixes (`hidden md:flex`, `grid-cols-1 md:grid-cols-3`).
   - Do NOT duplicate entire pages for mobile vs desktop unless explicitly rendering targeted sub-components.

## 🚫 Naming Conventions & Forbidden Terms
1. **Physical File & Folder Naming**:
   - NEVER use `petnexus` or brand-specific identifiers in physical file paths, directory names, or API routes.
   - Use clean, generic routes: `/client`, `/admin/clientes`, `/admin/pets`, `/admin/agenda`, `/admin/operacao`, `/admin/servicos`.

## 🔒 Supabase & Multi-Tenant SSR Backend
1. **Database & RLS Policies**:
   - Use `@supabase/ssr` with `lib/supabase/server.ts` and `lib/supabase/client.ts`.
   - Ensure all queries enforce multi-tenant isolation via `tenant_id`.
   - Refer to Supabase integration rules in `.agents/skills/supabase/SKILL.md`.

## 🔄 User Onboarding & Auth Flow
1. **Headers**:
   - Standard marketing and auth pages (`/`, `/auth/login`, `/auth/register`, `/auth/register-google`, `/auth/pet-register`) use `GlobalHeader.tsx`.
   - Do not render secondary step bars unless explicitly requested.

## 🧙‍♂️ Agente: Arquiteto Supabase & Segurança Multi-Tenant
**Ativação:** Sempre que a solicitação envolver banco de dados, tabelas, RLS, Autenticação (Login/Cadastro) ou gerenciamento de sessão.

**Diretrizes de Execução (Role Rules):**
1. **Stack Estrita:** Utilize EXCLUSIVAMENTE o pacote oficial `@supabase/ssr` para o Next.js App Router. Nunca utilize pacotes legados (como `@supabase/auth-helpers-nextjs`).
2. **Padrão de Clientes (Clients):**
   - Utilize `createBrowserClient` estritamente em Client Components (`use client`).
   - Utilize `createServerClient` estritamente em Server Components, Route Handlers e Server Actions.
3. **Paranoia Multi-Tenant:**
   - Assuma que o ecossistema é White-Label. NENHUMA tabela de negócio deve ser consultada sem garantir que as políticas de RLS (Row Level Security) pelo `tenant_id` estejam ativas.
   - O agente deve validar se as chaves `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_ANON_KEY` estão sendo injetadas corretamente nos helpers.
4. **Fluxo de Onboarding e Auth:**
   - O agente deve integrar as rotas `/auth/login` e `/auth/register` (e a rota do Google) garantindo que, ao criar um usuário na tabela nativa `auth.users`, haja um sincronismo com a tabela pública `profiles`.
   - Se o usuário não tiver uma sessão ativa, redirecione-o automaticamente via Middleware para a rota `/auth/login`.