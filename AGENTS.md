# PROJECT KNOWLEDGE BASE

**Generated:** 2026-06-10

## OVERVIEW

Project: **StudyHub**

Stack: **Nx 22.5.4 monorepo** using **pnpm**, with:

- **Angular 21.1 SSR frontend** (`apps/web`) using **TypeScript 5.9**, **Express 4.21**, **Tailwind CSS 4.2**, **daisyUI 5.5.x**, **RxJS 7.8**, Angular standalone components/routes, strict templates, in-repo typed translations (`fr`, `en`, `de`), **ESLint 9**, and **Prettier 3.6**.
- **.NET 10 backend** (`apps/api`) using **ASP.NET Core Minimal APIs**, **WolverineFx 5.20**, **FluentValidation 12**, **EF Core 10**, **Npgsql/PostgreSQL**, **JWT bearer auth via HttpOnly cookies**, **TOTP 2FA via Otp.NET**, **Serilog 4.3**, **SMTP email**, **Cloudflare R2 via AWSSDK.S3**, **PdfPig** PDF text extraction, and a **Groq/OpenAI-compatible chat completions integration** for PDF metadata suggestions.
- **.NET MAUI mobile app scaffold** (`apps/mobile`) targeting .NET 10 mobile TFMs. It is currently the default MAUI starter/counter app rather than a full StudyHub client.

Backend route groups and application slices cover auth, TOTP, feed/posts, AI metadata suggestions, comments, and users/profile editing. The Angular frontend uses same-origin `/api/*` URLs through the Angular SSR Express proxy and currently has pages for landing, login/signup verification and password-reset flows, authenticated home feed, upload with AI metadata suggestions, post detail with PDF viewer/voting/download/reporting/threaded comments, current-user profile, profile edit/TOTP setup, and public user profiles.

## STRUCTURE

- `apps/web/`: Nx-managed Angular SSR application.
  - `apps/web/project.json`: Angular target config (`build`, `serve`, `lint`, `serve-static`). Build output is `dist/apps/web` with SSR server output enabled.
  - `apps/web/src/app/app.routes.ts`: client routes. Public: `/`, `/login`, `/signup`. Auth-protected: `/home`, `/profile`, `/profile/edit`, `/upload`, `/posts/:postId`, `/users/:userId`.
  - `apps/web/src/app/app.routes.server.ts`: Angular SSR route modes. Authenticated/browser-session pages are `RenderMode.Client`; fallback is prerendered.
  - `apps/web/src/app/app.config.ts`: standalone provider setup; registers French/German Angular locale data, fetch-based `HttpClient`, auth interceptor, hydration, and router.
  - `apps/web/src/app/core/`: guards, auth/session interceptor, API services, API models/error helpers, validators, theme/session/translation state, and typed i18n dictionaries.
    - `core/i18n/`: `fr`, `en`, `de` dictionaries. `fr` is the schema source; `en`/`de` satisfy `TranslationSchema`.
    - `core/services/translation.ts`: signal-based language selection persisted in `localStorage` under `studyhub.language`.
  - `apps/web/src/app/pages/`: standalone pages for landing, auth, home, upload, post detail, profile, profile edit, and public user profiles.
    - Auth pages live under `pages/auth/login/` and `pages/auth/signup/`; login composes nested verification/password-reset views and TOTP challenge UI.
    - `pages/upload/`: PDF upload form with client-side validation, tag handling, AI metadata suggestions, and localized UI.
    - `pages/profile-edit/`: editable user profile plus TOTP setup/enable/disable flow.
  - `apps/web/src/app/shared/components/`: reusable UI such as `Icon`, `PostCard`, `SiteHeader`, `MobileDock`, `ThemeToggle`, and `LanguageSelector`.
  - `apps/web/src/app/shared/pipes/translate.pipe.ts`: impure pipe wrapper around `TranslationService` for dictionary lookups/interpolation.
  - `apps/web/src/server.ts`: Express SSR entrypoint plus `/api` reverse proxy to the backend (`API_PROXY_TARGET`, default `http://localhost:5046`), including raw-body upload forwarding and `Set-Cookie` handling.
  - `apps/web/src/styles.css`: global Tailwind + daisyUI setup, including `studyhub` and `dark` themes.
  - `apps/web/public/`: static assets (`favicon.ico`, `studyhub-mark.svg`).
- `apps/api/`: ASP.NET Core API application.
  - `apps/api/Program.cs`: top-level bootstrap; wires Wolverine, auth, application/infrastructure services, exception handling, and endpoint groups.
  - `apps/api/Auth/AuthCookies.cs`: access/refresh cookie helpers (`studyhub.access_token`, `studyhub.refresh_token`). Refresh cookies are scoped to `/api/auth`.
  - `apps/api/Endpoints/`: Minimal API route groups for `auth`, `feed`, `posts`, `comments`, and `users`.
    - Auth includes register, verify account, login, TOTP login, TOTP setup/enable/disable, refresh, logout, send code, and password reset.
    - Posts include list/detail/update/delete, vote, report, download, upload, and `POST /api/posts/metadata-suggestions`.
  - `apps/api/DTOs/`: request/response DTOs for auth, posts, comments, and users.
  - `apps/api/Responses/SendResponse.cs`: standard JSend-like API response envelope used by endpoints.
  - `apps/api/Extensions/AuthenticationExtensions.cs`: JWT bearer setup with token extraction from cookies and custom 401/403 responses.
  - `apps/api/Properties/launchSettings.json`: development URLs (`http://localhost:5046`, `https://localhost:5000`).
- `apps/mobile/`: .NET MAUI single-project scaffold.
  - `mobile.csproj`: targets `net10.0-android`; also `net10.0-ios`, `net10.0-maccatalyst`, and Windows on supported OSes.
  - `MainPage.xaml` / `MainPage.xaml.cs`: template counter page. Treat as scaffold unless product work says otherwise.
  - `Resources/` and `Platforms/`: default MAUI assets and platform entrypoints.
- `libs/domain/`: core POCO entities and enums (`User`, `Post`, `Comment`, votes, reports, tags, auth codes, refresh tokens, TOTP login challenges).
- `libs/application/`: application layer with vertical-slice folders for `Auth`, `Posts`, `Comments`, and `Users`.
  - Typical slice contents: `Command`/`Query`, `Validator`, `Handler`, `Outcome`, `Result`.
  - `Auth/Totp/` and related handlers implement authenticator-app setup, enable/disable, login challenge, replay/attempt handling, and refresh-token revocation helpers.
  - `Posts/GeneratePostMetadata/`: validates PDFs, extracts text, calls the AI metadata service, normalizes title/description/tags, and maps provider/insufficient-text outcomes.
  - `Posts/PdfPostFileValidator.cs` and `Posts/PostMetadataNormalizer.cs`: shared post upload/metadata helpers.
  - `libs/application/*/Abstractions/`: repository/service interfaces consumed by handlers.
  - `libs/application/Extensions/ServiceCollectionExtensions.cs`: FluentValidation plus JWT and TOTP options registration/validation.
- `libs/infrastructure/`: persistence and external integrations.
  - `Persistence/StudyHubDbContext.cs` and `Persistence/Configurations/`: EF Core model.
  - `Persistence/Migrations/`: existing migrations; inspect before changing schema. Latest observed migration adds TOTP two-factor auth.
  - `Auth/`: repository, token service, TOTP service, and TOTP secret protection.
  - `Posts/`, `Comments/`: repository implementations.
  - `Storage/CloudflareR2PostFileStorageService.cs`: PDF storage integration.
  - `Email/`: SMTP auth-email service and templates.
  - `Pdf/PdfPigTextExtractionService.cs`: PDF text extraction from the first pages for AI metadata suggestions.
  - `Ai/GroqPostMetadataAiService.cs`: Groq/OpenAI-compatible chat completions client for JSON metadata suggestions.
  - `Options/`: Cloudflare, email, and Groq option models.
- `apps/Studyhub.slnx`: .NET solution for API, mobile scaffold, and shared libraries.
- `requests/`: REST Client `.http` request examples for auth/TOTP, posts/comments, and users. These use a `{{Api_HostAddress}}` variable.
- `docs/`: product/API planning and reference docs (`PRD.md`, `SPEC.md`, `*Endpoints.md`). Some docs are planning/stale; prefer current source code when docs conflict.
- `design/`: HTML mockups and screenshots for landing/auth/upload/profile/PDF detail/home pages.
- `plans/taches.md`: French backlog/idea list (AI metadata suggestions, i18n, TOTP, German university domain validation, etc.); treat as planning notes that may be stale.
- `.pi/settings.json`: local Pi skill configuration for this repo (Angular/Tailwind/daisyUI/Nx/minimal API/Wolverine/API design helpers). Not application runtime config.
- `.vscode/`: local launch/task helpers may exist for API, Angular, and MAUI. Do not treat these as the only supported workflows.

## COMMANDS

| Action                                 | Command                                                                                 |
| -------------------------------------- | --------------------------------------------------------------------------------------- |
| Install JS dependencies                | `pnpm install`                                                                          |
| List Nx projects                       | `pnpm exec nx show projects`                                                            |
| Show web project metadata              | `pnpm exec nx show project web`                                                         |
| Show API project metadata              | `pnpm exec nx show project Api`                                                         |
| Show mobile project metadata           | `pnpm exec nx show project mobile`                                                      |
| Restore .NET via Nx                    | `pnpm exec nx restore Api`                                                              |
| Restore full .NET solution             | `dotnet restore apps/Studyhub.slnx`                                                     |
| Serve frontend (dev SSR)               | `pnpm exec nx serve web`                                                                |
| Serve frontend with explicit API proxy | `API_PROXY_TARGET=http://localhost:5046 pnpm exec nx serve web`                         |
| Serve built frontend statically        | `pnpm exec nx serve-static web`                                                         |
| Run API through Nx                     | `pnpm exec nx run Api:run`                                                              |
| Watch API through Nx                   | `pnpm exec nx run Api:watch`                                                            |
| Run API directly                       | `dotnet run --project apps/api/Api.csproj`                                              |
| Build frontend                         | `pnpm exec nx build web`                                                                |
| Build frontend dev config              | `pnpm exec nx build web --configuration=development`                                    |
| Lint frontend                          | `pnpm exec nx lint web`                                                                 |
| Build API through Nx                   | `pnpm exec nx build Api`                                                                |
| Build API release through Nx           | `pnpm exec nx run Api:build:release`                                                    |
| Build API directly                     | `dotnet build apps/api/Api.csproj`                                                      |
| Build full .NET solution               | `dotnet build apps/Studyhub.slnx`                                                       |
| Publish API through Nx                 | `pnpm exec nx run Api:publish`                                                          |
| Clean API through Nx                   | `pnpm exec nx run Api:clean`                                                            |
| Build MAUI mobile via Nx               | `pnpm exec nx build mobile`                                                             |
| Build MAUI Android directly            | `dotnet build apps/mobile/mobile.csproj -f net10.0-android`                             |
| Run MAUI iOS simulator                 | `dotnet build apps/mobile/mobile.csproj -t:Run -f net10.0-ios -p:_DeviceName="iPhone 17"` |
| Tests                                  | No automated test projects/targets are configured yet                                   |

Notes:

- `package.json` currently has no custom npm scripts; call Nx/Angular/.NET commands directly through `pnpm exec`, `dotnet`, or Nx targets.
- `pnpm exec nx show projects` currently lists `Infrastructure`, `Application`, `Domain`, `mobile`, `Api`, and `web`.
- This tree uses `pnpm-lock.yaml` and `pnpm-workspace.yaml`; prefer `pnpm` and avoid reintroducing `package-lock.json` unless intentionally changing package managers.
- `node_modules/` may be absent on a fresh clone; Nx frontend commands will fail until `pnpm install` has been run.
- A normal local full-stack setup is API on `http://localhost:5046` (or `https://localhost:5000`) plus Angular dev server. The Angular SSR Express server proxies same-origin `/api/*` requests to `API_PROXY_TARGET`.
- Nx may print an Nx Cloud 401/unclaimed-workspace warning even when local targets succeed.
- Full solution/mobile builds require appropriate .NET MAUI workloads and platform tooling. Prefer `dotnet build apps/api/Api.csproj` or `pnpm exec nx build Api` when validating only the backend API/libraries.
- Observed local toolchain at generation: Node `v24.16.0`, pnpm `11.3.0`, .NET SDK `10.0.301`.

## CODING STANDARDS

- **Workspace style**
  - Nx orchestrates Angular and .NET projects; `.gitignore` excludes `node_modules/`, `dist/`, `.nx/cache`, `.angular`, `**/bin/`, `**/obj/`, and common generated artifacts.
  - `.editorconfig` enforces UTF-8, spaces, 2-space indentation, final newline, and trimmed trailing whitespace (Markdown keeps trailing whitespace disabled by exception). Some .NET/MAUI template files use tabs; follow nearby style when editing.
  - `.prettierrc` enforces single quotes for frontend formatting.
  - Root flat ESLint config lives in `eslint.config.mjs`; `apps/web/eslint.config.mjs` extends Angular/template rules.
- **Angular / TypeScript**
  - Uses standalone bootstrapping/components (`bootstrapApplication`, route-level `loadComponent`), not NgModules.
  - TypeScript/Angular strict mode is enabled in `apps/web/tsconfig.json` (`strictTemplates`, strict injection parameters, no implicit returns, etc.).
  - Prefer signals/computed state, `ChangeDetectionStrategy.OnPush`, `inject()`, and modern Angular `input()`/`output()` where it fits shared components.
  - Use typed reactive forms for form-heavy pages; keep validation messages close to components and route dictionaries.
  - API access lives in injectable services under `core/services/*-api.ts`, returning unwrapped envelope data via RxJS `map` and throwing meaningful errors.
  - Auth/session flow uses HttpOnly cookies, `AuthSessionStore`, route guards, and `authSessionInterceptor` to add credentials and refresh sessions on 401s.
  - Use same-origin `/api/...` URLs from the frontend; do not hard-code the backend host in Angular services.
  - Authenticated/browser-session pages should remain `RenderMode.Client` in `app.routes.server.ts` because session state is browser/cookie dependent.
  - Prefer Tailwind utility classes and daisyUI components/tokens for UI. Reuse shared `PostCard`, `Icon`, `ThemeToggle`, `LanguageSelector`, `MobileDock`, `SiteHeader`, and header/sidebar patterns when possible.
  - For i18n, add keys to `core/i18n/fr` first, keep `en`/`de` aligned with `TranslationSchema`, and render via `TranslationService` or `TranslatePipe` with interpolation values.
  - Angular selector rules are enforced: directives use attribute selectors with `app` + camelCase; components use element selectors with `app` + kebab-case.
- **C# / .NET**
  - All .NET projects target `net10.0` (mobile uses platform TFMs), nullable reference types are enabled, and implicit usings are enabled.
  - API uses top-level statements and Minimal API endpoint grouping (`MapAuthEndpoints`, `MapPostEndpoints`, etc.). Most non-auth groups call `.RequireAuthorization()`.
  - Wolverine discovers handlers from the Application assembly; handlers expose static `Handle(...)` methods and use constructor/service parameters supplied by DI.
  - FluentValidation validators sit beside commands/queries and are invoked explicitly inside handlers.
  - Keep domain entities as POCOs. EF Core configuration is centralized under `libs/infrastructure/Persistence/Configurations`.
  - Application defines repository/service abstractions; Infrastructure implements them. Preserve the `Domain -> Application -> Infrastructure -> Api` dependency direction.
  - API responses are generally wrapped with `SendResponse.Success(...)`, `SendResponse.Fail(...)`, or `SendResponse.Error(...)`.
  - Endpoint code mixes 2- and 4-space indentation in older files; follow nearby style when editing a file and keep formatting consistent.
  - For options, use `AddOptions<T>().BindConfiguration(...).Validate(...).ValidateOnStart()` where appropriate, and keep secret values out of source.
- **MAUI**
  - `apps/mobile` is currently a scaffold. Follow .NET MAUI single-project conventions (`Resources/`, `Platforms/`, XAML + code-behind) if expanding it.
  - Validate mobile changes with explicit target frameworks (`-f net10.0-android`, `-f net10.0-ios`, etc.) because platform workloads differ by machine.

## WHERE TO LOOK

- **Frontend route map**: `apps/web/src/app/app.routes.ts`, `apps/web/src/app/app.routes.server.ts`
- **Frontend app providers/locale registration**: `apps/web/src/app/app.config.ts`
- **Frontend API/session logic**: `apps/web/src/app/core/services/`, `apps/web/src/app/core/guards/`, `apps/web/src/app/core/interceptors/`
- **Frontend API types/error helpers**: `apps/web/src/app/core/types/`
- **Frontend i18n**: `apps/web/src/app/core/i18n/`, `apps/web/src/app/core/services/translation.ts`, `apps/web/src/app/shared/pipes/translate.pipe.ts`
- **Frontend auth UI**: `apps/web/src/app/pages/auth/`
- **Frontend shared UI**: `apps/web/src/app/shared/components/`
- **Home/feed/profile UI**: `apps/web/src/app/pages/home/`, `apps/web/src/app/pages/profile/`, `apps/web/src/app/pages/profile-edit/`, `apps/web/src/app/pages/user-profile/`
- **Post detail/comments UI**: `apps/web/src/app/pages/post-detail/`, `apps/web/src/app/core/services/comments-api.ts`
- **Upload + AI suggestions UI**: `apps/web/src/app/pages/upload/`, `apps/web/src/app/core/services/posts-api.ts`
- **SSR/API proxy**: `apps/web/src/server.ts`
- **API route definitions**: `apps/api/Endpoints/`
- **API DTOs/envelope**: `apps/api/DTOs/`, `apps/api/Responses/SendResponse.cs`
- **Auth cookies/JWT/TOTP**: `apps/api/Auth/AuthCookies.cs`, `apps/api/Extensions/AuthenticationExtensions.cs`, `libs/application/Auth/`, `libs/infrastructure/Auth/`
- **Application logic/handlers**: `libs/application/`
- **Post upload/metadata logic**: `libs/application/Posts/CreatePost/`, `libs/application/Posts/GeneratePostMetadata/`, `libs/application/Posts/PdfPostFileValidator.cs`, `libs/application/Posts/PostMetadataNormalizer.cs`
- **Persistence + migrations**: `libs/infrastructure/Persistence/`
- **External integrations**: `libs/infrastructure/Email/`, `libs/infrastructure/Storage/`, `libs/infrastructure/Pdf/`, `libs/infrastructure/Ai/`
- **Domain model**: `libs/domain/Entities/`, `libs/domain/Enums/`
- **Mobile scaffold**: `apps/mobile/mobile.csproj`, `apps/mobile/MainPage.xaml`, `apps/mobile/MauiProgram.cs`
- **Manual API examples**: `requests/**/*.http`
- **Product/docs context**: `docs/PRD.md`, `docs/SPEC.md`, `docs/*Endpoints.md`
- **Backlog/planning notes**: `plans/taches.md`
- **UI references**: `design/*/code.html`, `design/*/screen.png`
- **Project config**: `package.json`, `nx.json`, `apps/web/project.json`, `apps/*.slnx`, `*.csproj`

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
  - `Groq:ApiKey` for AI metadata suggestions
  - Optional but recommended: `Totp:SecretEncryptionKey` for encrypting TOTP seeds at rest; when omitted, the JWT secret is used as a fallback key.
- Development defaults in `apps/api/appsettings.Development.json` include JWT issuer/audience/lifetimes, email sender/server, Cloudflare bucket name, Groq defaults, and TOTP lifetimes/attempt limits, but not secrets.
- Do not commit local secret files. Prefer `dotnet user-secrets`, environment variables, or deployment secret stores for API secrets.
- Infrastructure normalizes `postgres://` / `postgresql://` URLs into Npgsql connection strings, so either format can work.
- API launch settings expose `http://localhost:5046` and `https://localhost:5000`; `requests/**/*.http` examples expect an `Api_HostAddress` value such as `http://localhost:5046`.
- Auth is cookie-based. Frontend requests should use `withCredentials` or go through the interceptor; backend JWT bearer auth reads access tokens from cookies. The refresh cookie is scoped to `/api/auth`.
- TOTP flow: login returns HTTP 202 with a challenge when TOTP is enabled, then `/api/auth/login/totp` completes login and sets auth cookies. Profile edit handles setup/enable/disable and QR-code rendering.
- `CreatePost` accepts multipart form data, enforces a 15 MB PDF limit, validates the `%PDF-` header, rejects password-protected PDFs (`/Encrypt` marker), uploads to R2, normalizes metadata/tags, and cleans up uploaded objects on failure.
- `POST /api/posts/metadata-suggestions` accepts multipart PDF data without creating a post. It shares the 15 MB/PDF/password-protection validation, extracts text from up to 8 pages / 12k characters with PdfPig, calls Groq for JSON metadata, returns 422 for insufficient readable text, and does not perform OCR for scanned/image-only PDFs.
- The SSR proxy uses `express.raw({ limit: '15mb' })` for `/api`, matching upload and metadata-suggestion limits; increase proxy and backend limits together if upload size changes.
- Comments are implemented end-to-end as threaded comments with soft-delete (`[deleted]` text for deleted comments). The Angular post-detail page supports create, reply, edit, delete, refresh, and nested display.
- `docs/RestEndpoints.md` has been stale before (for example around comments); prefer source code in `apps/api/Endpoints/` over docs when they conflict.
- Post interactions include up/down/remove vote, download URL generation, metadata update/delete endpoints, AI metadata suggestions, and reporting. Frontend exposes voting/download/reporting in feed/detail contexts and delete-post in detail for owners/moderators.
- User deletion anonymizes accounts and clears auth cookies. Public user profiles are served by `/api/users/{userId}` and `/api/users/{userId}/posts`; the frontend route is `/users/:userId`. Current-user profile reads `/api/users/me`; profile editing uses `PATCH /api/users/me`.
- Feed/post list APIs support sort (`new`, `top`, `trending`), pagination, search, and tag filters. Current `top` and `trending` ordering are similar in repository implementation. `/api/feed` also offers cursor pagination.
- No root `README`, `.cursorrules`, or `CLAUDE.md` file was found; `AGENTS.md` is the main agent-oriented context file.
- Manual REST examples are under `requests/`; configure your REST client/environment with `Api_HostAddress`.
