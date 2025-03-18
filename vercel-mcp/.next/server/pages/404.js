(() => {
  var e = {};
  (e.id = 197),
    (e.ids = [197, 888, 660]),
    (e.modules = {
      1323: (e, t) => {
        'use strict';
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
      4800: (e, t, r) => {
        'use strict';
        r.r(t),
          r.d(t, {
            config: () => f,
            default: () => x,
            getServerSideProps: () => S,
            getStaticPaths: () => h,
            getStaticProps: () => g,
            reportWebVitals: () => j,
            routeModule: () => y,
            unstable_getServerProps: () => _,
            unstable_getServerSideProps: () => A,
            unstable_getStaticParams: () => b,
            unstable_getStaticPaths: () => m,
            unstable_getStaticProps: () => v,
          });
        var s = {};
        r.r(s), r.d(s, { default: () => P, getStaticProps: () => p });
        var n = r(7093),
          i = r(5244),
          a = r(1323),
          l = r(7645),
          o = r(6814),
          u = r(997),
          c = r(968),
          d = r.n(c);
        async function p() {
          return { props: {} };
        }
        let P = () =>
            (0, u.jsxs)('div', {
              style: { padding: '2rem', textAlign: 'center' },
              children: [
                u.jsx(d(), { children: u.jsx('title', { children: '404 - Page Not Found' }) }),
                u.jsx('h1', { children: '404 - Page Not Found' }),
                u.jsx('p', { children: 'The page you are looking for does not exist.' }),
                u.jsx('p', {
                  children: u.jsx('a', {
                    href: '/api/server',
                    style: { color: '#0070f3', textDecoration: 'underline' },
                    children: 'Go to MCP Server',
                  }),
                }),
              ],
            }),
          x = (0, a.l)(s, 'default'),
          g = (0, a.l)(s, 'getStaticProps'),
          h = (0, a.l)(s, 'getStaticPaths'),
          S = (0, a.l)(s, 'getServerSideProps'),
          f = (0, a.l)(s, 'config'),
          j = (0, a.l)(s, 'reportWebVitals'),
          v = (0, a.l)(s, 'unstable_getStaticProps'),
          m = (0, a.l)(s, 'unstable_getStaticPaths'),
          b = (0, a.l)(s, 'unstable_getStaticParams'),
          _ = (0, a.l)(s, 'unstable_getServerProps'),
          A = (0, a.l)(s, 'unstable_getServerSideProps'),
          y = new n.PagesRouteModule({
            definition: {
              kind: i.x.PAGES,
              page: '/404',
              pathname: '/404',
              bundlePath: '',
              filename: '',
            },
            components: { App: o.default, Document: l.default },
            userland: s,
          });
      },
      6814: (e, t, r) => {
        'use strict';
        r.r(t), r.d(t, { default: () => a });
        var s = r(997),
          n = r(968),
          i = r.n(n);
        r(6764);
        let a = function ({ Component: e, pageProps: t }) {
          return (0, s.jsxs)(s.Fragment, {
            children: [
              (0, s.jsxs)(i(), {
                children: [
                  s.jsx('meta', {
                    name: 'viewport',
                    content: 'width=device-width, initial-scale=1.0',
                  }),
                  s.jsx('title', { children: 'Meeting BaaS MCP Server' }),
                ],
              }),
              s.jsx(e, { ...t }),
            ],
          });
        };
      },
      7645: (e, t, r) => {
        'use strict';
        r.r(t), r.d(t, { default: () => l });
        var s = r(997),
          n = r(6859),
          i = r.n(n);
        class a extends i() {
          render() {
            return (0, s.jsxs)(n.Html, {
              lang: 'en',
              children: [
                (0, s.jsxs)(n.Head, {
                  children: [
                    s.jsx('meta', { charSet: 'utf-8' }),
                    s.jsx('link', { rel: 'icon', href: '/favicon.ico' }),
                  ],
                }),
                (0, s.jsxs)('body', { children: [s.jsx(n.Main, {}), s.jsx(n.NextScript, {})] }),
              ],
            });
          }
        }
        let l = a;
      },
      6764: () => {},
      5244: (e, t) => {
        'use strict';
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
      2785: (e) => {
        'use strict';
        e.exports = require('next/dist/compiled/next-server/pages.runtime.prod.js');
      },
      968: (e) => {
        'use strict';
        e.exports = require('next/head');
      },
      6689: (e) => {
        'use strict';
        e.exports = require('react');
      },
      997: (e) => {
        'use strict';
        e.exports = require('react/jsx-runtime');
      },
      5315: (e) => {
        'use strict';
        e.exports = require('path');
      },
    });
  var t = require('../webpack-runtime.js');
  t.C(e);
  var r = (e) => t((t.s = e)),
    s = t.X(0, [859], () => r(4800));
  module.exports = s;
})();
