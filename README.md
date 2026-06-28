# StudyHub

Full-stack study material sharing platform built as an Nx monorepo, with:

- **Web frontend**: Angular SSR app (`apps/web`)
- **API backend**: ASP.NET Core minimal API (`apps/api`)
- **Database**: PostgreSQL (EF Core + Npgsql)
- **Mobile**: .NET MAUI scaffold (`apps/mobile`)

## Table of Contents

- [StudyHub](#studyhub)
  - [Table of Contents](#table-of-contents)
  - [Project Structure](#project-structure)
  - [Installation](#installation)
    - [Prerequisites](#prerequisites)
    - [Getting Started](#getting-started)
  - [Usage](#usage)
    - [Run locally](#run-locally)
    - [Run with Docker Compose](#run-with-docker-compose)
  - [Environment Variables](#environment-variables)
  - [Contributing](#contributing)
  - [License](#license)

## Project Structure

```text
project-root/
├─ apps/
│  ├─ api/
│  │  ├─ Program.cs
│  │  ├─ Endpoints/
│  │  ├─ DTOs/
│  │  ├─ Responses/
│  │  ├─ Auth/
│  │  └─ Api.csproj
│  ├─ web/
│  │  ├─ src/
│  │  ├─ public/
│  │  └─ project.json
│  ├─ mobile/
│  │  ├─ MainPage.xaml
│  │  ├─ Platforms/
│  │  ├─ Resources/
│  │  └─ mobile.csproj
│  └─ Studyhub.slnx
├─ libs/
│  ├─ domain/
│  ├─ application/
│  └─ infrastructure/
├─ requests/
├─ docs/
├─ docker-compose.yml
├─ package.json
├─ nx.json
├─ pnpm-workspace.yaml
└─ README.md
```

- `apps/api`: ASP.NET Core API handling auth, posts, comments, users, PDF uploads, email, TOTP, and AI metadata suggestions.
- `apps/web`: Angular SSR frontend for landing, auth, feed, upload, post detail, profile, and user pages.
- `apps/mobile`: .NET MAUI starter app scaffold.
- `libs/domain`: Core domain entities and enums.
- `libs/application`: Application handlers, validators, abstractions, and use cases.
- `libs/infrastructure`: EF Core persistence, repositories, email, Cloudflare R2 storage, PDF extraction, TOTP, and Groq integration.
- `requests`: Manual REST Client request examples.
- `docker-compose.yml`: Production-like API + web container setup.

## Installation

### Prerequisites

- Node.js + pnpm
- .NET SDK 10
- PostgreSQL
- Docker + Docker Compose (optional, for containerized run)

### Getting Started

1. Clone the repository:

```bash
git clone <your-repo-url>
cd studyhub
```

2. Install JavaScript dependencies:

```bash
pnpm install
```

3. Restore .NET dependencies:

```bash
dotnet restore apps/Studyhub.slnx
```

4. Create your environment file for Docker Compose:

```bash
cp .env.example .env
```

5. Fill required values in `.env` and/or configure equivalent local ASP.NET settings with user secrets or environment variables.

## Usage

### Run locally

1. Start the API:

```bash
dotnet run --project apps/api/Api.csproj
```

The development API listens on:

```text
http://localhost:5046
https://localhost:5000
```

2. Start the Angular SSR frontend:

```bash
API_PROXY_TARGET=http://localhost:5046 pnpm exec nx serve web
```

3. Open the frontend:

```text
http://localhost:4200
```

The web app calls same-origin `/api/*` routes, which are proxied by the Angular SSR server to `API_PROXY_TARGET`.

### Run with Docker Compose

```bash
docker compose up
```

Default ports and services:

- Web: `http://localhost:4000` by default, controlled by `WEB_PUBLIC_PORT`
- API: internal Docker network service at `http://api:8080`, proxied by the web container

> The root `docker-compose.yml` expects published images from `ZOT_URL` and loads configuration from `.env`.

## Environment Variables

Environment variables are loaded from `.env` for Docker Compose. For local API development, use equivalent ASP.NET configuration keys through user secrets, shell environment variables, or local settings.

Based on `.env.example`:

```env
ZOT_URL=registry.example.com
WEB_BIND_ADDRESS=127.0.0.1
WEB_PUBLIC_PORT=4000
TRUST_PROXY=loopback,linklocal,uniquelocal
FORWARDED_HEADERS_KNOWN_NETWORKS=172.16.0.0/12
FORWARDED_HEADERS_KNOWN_PROXIES=

POSTGRES_HOST=postgres.example.com
POSTGRES_PORT=5432
POSTGRES_DB=studyhub
POSTGRES_USER=studyhub
POSTGRES_PASSWORD=change-me

JWT_SECRET=replace-with-a-long-random-secret
JWT_ISSUER=StudyHub
JWT_AUDIENCE=StudyHub
JWT_ACCESS_TOKEN_LIFETIME_MINUTES=15
JWT_REFRESH_TOKEN_LIFETIME_DAYS=90

CLOUDFLARE_API=https://<account-id>.r2.cloudflarestorage.com
CLOUDFLARE_ACCESS_KEY_ID=change-me
CLOUDFLARE_SECRET_ACCESS_KEY=change-me
CLOUDFLARE_BUCKET_NAME=studyhub
CLOUDFLARE_PUBLIC_BASE_URL=https://files.example.com

EMAIL_FROM=no-reply@example.com
EMAIL_SERVER=smtp.example.com
EMAIL_USERNAME=change-me
EMAIL_PASSWORD=change-me
EMAIL_DISPLAY_NAME=StudyHub
EMAIL_PORT=587
EMAIL_USE_SSL=true

GROQ_API_KEY=change-me
GROQ_BASE_URL=https://api.groq.com/openai/v1
GROQ_MODEL=llama-3.3-70b-versatile
GROQ_TIMEOUT_SECONDS=30
GROQ_MAX_INPUT_CHARACTERS=12000

TOTP_ISSUER=StudyHub
TOTP_SETUP_LIFETIME_MINUTES=10
TOTP_LOGIN_CHALLENGE_LIFETIME_MINUTES=5
TOTP_MAX_LOGIN_ATTEMPTS=5
TOTP_SECRET_ENCRYPTION_KEY=
```

These values configure PostgreSQL, JWT cookie authentication, Cloudflare R2 PDF storage, SMTP email, Groq/OpenAI-compatible AI metadata suggestions, TOTP two-factor authentication, forwarded headers, and Docker deployment ports.

## Contributing

Contributions are welcome. Open an issue or submit a pull request with a clear description of your changes.

Useful validation commands:

```bash
pnpm exec nx lint web
pnpm exec nx build web
dotnet build apps/Studyhub.slnx
```

## License

MIT
