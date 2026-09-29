/**
 * Cloudflare Worker for AMZ Tools Frontend (SPA)
 * Serves static assets (HTML, CSS, JS, modules) using Cloudflare Workers Static Assets
 */

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // If Cloudflare Workers Static Assets binding is available
    if (env && env.ASSETS) {
      let response = await env.ASSETS.fetch(request);

      // SPA fallback: return index.html for navigation routes
      if (response.status === 404 && !url.pathname.split('/').pop().includes('.')) {
        return env.ASSETS.fetch(new Request(new URL('/index.html', request.url), request));
      }

      return response;
    }

    return new Response(
      'Worker assets binding missing. Please ensure [assets] directory = "." is configured in wrangler.toml.',
      { status: 500, headers: { 'Content-Type': 'text/plain' } }
    );
  }
};
