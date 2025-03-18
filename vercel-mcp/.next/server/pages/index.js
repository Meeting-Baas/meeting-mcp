(() => {
  var e = {};
  (e.id = 405),
    (e.ids = [405, 888, 660]),
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
      5810: (e, t, r) => {
        'use strict';
        r.r(t),
          r.d(t, {
            config: () => f,
            default: () => x,
            getServerSideProps: () => h,
            getStaticPaths: () => g,
            getStaticProps: () => S,
            reportWebVitals: () => v,
            routeModule: () => y,
            unstable_getServerProps: () => _,
            unstable_getServerSideProps: () => A,
            unstable_getStaticParams: () => b,
            unstable_getStaticPaths: () => m,
            unstable_getStaticProps: () => j,
          });
        var i = {};
        r.r(i), r.d(i, { default: () => p, getStaticProps: () => P });
        var n = r(7093),
          s = r(5244),
          a = r(1323),
          l = r(7645),
          c = r(6814),
          u = r(997),
          d = r(968),
          o = r.n(d);
        async function P() {
          return { props: {} };
        }
        let p = () =>
            (0, u.jsxs)('div', {
              style: { padding: '2rem', textAlign: 'center' },
              children: [
                u.jsx(o(), { children: u.jsx('title', { children: 'Meeting BaaS MCP Server' }) }),
                u.jsx('h1', { children: 'Meeting BaaS MCP Server' }),
                u.jsx('p', { children: 'Redirecting to MCP Server...' }),
                u.jsx('p', {
                  children: u.jsx('a', {
                    href: '/api/server',
                    style: { color: '#0070f3', textDecoration: 'underline' },
                    children: 'Click here if you are not redirected automatically',
                  }),
                }),
              ],
            }),
          x = (0, a.l)(i, 'default'),
          S = (0, a.l)(i, 'getStaticProps'),
          g = (0, a.l)(i, 'getStaticPaths'),
          h = (0, a.l)(i, 'getServerSideProps'),
          f = (0, a.l)(i, 'config'),
          v = (0, a.l)(i, 'reportWebVitals'),
          j = (0, a.l)(i, 'unstable_getStaticProps'),
          m = (0, a.l)(i, 'unstable_getStaticPaths'),
          b = (0, a.l)(i, 'unstable_getStaticParams'),
          _ = (0, a.l)(i, 'unstable_getServerProps'),
          A = (0, a.l)(i, 'unstable_getServerSideProps'),
          y = new n.PagesRouteModule({
            definition: {
              kind: s.x.PAGES,
              page: '/index',
              pathname: '/',
              bundlePath: '',
              filename: '',
            },
            components: { App: c.default, Document: l.default },
            userland: i,
          });
      },
      6814: (e, t, r) => {
        'use strict';
        r.r(t), r.d(t, { default: () => a });
        var i = r(997),
          n = r(968),
          s = r.n(n);
        r(6764);
        let a = function ({ Component: e, pageProps: t }) {
          return (0, i.jsxs)(i.Fragment, {
            children: [
              (0, i.jsxs)(s(), {
                children: [
                  i.jsx('meta', {
                    name: 'viewport',
                    content: 'width=device-width, initial-scale=1.0',
                  }),
                  i.jsx('title', { children: 'Meeting BaaS MCP Server' }),
                ],
              }),
              i.jsx(e, { ...t }),
            ],
          });
        };
      },
      7645: (e, t, r) => {
        'use strict';
        r.r(t), r.d(t, { default: () => l });
        var i = r(997),
          n = r(6859),
          s = r.n(n);
        class a extends s() {
          render() {
            return (0, i.jsxs)(n.Html, {
              lang: 'en',
              children: [
                (0, i.jsxs)(n.Head, {
                  children: [
                    i.jsx('meta', { charSet: 'utf-8' }),
                    i.jsx('link', { rel: 'icon', href: '/favicon.ico' }),
                  ],
                }),
                (0, i.jsxs)('body', { children: [i.jsx(n.Main, {}), i.jsx(n.NextScript, {})] }),
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
    i = t.X(0, [859], () => r(5810));
  module.exports = i;
})();
