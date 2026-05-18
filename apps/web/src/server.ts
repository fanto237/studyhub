import {
  AngularNodeAppEngine,
  createNodeRequestHandler,
  isMainModule,
  writeResponseToNodeResponse,
} from '@angular/ssr/node';
import express from 'express';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const serverDistFolder = dirname(fileURLToPath(import.meta.url));
const browserDistFolder = resolve(serverDistFolder, '../browser');

const app = express();
const angularApp = new AngularNodeAppEngine();

/**
 * Example Express Rest API endpoints can be defined here.
 * Uncomment and define endpoints as necessary.
 *
 * Example:
 * ```ts
 * app.get('/api/**', (req, res) => {
 *   // Handle API request
 * });
 * ```
 */

// backend api proxy request
const hopByHopHeaders = new Set([
  'connection',
  'content-length',
  'host',
  'keep-alive',
  'proxy-authenticate',
  'proxy-authorization',
  'te',
  'trailer',
  'transfer-encoding',
  'upgrade',
]);
const apiProxyTarget = createApiProxyTarget();

function createApiProxyTarget(): URL {
  const configuredTarget =
    process.env['API_PROXY_TARGET']?.trim() || 'http://localhost:5046';
  const normalizedTarget = configuredTarget.endsWith('/')
    ? configuredTarget
    : `${configuredTarget}/`;

  try {
    return new URL(normalizedTarget);
  } catch {
    throw new Error(`Invalid API_PROXY_TARGET: ${configuredTarget}`);
  }
}

function createProxyUrl(originalUrl: string): URL {
  const relativeUrl = originalUrl.startsWith('/')
    ? originalUrl.slice(1)
    : originalUrl;
  return new URL(relativeUrl, apiProxyTarget);
}

type HeadersWithSetCookie = Headers & {
  getSetCookie?: () => string[];
};

function getSetCookieHeaders(headers: Headers): string[] {
  const getSetCookie = (headers as HeadersWithSetCookie).getSetCookie;

  if (typeof getSetCookie === 'function') {
    return getSetCookie.call(headers);
  }

  const setCookie = headers.get('set-cookie');
  return setCookie ? [setCookie] : [];
}

function buildProxyHeaders(req: express.Request): Headers {
  const headers = new Headers();

  for (const [name, value] of Object.entries(req.headers)) {
    if (!value || hopByHopHeaders.has(name.toLowerCase())) {
      continue;
    }

    if (Array.isArray(value)) {
      for (const item of value) {
        headers.append(name, item);
      }
      continue;
    }

    headers.set(name, value);
  }

  const forwardedFor = req.headers['x-forwarded-for'];
  const forwardedForValue = Array.isArray(forwardedFor)
    ? [...forwardedFor, req.ip].join(', ')
    : forwardedFor
      ? `${forwardedFor}, ${req.ip}`
      : req.ip;

  if (forwardedForValue) {
    headers.set('x-forwarded-for', forwardedForValue);
  }

  headers.set('x-forwarded-proto', req.protocol);

  const host = req.get('host');
  if (host) {
    headers.set('x-forwarded-host', host);
  }

  return headers;
}

function buildProxyBody(req: express.Request): Buffer | undefined {
  if (req.method === 'GET' || req.method === 'HEAD') {
    return undefined;
  }

  return Buffer.isBuffer(req.body) && req.body.length > 0
    ? req.body
    : undefined;
}

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

/**
 * Proxy API requests to the configured backend server.
 */
app.use(
  '/api',
  express.raw({ type: () => true, limit: '15mb' }),
  async (req, res, next) => {
    let targetUrl: URL | undefined;

    try {
      targetUrl = createProxyUrl(req.originalUrl);
      console.info(
        `[api proxy] ${req.method} ${req.originalUrl} -> ${targetUrl.href}`,
      );

      const response = await fetch(targetUrl, {
        method: req.method,
        headers: buildProxyHeaders(req),
        body: buildProxyBody(req) as BodyInit | undefined,
        redirect: 'manual',
      });

      res.status(response.status);

      response.headers.forEach((value, name) => {
        const normalizedName = name.toLowerCase();

        if (
          hopByHopHeaders.has(normalizedName) ||
          normalizedName === 'set-cookie'
        ) {
          return;
        }

        res.setHeader(name, value);
      });

      const setCookieHeaders = getSetCookieHeaders(response.headers);
      if (setCookieHeaders.length > 0) {
        res.setHeader('set-cookie', setCookieHeaders);
      }

      const responseBody = Buffer.from(await response.arrayBuffer());
      if (responseBody.length === 0) {
        res.end();
        return;
      }

      res.send(responseBody);
    } catch (error) {
      const message = getErrorMessage(error);
      console.error(
        `[api proxy] Failed to proxy ${req.method} ${req.originalUrl} to ${targetUrl?.href ?? apiProxyTarget.href}: ${message}`,
        error,
      );

      if (res.headersSent) {
        next(error);
        return;
      }

      res.status(502).json({
        status: 'error',
        message:
          'StudyHub API is not reachable. Make sure the API server is running and API_PROXY_TARGET is correct.',
        data: {
          target: apiProxyTarget.origin,
          detail: message,
        },
      });
    }
  },
);

/**
 * Serve static files from /browser
 */
app.use(
  express.static(browserDistFolder, {
    maxAge: '1y',
    index: false,
    redirect: false,
  }),
);

/**
 * Handle all other requests by rendering the Angular application.
 */
app.use('/**', (req, res, next) => {
  angularApp
    .handle(req)
    .then((response) =>
      response ? writeResponseToNodeResponse(response, res) : next(),
    )
    .catch(next);
});

/**
 * Start the server if this module is the main entry point, or it is ran via PM2.
 * The server listens on the port defined by the `PORT` environment variable, or defaults to 4000.
 */
if (isMainModule(import.meta.url) || process.env['pm_id']) {
  const port = process.env['PORT'] || 4000;
  app.listen(port, () => {
    console.log(`Node Express server listening on http://localhost:${port}`);
  });
}

/**
 * Request handler used by the Angular CLI (for dev-server and during build) or Firebase Cloud Functions.
 */
export const reqHandler = createNodeRequestHandler(app);
