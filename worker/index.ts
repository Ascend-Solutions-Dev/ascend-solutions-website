/** Cloudflare Worker entry point for the vinext-starter template. */
import { handleImageOptimization, DEFAULT_DEVICE_SIZES, DEFAULT_IMAGE_SIZES } from "vinext/server/image-optimization";
import handler from "vinext/server/app-router-entry";

interface Env {
  ASSETS: Fetcher;
  DB: D1Database;
  ADMIN_SESSION_SECRET?: string;
  RESEND_API_KEY?: string;
  RESEND_FROM_EMAIL?: string;
  IMAGES: {
    input(stream: ReadableStream): {
      transform(options: Record<string, unknown>): {
        output(options: { format: string; quality: number }): Promise<{ response(): Response }>;
      };
    };
  };
}

interface ExecutionContext {
  waitUntil(promise: Promise<unknown>): void;
  passThroughOnException(): void;
}

// Image security config. SVG sources with .svg extension auto-skip the
// optimization endpoint on the client side (served directly, no proxy).
// To route SVGs through the optimizer (with security headers), set
// dangerouslyAllowSVG: true in next.config.js and uncomment below:
// const imageConfig: ImageConfig = { dangerouslyAllowSVG: true };

const worker = {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);

    const isRead = request.method === "GET" || request.method === "HEAD";
    const publicPages: Record<string, string> = { "/": "home", "/apps": "apps", "/legal": "legal", "/apps/": "apps", "/legal/": "legal" };
    const publicPage = Object.hasOwn(publicPages, url.pathname) ? publicPages[url.pathname] : undefined;
    if (isRead && publicPage) {
      const asset = await env.ASSETS.fetch(new Request(new URL(`/_public-pages/${publicPage}.content`, request.url)));
      if (asset.ok) {
        return new Response(request.method === "HEAD" ? null : asset.body, {
          headers: { "content-type": "text/html; charset=utf-8", "cache-control": "public, max-age=300, s-maxage=3600" },
        });
      }
      // Development/build rendering and older deployments remain functional.
    }

    const publicAssets: Record<string, string> = {
      "/public-assets/99e6fa992cb1/brand/ascend-long-light.png": "/brand/ascend-long-light.png",
      "/public-assets/0904a8d82e10/brand/ascend-long-dark.png": "/brand/ascend-long-dark.png",
      "/public-assets/887039d008b0/brand/ascend-icon.png": "/brand/ascend-icon.png"
};
    const publicAsset = Object.hasOwn(publicAssets, url.pathname) ? publicAssets[url.pathname] : undefined;
    if (isRead && publicAsset) {
      const asset = await env.ASSETS.fetch(new Request(new URL(publicAsset, request.url), { method: request.method }));
      if (!asset.ok) return asset;
      const headers = new Headers(asset.headers);
      headers.set("content-type", "image/png");
      headers.set("cache-control", "public, max-age=31536000, immutable");
      return new Response(request.method === "HEAD" ? null : asset.body, { status: asset.status, headers });
    }

    if (isRead && url.pathname === "/robots.txt") {
      return new Response(request.method === "HEAD" ? null : "User-agent: *\nAllow: /\nDisallow: /admin/\nDisallow: /api/\n", {
        headers: { "content-type": "text/plain; charset=utf-8", "cache-control": "public, max-age=86400" },
      });
    }
    // These are not Ascend routes. Avoid invoking the framework for scanners.
    if (/^\/(?:xmlrpc\.php|wp-login\.php|wp-admin(?:\/|$)|wp-includes(?:\/|$)|wp-content(?:\/|$))/.test(url.pathname)) {
      return new Response(request.method === "HEAD" ? null : "Not found", { status: 404, headers: { "content-type": "text/plain; charset=utf-8", "cache-control": "public, max-age=3600" } });
    }

    // Serve fingerprinted fonts through the Worker: Sites may override headers
    // on directly served static assets. Browsers can reuse these immutable URLs.
    const fontAssets: Record<string, string> = {
      "/font-assets/bree-serif-latin-v18-ca092b4130ee.woff2": "/fonts/bree-serif-latin-v18-ca092b4130ee.woff2",
      "/font-assets/plus-jakarta-sans-latin-variable-v12-153fc85b7029.woff2": "/fonts/plus-jakarta-sans-latin-variable-v12-153fc85b7029.woff2",
    };
    const fontAsset = Object.hasOwn(fontAssets, url.pathname) ? fontAssets[url.pathname] : undefined;
    if (fontAsset && (request.method === "GET" || request.method === "HEAD")) {
      const asset = await env.ASSETS.fetch(new Request(new URL(fontAsset, request.url), { method: request.method }));
      if (asset.ok) {
        const headers = new Headers(asset.headers);
        headers.set("content-type", "font/woff2");
        headers.set("cache-control", "public, max-age=31536000, immutable");
        return new Response(request.method === "HEAD" ? null : asset.body, { status: asset.status, headers });
      }
      return asset;
    }

    // Cache the versioned browser tab icon without static-asset revalidation.
    if (url.pathname === "/brand-assets/ascend-icon-background-0c83e0a36b7a.png" && (request.method === "GET" || request.method === "HEAD")) {
      const asset = await env.ASSETS.fetch(new Request(new URL("/brand/ascend-icon-background.png", request.url), { method: request.method }));
      if (!asset.ok) return asset;
      const headers = new Headers(asset.headers);
      headers.set("content-type", "image/png");
      headers.set("cache-control", "public, max-age=31536000, immutable");
      return new Response(request.method === "HEAD" ? null : asset.body, { status: asset.status, headers });
    }

    if (url.pathname === "/_vinext/image") {
      const allowedWidths = [...DEFAULT_DEVICE_SIZES, ...DEFAULT_IMAGE_SIZES];
      return handleImageOptimization(request, {
        fetchAsset: (path) => env.ASSETS.fetch(new Request(new URL(path, request.url))),
        transformImage: async (body, { width, format, quality }) => {
          const result = await env.IMAGES.input(body).transform(width > 0 ? { width } : {}).output({ format, quality });
          return result.response();
        },
      }, allowedWidths);
    }

    return handler.fetch(request, env, ctx);
  },
};

export default worker;
