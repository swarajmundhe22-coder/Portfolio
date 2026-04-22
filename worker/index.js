const JSON_HEADERS = {
  'content-type': 'application/json; charset=utf-8',
};

function isHtmlNavigation(request, pathname) {
  const acceptsHtml = request.headers.get('accept')?.includes('text/html');
  const isGet = request.method === 'GET';
  const hasFileExtension = /\.[a-zA-Z0-9]+$/.test(pathname);
  return Boolean(acceptsHtml && isGet && !hasFileExtension);
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname.startsWith('/api/')) {
      if (typeof env.API_ORIGIN !== 'string' || env.API_ORIGIN.length === 0) {
        return new Response(
          JSON.stringify({
            error: {
              code: 'API_ORIGIN_NOT_CONFIGURED',
              message: 'Set Worker variable API_ORIGIN to route /api requests.',
            },
          }),
          { status: 501, headers: JSON_HEADERS },
        );
      }

      const upstreamBase = new URL(env.API_ORIGIN);
      const upstreamUrl = new URL(url.pathname + url.search, upstreamBase);
      return fetch(new Request(upstreamUrl.toString(), request));
    }

    const assetResponse = await env.ASSETS.fetch(request);
    if (assetResponse.status !== 404) {
      return assetResponse;
    }

    if (isHtmlNavigation(request, url.pathname)) {
      const indexRequest = new Request(new URL('/index.html', request.url).toString(), request);
      return env.ASSETS.fetch(indexRequest);
    }

    return assetResponse;
  },
};