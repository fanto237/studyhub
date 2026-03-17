# PROJECT KNOWLEDGE BASE

**Generated:** 2026-03-17

## OVERVIEW

Project: **StudyHub**
Stack: **Nx 22.5 monorepo** with **Angular 21.1** + **SSR/Express** frontend, **TypeScript 5.9**, **Tailwind CSS 4.2** + **daisyUI 5.5** for frontend styling, **ESLint 9** + **Prettier 3**, and a **.NET 10** backend/app libraries using **ASP.NET Core Minimal APIs**, **WolverineFx 5.20**, **Serilog 4.3**, **EF Core 10**, and **Npgsql 10**.

This repository is an early full-stack scaffold for a student-focused exam-sharing product. Product intent is documented in `docs/PRD.md` and `docs/SPEC.md`; implementation is still mostly starter/template code.

## STRUCTURE

- `apps/web/`: Angular application managed by Nx.
  - `apps/web/src/`: frontend source root.
  - `apps/web/src/app/`: root component, app config, and route definitions.
  - `apps/web/src/styles.css`: global stylesheet; imports Tailwind CSS and registers the daisyUI plugin.
  - `apps/web/src/server.ts`: Express-based Angular SSR entrypoint.
  - `apps/web/project.json`: Nx targets for `build`, `serve`, `lint`, and `serve-static`.
- `apps/api/`: ASP.NET Core Web app.
  - `apps/api/Program.cs`: current Minimal API bootstrap; still template-level.
  - `apps/api/Properties/launchSettings.json`: local dev URL (`https://localhost:3000`).
  - `apps/api/Api.http`: scratch file for manual API requests.
- `libs/domain/`: domain-layer .NET library.
- `libs/application/`: application-layer .NET library; references `libs/domain`.
- `libs/infrastructure/`: infrastructure-layer .NET library; references `libs/application` and adds EF Core/PostgreSQL packages.
- `apps/Studyhub.slnx`: .NET solution containing API + shared libraries.
- `docs/`: product and technical planning docs.
  - `docs/PRD.md`: product goals, UX, and feature scope.
  - `docs/SPEC.md`: planned architecture, API, and integration notes.
- `design/`: UI reference assets with screenshots plus HTML mockups for landing, auth, upload, profile, and PDF detail pages.
- `.vscode/extensions.json`: recommended VS Code extensions (Angular Console, Prettier, ESLint).

## COMMANDS

| Action                            | Command                                    |
| --------------------------------- | ------------------------------------------ |
| Install JS deps                   | `npm ci`                                   |
| Restore .NET deps                 | `npx nx restore Api`                       |
| Lint frontend                     | `npx nx lint web`                          |
| Build frontend                    | `npx nx build web`                         |
| Build backend                     | `npx nx build Api`                         |
| Run frontend                      | `npx nx serve web`                         |
| Run backend                       | `npx nx run Api`                           |
| Build full .NET solution directly | `dotnet build apps/Studyhub.slnx`          |
| Run API directly                  | `dotnet run --project apps/api/Api.csproj` |
| Test                              | `No automated tests are configured yet`    |

## CODING STANDARDS

- **Workspace style**
  - Monorepo orchestration is done through Nx.
  - `.editorconfig` enforces UTF-8, spaces, 2-space indentation, final newline, and trimmed trailing whitespace.
  - `.prettierrc` enforces single quotes.
- **TypeScript / Angular**
  - Angular uses the modern standalone/bootstrap style (`bootstrapApplication(...)`) rather than NgModules.
  - Frontend is SSR-enabled with `@angular/ssr` and an Express node server.
  - Styling is set up with Tailwind CSS v4 and daisyUI. Global registration currently lives in `apps/web/src/styles.css` via `@import 'tailwindcss';` and `@plugin "daisyui";`.
  - Prefer Tailwind utility classes and daisyUI component classes for new frontend styling work unless a component-specific stylesheet is clearly the better fit.
  - Flat ESLint config is used at the workspace root and extended in `apps/web/eslint.config.mjs`.
  - Angular selector rules are enforced:
    - directives: attribute selectors with `app` prefix, camelCase
    - components: element selectors with `app` prefix, kebab-case
  - Current frontend code is minimal and generated; routes are defined in `apps/web/src/app/app.routes.ts`.
- **C# / .NET**
  - All .NET projects target `net10.0` with nullable reference types and implicit usings enabled.
  - Backend uses top-level statements in `Program.cs` and Minimal API patterns.
  - Library projects currently use file-scoped namespaces and placeholder classes.
- **Architecture**
  - Intended layering is `Domain -> Application -> Infrastructure -> Api`.
  - `apps/api` references `Application` and `Infrastructure`.
  - `Infrastructure` already carries EF Core + PostgreSQL packages, but no persistence implementation exists yet.
  - `Application` and `Api` already reference Wolverine packages, but no CQRS handlers/endpoints are implemented yet.
- **Nx rules**
  - `@nx/enforce-module-boundaries` is enabled, though current dependency constraints are permissive (`*` -> `*`).

## WHERE TO LOOK

- **Frontend source**: `apps/web/src`
- **Backend source**: `apps/api`
- **Shared backend libs**: `libs/domain`, `libs/application`, `libs/infrastructure`
- **Manual API requests**: `apps/api/Api.http`
- **Product docs**: `docs/PRD.md`, `docs/SPEC.md`
- **Design references**: `design/*/code.html`, `design/*/screen.png`
- **Tests**: No test directories or test targets exist yet

## NOTES

- This repo is closer to a scaffold than a completed implementation.
  - Frontend still shows the default Nx/Angular welcome component.
  - Backend currently exposes only the template `/weatherforecast` endpoint.
  - `libs/domain`, `libs/application`, and `libs/infrastructure` still contain placeholder classes.
- `docs/SPEC.md` describes planned technologies such as PostgreSQL, PDF.js, S3/R2, auth flows, and REST endpoints; some of these are still not implemented in code. Trust the source tree over the spec when making changes.
- Tailwind CSS and daisyUI are now installed and wired into the Angular app's global stylesheet, but the actual application UI is still mostly starter/template code.
- Angular unit/e2e tests are disabled in `nx.json` generator defaults, and there are no .NET test projects yet.
- The frontend build is server-output SSR (`outputMode: "server"`), so deployment/runtime behavior differs from a purely static SPA.
- No pre-existing `AGENTS.md`, `CLAUDE.md`, or `.cursorrules` file was found at the repo root during this scan.
