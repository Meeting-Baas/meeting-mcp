'use strict';
(() => {
  var e = {};
  (e.id = 355),
    (e.ids = [355]),
    (e.modules = {
      145: (e) => {
        e.exports = require('next/dist/compiled/next-server/pages-api.runtime.prod.js');
      },
      3665: (e) => {
        e.exports = require('raw-body');
      },
      7555: (e) => {
        e.exports = import('@modelcontextprotocol/sdk/server/mcp.js');
      },
      1767: (e) => {
        e.exports = import('@modelcontextprotocol/sdk/server/sse.js');
      },
      9926: (e) => {
        e.exports = import('zod');
      },
      6249: (e, t) => {
        Object.defineProperty(t, 'l', {
          enumerable: !0,
          get: function () {
            return function e(t, r) {
              return r in t
                ? t[r]
                : 'then' in t && 'function' == typeof t.then
                  ? t.then((t) => e(t, r))
                  : 'function' == typeof t && 'default' === r
                    ? t
                    : void 0;
            };
          },
        });
      },
      7849: (e, t, r) => {
        r.a(e, async (e, o) => {
          try {
            r.r(t), r.d(t, { config: () => l, default: () => d, routeModule: () => u });
            var s = r(1802),
              n = r(7153),
              a = r(6249),
              i = r(4795),
              c = e([i]);
            i = (c.then ? (await c)() : c)[0];
            let d = (0, a.l)(i, 'default'),
              l = (0, a.l)(i, 'config'),
              u = new s.PagesAPIRouteModule({
                definition: {
                  kind: n.x.PAGES_API,
                  page: '/api/server',
                  pathname: '/api/server',
                  bundlePath: '',
                  filename: '',
                },
                userland: i,
              });
            o();
          } catch (e) {
            o(e);
          }
        });
      },
      4795: (e, t, r) => {
        r.a(e, async (e, o) => {
          try {
            r.r(t), r.d(t, { default: () => l });
            var s = r(7555),
              n = r(1767),
              a = r(3665),
              i = r.n(a),
              c = r(9926),
              d = e([s, n, c]);
            async function l(e, t) {
              if (
                (t.setHeader('Access-Control-Allow-Origin', '*'),
                t.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS'),
                t.setHeader('Access-Control-Allow-Headers', 'Content-Type'),
                'OPTIONS' === e.method)
              ) {
                t.status(200).end();
                return;
              }
              if (!process.env.REDIS_URL)
                return t.status(500).json({ error: 'Redis URL not configured' });
              try {
                let r = new s.McpServer({
                  name: process.env.MCP_SERVER_NAME || 'Meeting BaaS MCP Server (Vercel)',
                  version: process.env.MCP_SERVER_VERSION || '1.0.0',
                });
                if (
                  (r.tool(
                    'echo',
                    'Echoes back the provided message',
                    { message: c.z.string().describe('The message to echo back') },
                    async ({ message: e }) => ({ content: [{ type: 'text', text: e }] }),
                  ),
                  'GET' === e.method)
                ) {
                  t.setHeader('Content-Type', 'text/event-stream'),
                    t.setHeader('Cache-Control', 'no-cache'),
                    t.setHeader('Connection', 'keep-alive');
                  let e = new n.SSEServerTransport('/api/server', t);
                  await r.connect(e);
                } else if ('POST' === e.method) {
                  let r = await i()(e);
                  JSON.parse(r.toString()).sessionId
                    ? t.status(200).json({ ok: !0 })
                    : t.status(200).json({ status: 'Message received' });
                } else t.status(405).json({ error: 'Method not allowed' });
              } catch (e) {
                console.error('Error handling request:', e),
                  t.status(500).json({ error: 'Internal server error' });
              }
            }
            ([s, n, c] = d.then ? (await d)() : d), o();
          } catch (e) {
            o(e);
          }
        });
      },
      7153: (e, t) => {
        var r;
        Object.defineProperty(t, 'x', {
          enumerable: !0,
          get: function () {
            return r;
          },
        }),
          (function (e) {
            (e.PAGES = 'PAGES'),
              (e.PAGES_API = 'PAGES_API'),
              (e.APP_PAGE = 'APP_PAGE'),
              (e.APP_ROUTE = 'APP_ROUTE');
          })(r || (r = {}));
      },
      1802: (e, t, r) => {
        e.exports = r(145);
      },
    });
  var t = require('../../webpack-api-runtime.js');
  t.C(e);
  var r = t((t.s = 7849));
  module.exports = r;
})();
