# PROJECT KNOWLEDGE BASE

**Generated:** 2026-03-29

## OVERVIEW

Project: **StudyHub**
Stack: **Nx 22.5.4 monorepo** with an **Angular 21.1** SSR frontend (**TypeScript 5.9**, **Express**, **Tailwind CSS 4.2**, **daisyUI 5.5**, **ESLint 9**, **Prettier 3**) and a **.NET 10** backend built with **ASP.NET Core Minimal APIs**, **WolverineFx 5.20**, **FluentValidation 12**, **EF Core 10**, **Npgsql 10/PostgreSQL**, **JWT bearer auth**, **Serilog 4.3**, **SMTP email**, and **Cloudflare R2 via the AWS S3 SDK**.

The repository is no longer just a blank scaffold: the backend already implements auth, feed, posts, and user-profile flows. The frontend is still mostly starter/template code and does not yet consume the API.

## STRUCTURE

- `apps/web/`: Nx-managed Angular application.
  - `apps/web/src/app/`: root standalone app component/config/routes.
  - `apps/web/src/server.ts`: Express-based Angular SSR entrypoint.
  - `apps/web/src/styles.css`: global Tailwind + daisyUI setup, including custom `studyhub` and `dark` themes.
  - `apps/web/src/app/nx-welcome.ts`: generated starter component still rendered by the app.
  - `apps/web/project.json`: frontend build/serve/lint targets.
- `apps/api/`: ASP.NET Core API application.
  - `apps/api/Program.cs`: top-level bootstrap; wires Wolverine, auth, application/infrastructure services, and endpoint groups.
  - `apps/api/Endpoints/`: grouped Minimal API route modules for `auth`, `feed`, `posts`, and `users`.
  - `apps/api/DTOs/`: request/response DTOs for auth, posts, and users.
  - `apps/api/Extensions/AuthenticationExtensions.cs`: JWT bearer setup with cookie token extraction.
  - `apps/api/appsettings*.json`: non-secret config defaults; real secrets are expected from user secrets/environment.
  - `apps/api/Api.http`: manual request examples for auth, feed, posts, and users.
- `libs/domain/`: core domain entities and enums.
  - `libs/domain/Entities/`: `User`, `Post`, `Comment`, vote/report/tag/auth-token entities.
  - `libs/domain/Enums/`: roles, vote values, report reasons, auth code purposes.
- `libs/application/`: application layer.
  - Vertical-slice folders for `Auth`, `Posts`, and `Users`.
  - Each slice usually contains `Command/Query`, `Validator`, `Handler`, `Outcome`, and `Result` types.
  - `libs/application/*/Abstractions/`: repository/service interfaces consumed by handlers.
  - `libs/application/Extensions/ServiceCollectionExtensions.cs`: validator and option registration.
- `libs/infrastructure/`: persistence and external integrations.
  - `libs/infrastructure/Persistence/StudyHubDbContext.cs`: EF Core DbContext.
  - `libs/infrastructure/Persistence/Configurations/`: entity configurations.
  - `libs/infrastructure/Persistence/Migrations/`: existing EF Core migrations; schema is already evolving.
  - `libs/infrastructure/Auth/`: auth repository + JWT token service.
  - `libs/infrastructure/Posts/`: post repository.
  - `libs/infrastructure/Storage/`: Cloudflare R2 file storage service.
  - `libs/infrastructure/Email/`: SMTP email sender + HTML/plain-text templates.
- `apps/Studyhub.slnx`: .NET solution for API + shared libraries.
- `docs/`: product and API planning/reference docs.
  - `docs/PRD.md`, `docs/SPEC.md`: product + architecture intent.
  - `docs/Posts-Endpoints.md`, `docs/Users-Endpoints.md`, `docs/RestEndpoints.md`: API planning/reference notes.
- `design/`: HTML mockups and screenshots for landing/auth/upload/profile/PDF detail pages.

## COMMANDS

| Action | Command |
| --- | --- |
| Install JS dependencies | `npm ci` |
| Restore .NET dependencies | `npx nx restore Api` |
| Serve frontend (dev) | `npx nx serve web` |
| Lint frontend | `npx nx lint web` |
| Build frontend | `npx nx build web` |
| Run API through Nx | `npx nx run Api` |
| Watch API | `npx nx watch Api` |
| Build API through Nx | `npx nx build Api` |
| Build .NET solution directly | `dotnet build apps/Studyhub.slnx` |
| Run API directly | `dotnet run --project apps/api/Api.csproj` |
| Tests | `No automated test projects/targets are configured yet` |

## CODING STANDARDS

- **Workspace style**
  - Nx orchestrates both Angular and .NET projects.
  - `.editorconfig` enforces UTF-8, spaces, 2-space indentation, final newline, and trimmed trailing whitespace.
  - `.prettierrc` enforces single quotes.
  - Root flat ESLint config lives in `eslint.config.mjs` and is extended by `apps/web/eslint.config.mjs`.
- **Angular / TypeScript**
  - Uses standalone Angular bootstrapping (`bootstrapApplication(...)`), not NgModules.
  - SSR is enabled via `@angular/ssr` with an Express Node server.
  - Prefer Tailwind utility classes and daisyUI components for new UI work.
  - Angular selector rules are enforced:
    - directives: attribute selectors, `app` prefix, camelCase
    - components: element selectors, `app` prefix, kebab-case
  - Current frontend code is minimal: `appRoutes` is empty and the root component still renders the generated Nx welcome component.
- **C# / .NET**
  - All .NET projects target `net10.0`, use nullable reference types, and enable implicit usings.
  - API uses top-level statements and Minimal API endpoint grouping.
  - Wolverine discovers handlers from the `Application` assembly; handlers are static `Handle(...)` methods.
  - FluentValidation validators sit beside commands/queries and are invoked explicitly inside handlers.
  - Domain entities are POCOs; EF Core configuration is centralized under `libs/infrastructure/Persistence/Configurations`.
- **Architecture / patterns**
  - Intended layering is active in code: `Domain -> Application -> Infrastructure -> Api`.
  - `Application` defines abstractions; `Infrastructure` implements repositories/services.
  - Auth uses JWT bearer auth, but access tokens are read from HTTP cookies in `AuthenticationExtensions`.
  - Post creation uploads PDFs to Cloudflare R2 and stores metadata in PostgreSQL.
  - Query/command slices already exist for auth, post feed/list/detail/upload/edit/delete/vote/report, and current/public user profile flows.

## WHERE TO LOOK

- **Frontend source**: `apps/web/src`
- **API routes**: `apps/api/Endpoints`
- **API DTOs**: `apps/api/DTOs`
- **Application logic / handlers**: `libs/application`
- **Persistence + migrations**: `libs/infrastructure/Persistence`
- **External integrations**: `libs/infrastructure/Auth`, `libs/infrastructure/Email`, `libs/infrastructure/Storage`
- **Domain model**: `libs/domain/Entities`, `libs/domain/Enums`
- **Manual API examples**: `apps/api/Api.http`
- **Product/docs context**: `docs/PRD.md`, `docs/SPEC.md`, `docs/*Endpoints.md`
- **UI references**: `design/*/code.html`, `design/*/screen.png`

## NOTES

- Backend status is materially ahead of the old scaffold: `/api/auth`, `/api/feed`, `/api/posts`, and `/api/users` are wired and backed by application/infrastructure code.
- Frontend status is still early: the app currently shows a theme toggle plus the generated Nx welcome content; there are no feature routes yet.
- Comment CRUD endpoints are not implemented yet. Comments currently appear only in post detail query results.
- EF Core migrations already exist under `libs/infrastructure/Persistence/Migrations`; inspect existing schema/configuration before changing entities.
- Runtime configuration is secret-heavy. The backend expects values for at least:
  - `ConnectionString:Default`
  - `JwtSetting:Secret`
  - `Cloudflare:Api`
  - `Cloudflare:AccessKeyId`
  - `Cloudflare:SecretAccessKey`
  - `Cloudflare:PublicBaseUrl`
  - `EmailSetting:Username`
  - `EmailSetting:Password`
- Infrastructure normalizes `postgres://` / `postgresql://` URLs into Npgsql connection strings, so either format can work.
- API launch settings use `https://localhost:5000`, while `apps/api/Api.http` still uses its own `@Api_HostAddress` placeholder; keep that file in sync when testing locally.
- `CreatePost` accepts multipart form data, enforces a 15 MB PDF limit, validates the PDF header, and rejects password-protected PDFs.
- Ignore generated/build artifacts during exploration: `node_modules/`, `dist/`, `apps/**/bin/`, `apps/**/obj/`, `libs/**/obj/`.
- No root `.cursorrules` or `CLAUDE.md` file was found; `AGENTS.md` is the main agent-oriented context file.
