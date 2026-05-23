# PROJECT KNOWLEDGE BASE

**Generated:** 2026-05-19

## OVERVIEW

Project: **StudyHub**
Stack: **Nx 22.5.4 monorepo** with an **Angular 21.1** SSR frontend (**TypeScript 5.9**, **Express 4**, **Tailwind CSS 4.2**, **daisyUI 5.5**, **RxJS 7.8**, **ESLint 9**, **Prettier 3.6**) and a **.NET 10** backend built with **ASP.NET Core Minimal APIs**, **WolverineFx 5.20**, **FluentValidation 12**, **EF Core 10**, **Npgsql/PostgreSQL**, **JWT bearer auth via HttpOnly cookies**, **Serilog 4.3**, **SMTP email**, and **Cloudflare R2 via AWSSDK.S3**.

Backend routes and application slices are implemented for auth, feed/posts, comments, and users. The Angular frontend now has real standalone feature pages for landing, login/signup, authenticated home feed, upload, post detail, and current-user profile, using same-origin `/api/*` calls through the SSR Express proxy.

## STRUCTURE

- `apps/web/`: Nx-managed Angular SSR application.
  - `apps/web/src/app/app.routes.ts`: client routes. Public: `/`, `/login`, `/signup`. Auth-protected: `/home`, `/profile`, `/upload`, `/posts/:postId`.
  - `apps/web/src/app/app.routes.server.ts`: Angular SSR route modes; authenticated/browser-session pages are `RenderMode.Client`.
  - `apps/web/src/app/core/`: guards, auth interceptor, API services, shared API models, validators.
  - `apps/web/src/app/pages/`: standalone page components for landing/auth/home/upload/post-detail/profile.
  - `apps/web/src/app/shared/components/`: reusable UI such as icons, post cards, site header, and theme toggle.
  - `apps/web/src/server.ts`: Express SSR entrypoint plus `/api` reverse proxy to the backend (`API_PROXY_TARGET`, default `http://localhost:5046`).
  - `apps/web/src/styles.css`: global Tailwind + daisyUI setup, including `studyhub` and `dark` themes.
- `apps/api/`: ASP.NET Core API application.
  - `apps/api/Program.cs`: top-level bootstrap; wires Wolverine, auth, application/infrastructure services, exception handling, and endpoint groups.
  - `apps/api/Auth/AuthCookies.cs`: access/refresh cookie helpers.
  - `apps/api/Endpoints/`: Minimal API route groups for `auth`, `feed`, `posts`, `comments`, and `users`.
  - `apps/api/DTOs/`: request/response DTOs for auth, posts, comments, and users.
  - `apps/api/Responses/SendResponse.cs`: standard API response envelope used by endpoints.
  - `apps/api/Extensions/AuthenticationExtensions.cs`: JWT bearer setup with token extraction from cookies.
  - `apps/api/Api.http`: manual request examples for auth, posts, comments, and users.
- `libs/domain/`: core POCO entities and enums (`User`, `Post`, `Comment`, votes, reports, tags, auth codes/tokens).
- `libs/application/`: application layer with vertical-slice folders for `Auth`, `Posts`, `Comments`, and `Users`.
  - Typical slice contents: `Command`/`Query`, `Validator`, `Handler`, `Outcome`, `Result`.
  - `libs/application/*/Abstractions/`: repository/service interfaces consumed by handlers.
  - `libs/application/Extensions/ServiceCollectionExtensions.cs`: validator and options registration.
- `libs/infrastructure/`: persistence and external integrations.
  - `Persistence/StudyHubDbContext.cs` and `Persistence/Configurations/`: EF Core model.
  - `Persistence/Migrations/`: existing migrations; inspect before changing schema.
  - `Auth/`, `Posts/`, `Comments/`: repository and token service implementations.
  - `Storage/CloudflareR2PostFileStorageService.cs`: PDF storage integration.
  - `Email/`: SMTP auth-email service and templates.
- `apps/Studyhub.slnx`: .NET solution for API + shared libraries.
- `docs/`: product/API planning and reference docs (`PRD.md`, `SPEC.md`, `*Endpoints.md`).
- `design/`: HTML mockups and screenshots for landing/auth/upload/profile/PDF detail pages.

## COMMANDS

| Action                                 | Command                                                   |
| -------------------------------------- | --------------------------------------------------------- |
| Install JS dependencies                | `npm ci`                                                  |
| Restore .NET via Nx                    | `npx nx restore Api`                                      |
| Restore .NET directly                  | `dotnet restore apps/Studyhub.slnx`                       |
| Serve frontend (dev SSR)               | `npx nx serve web`                                        |
| Serve frontend with explicit API proxy | `API_PROXY_TARGET=http://localhost:5046 npx nx serve web` |
| Run API through Nx                     | `npx nx run Api`                                          |
| Watch API through Nx                   | `npx nx watch Api`                                        |
| Run API directly                       | `dotnet run --project apps/api/Api.csproj`                |
| Build frontend                         | `npx nx build web`                                        |
| Build frontend dev config              | `npx nx build web --configuration=development`            |
| Lint frontend                          | `npx nx lint web`                                         |
| Build API through Nx                   | `npx nx build Api`                                        |
| Build .NET solution directly           | `dotnet build apps/Studyhub.slnx`                         |
| Tests                                  | No automated test projects/targets are configured yet     |

Notes:

- `node_modules/` may be absent; Nx commands will fail until `npm ci` has been run.
- A normal local full-stack setup is API on `http://localhost:5046` (or `https://localhost:5000`) plus Angular dev server. The Angular SSR Express server proxies same-origin `/api/*` requests to `API_PROXY_TARGET`.

## CODING STANDARDS

- **Workspace style**
  - Nx orchestrates Angular and .NET projects; `.gitignore` excludes `node_modules/`, `dist/`, `.nx/cache`, `.angular`, `apps/**/bin/`, and `apps/**/obj/`.
  - `.editorconfig` enforces UTF-8, spaces, 2-space indentation, final newline, and trimmed trailing whitespace.
  - `.prettierrc` enforces single quotes for frontend formatting.
  - Root flat ESLint config lives in `eslint.config.mjs`; `apps/web/eslint.config.mjs` extends Angular/template rules.
- **Angular / TypeScript**
  - Uses standalone bootstrapping/components (`bootstrapApplication`, route-level `loadComponent`), not NgModules.
  - Prefer signals/computed state and `ChangeDetectionStrategy.OnPush` for feature components.
  - Use typed reactive forms for form-heavy pages; keep validation messages close to components.
  - API access lives in injectable services under `core/services/*-api.ts`, returning unwrapped `ApiEnvelope<T>` data via RxJS `map` and throwing meaningful errors.
  - Auth/session flow uses HttpOnly cookies, `AuthSessionStore`, route guards, and `authSessionInterceptor` to add credentials and refresh sessions on 401s.
  - Use same-origin `/api/...` URLs from the frontend; do not hard-code the backend host in Angular services.
  - Prefer Tailwind utility classes and daisyUI components/tokens for UI. Reuse shared `PostCard`, `Icon`, `ThemeToggle`, and header/sidebar patterns when possible.
  - Angular selector rules are enforced: directives use attribute selectors with `app` + camelCase; components use element selectors with `app` + kebab-case.
- **C# / .NET**
  - All .NET projects target `net10.0`, nullable reference types are enabled, and implicit usings are enabled.
  - API uses top-level statements and Minimal API endpoint grouping (`MapAuthEndpoints`, `MapPostEndpoints`, etc.).
  - Wolverine discovers handlers from the `Application` assembly; handlers expose static `Handle(...)` methods and use constructor/service parameters supplied by DI.
  - FluentValidation validators sit beside commands/queries and are invoked explicitly inside handlers.
  - Keep domain entities as POCOs. EF Core configuration is centralized under `libs/infrastructure/Persistence/Configurations`.
  - Application defines repository/service abstractions; Infrastructure implements them. Preserve the `Domain -> Application -> Infrastructure -> Api` dependency direction.
  - API responses are generally wrapped with `SendResponse.Success(...)`, `SendResponse.Fail(...)`, or `SendResponse.Error(...)`.

## WHERE TO LOOK

- **Frontend routes/pages**: `apps/web/src/app/app.routes.ts`, `apps/web/src/app/pages/`
- **Frontend API/session logic**: `apps/web/src/app/core/services/`, `apps/web/src/app/core/guards/`, `apps/web/src/app/core/interceptors/`
- **Frontend shared UI**: `apps/web/src/app/shared/components/`
- **SSR/API proxy**: `apps/web/src/server.ts`
- **API route definitions**: `apps/api/Endpoints/`
- **API DTOs/envelope**: `apps/api/DTOs/`, `apps/api/Responses/SendResponse.cs`
- **Auth cookies/JWT**: `apps/api/Auth/AuthCookies.cs`, `apps/api/Extensions/AuthenticationExtensions.cs`, `libs/infrastructure/Auth/`
- **Application logic/handlers**: `libs/application/`
- **Persistence + migrations**: `libs/infrastructure/Persistence/`
- **External integrations**: `libs/infrastructure/Email/`, `libs/infrastructure/Storage/`
- **Domain model**: `libs/domain/Entities/`, `libs/domain/Enums/`
- **Manual API examples**: `apps/api/Api.http`
- **Product/docs context**: `docs/PRD.md`, `docs/SPEC.md`, `docs/*Endpoints.md`
- **UI references**: `design/*/code.html`, `design/*/screen.png`

## NOTES

- Runtime configuration is secret-heavy. The backend expects values for at least:
  - `ConnectionString:Default`
  - `JwtSetting:Secret`
  - `Cloudflare:Api`
  - `Cloudflare:AccessKeyId`
  - `Cloudflare:SecretAccessKey`
  - `Cloudflare:PublicBaseUrl`
  - `EmailSetting:Username`
  - `EmailSetting:Password`
- Development defaults in `apps/api/appsettings.Development.json` include JWT issuer/audience/lifetimes, email sender/server, and Cloudflare bucket name, but not secrets.
- Infrastructure normalizes `postgres://` / `postgresql://` URLs into Npgsql connection strings, so either format can work.
- API launch settings expose `http://localhost:5046` and `https://localhost:5000`; `apps/api/Api.http` currently targets `http://localhost:5046`.
- Auth is cookie-based. Frontend requests should use `withCredentials` or go through the interceptor; backend JWT bearer auth reads access tokens from cookies.
- `CreatePost` accepts multipart form data, enforces a 15 MB PDF limit, validates the `%PDF-` header, rejects password-protected PDFs, uploads to R2, and cleans up uploaded objects on failure.
- Comments are implemented on the backend as threaded comments with soft-delete (`[deleted]` text for deleted comments). The current Angular post-detail page displays comments but does not yet expose full comment CRUD UI.
- User deletion anonymizes accounts and clears auth cookies.
- Feed/post list APIs support sort (`new`, `top`, `trending`), pagination, search, and tag filters. Current `top` and `trending` ordering are similar in the repository implementation.
- The SSR proxy uses `express.raw({ limit: '15mb' })` for `/api`, matching the upload limit; increase both proxy and backend limits together if upload size changes.
- No root `.cursorrules` or `CLAUDE.md` file was found; `AGENTS.md` is the main agent-oriented context file.
