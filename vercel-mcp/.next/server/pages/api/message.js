'use strict';
(() => {
  var e = {};
  (e.id = 439),
    (e.ids = [439]),
    (e.modules = {
      145: (e) => {
        e.exports = require('next/dist/compiled/next-server/pages-api.runtime.prod.js');
      },
      3665: (e) => {
        e.exports = require('raw-body');
      },
      7773: (e) => {
        e.exports = require('redis');
      },
      2615: (e) => {
        e.exports = require('http');
      },
      8216: (e) => {
        e.exports = require('net');
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
      2382: (e, r, t) => {
        t.a(e, async (e, s) => {
          try {
            t.r(r), t.d(r, { config: () => u, default: () => n, routeModule: () => l });
            var a = t(1802),
              o = t(7153),
              i = t(6249),
              p = t(3117),
              d = e([p]);
            p = (d.then ? (await d)() : d)[0];
            let n = (0, i.l)(p, 'default'),
              u = (0, i.l)(p, 'config'),
              l = new a.PagesAPIRouteModule({
                definition: {
                  kind: o.x.PAGES_API,
                  page: '/api/message',
                  pathname: '/api/message',
                  bundlePath: '',
                  filename: '',
                },
                userland: p,
              });
            s();
          } catch (e) {
            s(e);
          }
        });
      },
      3117: (e, r, t) => {
        t.a(e, async (e, s) => {
          try {
            t.r(r), t.d(r, { default: () => i });
            var a = t(4882),
              o = e([a]);
            async function i(e, r) {
              return e.url, (e.url = '/message'), (0, a.Z)(e, r);
            }
            (a = (o.then ? (await o)() : o)[0]), s();
          } catch (e) {
            s(e);
          }
        });
      },
    });
  var r = require('../../webpack-api-runtime.js');
  r.C(e);
  var t = (e) => r((r.s = e)),
    s = r.X(0, [844], () => t(2382));
  module.exports = s;
})();
