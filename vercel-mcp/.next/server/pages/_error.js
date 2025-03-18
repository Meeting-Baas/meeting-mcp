(() => {
  var e = {};
  (e.id = 820),
    (e.ids = [820, 888, 660]),
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
      6968: (e, t, r) => {
        'use strict';
        r.r(t),
          r.d(t, {
            config: () => f,
            default: () => u,
            getServerSideProps: () => p,
            getStaticPaths: () => c,
            getStaticProps: () => d,
            reportWebVitals: () => h,
            routeModule: () => P,
            unstable_getServerProps: () => y,
            unstable_getServerSideProps: () => b,
            unstable_getStaticParams: () => x,
            unstable_getStaticPaths: () => m,
            unstable_getStaticProps: () => g,
          });
        var n = r(7093),
          i = r(5244),
          o = r(1323),
          s = r(7645),
          a = r(6814),
          l = r(6971);
        let u = (0, o.l)(l, 'default'),
          d = (0, o.l)(l, 'getStaticProps'),
          c = (0, o.l)(l, 'getStaticPaths'),
          p = (0, o.l)(l, 'getServerSideProps'),
          f = (0, o.l)(l, 'config'),
          h = (0, o.l)(l, 'reportWebVitals'),
          g = (0, o.l)(l, 'unstable_getStaticProps'),
          m = (0, o.l)(l, 'unstable_getStaticPaths'),
          x = (0, o.l)(l, 'unstable_getStaticParams'),
          y = (0, o.l)(l, 'unstable_getServerProps'),
          b = (0, o.l)(l, 'unstable_getServerSideProps'),
          P = new n.PagesRouteModule({
            definition: {
              kind: i.x.PAGES,
              page: '/_error',
              pathname: '/_error',
              bundlePath: '',
              filename: '',
            },
            components: { App: a.default, Document: s.default },
            userland: l,
          });
      },
      6971: (e, t, r) => {
        'use strict';
        Object.defineProperty(t, '__esModule', { value: !0 }),
          Object.defineProperty(t, 'default', {
            enumerable: !0,
            get: function () {
              return d;
            },
          });
        let n = r(167),
          i = r(997),
          o = n._(r(6689)),
          s = n._(r(7828)),
          a = {
            400: 'Bad Request',
            404: 'This page could not be found',
            405: 'Method Not Allowed',
            500: 'Internal Server Error',
          };
        function l(e) {
          let { res: t, err: r } = e;
          return { statusCode: t && t.statusCode ? t.statusCode : r ? r.statusCode : 404 };
        }
        let u = {
          error: {
            fontFamily:
              'system-ui,"Segoe UI",Roboto,Helvetica,Arial,sans-serif,"Apple Color Emoji","Segoe UI Emoji"',
            height: '100vh',
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
          },
          desc: { lineHeight: '48px' },
          h1: {
            display: 'inline-block',
            margin: '0 20px 0 0',
            paddingRight: 23,
            fontSize: 24,
            fontWeight: 500,
            verticalAlign: 'top',
          },
          h2: { fontSize: 14, fontWeight: 400, lineHeight: '28px' },
          wrap: { display: 'inline-block' },
        };
        class d extends o.default.Component {
          render() {
            let { statusCode: e, withDarkMode: t = !0 } = this.props,
              r = this.props.title || a[e] || 'An unexpected error has occurred';
            return (0, i.jsxs)('div', {
              style: u.error,
              children: [
                (0, i.jsx)(s.default, {
                  children: (0, i.jsx)('title', {
                    children: e
                      ? e + ': ' + r
                      : 'Application error: a client-side exception has occurred',
                  }),
                }),
                (0, i.jsxs)('div', {
                  style: u.desc,
                  children: [
                    (0, i.jsx)('style', {
                      dangerouslySetInnerHTML: {
                        __html:
                          'body{color:#000;background:#fff;margin:0}.next-error-h1{border-right:1px solid rgba(0,0,0,.3)}' +
                          (t
                            ? '@media (prefers-color-scheme:dark){body{color:#fff;background:#000}.next-error-h1{border-right:1px solid rgba(255,255,255,.3)}}'
                            : ''),
                      },
                    }),
                    e
                      ? (0, i.jsx)('h1', { className: 'next-error-h1', style: u.h1, children: e })
                      : null,
                    (0, i.jsx)('div', {
                      style: u.wrap,
                      children: (0, i.jsxs)('h2', {
                        style: u.h2,
                        children: [
                          this.props.title || e
                            ? r
                            : (0, i.jsx)(i.Fragment, {
                                children:
                                  'Application error: a client-side exception has occurred (see the browser console for more information)',
                              }),
                          '.',
                        ],
                      }),
                    }),
                  ],
                }),
              ],
            });
          }
        }
        (d.displayName = 'ErrorPage'),
          (d.getInitialProps = l),
          (d.origGetInitialProps = l),
          ('function' == typeof t.default ||
            ('object' == typeof t.default && null !== t.default)) &&
            void 0 === t.default.__esModule &&
            (Object.defineProperty(t.default, '__esModule', { value: !0 }),
            Object.assign(t.default, t),
            (e.exports = t.default));
      },
      5495: (e, t) => {
        'use strict';
        function r(e) {
          let { ampFirst: t = !1, hybrid: r = !1, hasQuery: n = !1 } = void 0 === e ? {} : e;
          return t || (r && n);
        }
        Object.defineProperty(t, '__esModule', { value: !0 }),
          Object.defineProperty(t, 'isInAmpMode', {
            enumerable: !0,
            get: function () {
              return r;
            },
          });
      },
      7828: (e, t, r) => {
        'use strict';
        Object.defineProperty(t, '__esModule', { value: !0 }),
          (function (e, t) {
            for (var r in t) Object.defineProperty(e, r, { enumerable: !0, get: t[r] });
          })(t, {
            default: function () {
              return g;
            },
            defaultHead: function () {
              return c;
            },
          });
        let n = r(167),
          i = r(8760),
          o = r(997),
          s = i._(r(6689)),
          a = n._(r(7215)),
          l = r(8039),
          u = r(1988),
          d = r(5495);
        function c(e) {
          void 0 === e && (e = !1);
          let t = [(0, o.jsx)('meta', { charSet: 'utf-8' })];
          return (
            e || t.push((0, o.jsx)('meta', { name: 'viewport', content: 'width=device-width' })), t
          );
        }
        function p(e, t) {
          return 'string' == typeof t || 'number' == typeof t
            ? e
            : t.type === s.default.Fragment
              ? e.concat(
                  s.default.Children.toArray(t.props.children).reduce(
                    (e, t) => ('string' == typeof t || 'number' == typeof t ? e : e.concat(t)),
                    [],
                  ),
                )
              : e.concat(t);
        }
        r(1997);
        let f = ['name', 'httpEquiv', 'charSet', 'itemProp'];
        function h(e, t) {
          let { inAmpMode: r } = t;
          return e
            .reduce(p, [])
            .reverse()
            .concat(c(r).reverse())
            .filter(
              (function () {
                let e = new Set(),
                  t = new Set(),
                  r = new Set(),
                  n = {};
                return (i) => {
                  let o = !0,
                    s = !1;
                  if (i.key && 'number' != typeof i.key && i.key.indexOf('$') > 0) {
                    s = !0;
                    let t = i.key.slice(i.key.indexOf('$') + 1);
                    e.has(t) ? (o = !1) : e.add(t);
                  }
                  switch (i.type) {
                    case 'title':
                    case 'base':
                      t.has(i.type) ? (o = !1) : t.add(i.type);
                      break;
                    case 'meta':
                      for (let e = 0, t = f.length; e < t; e++) {
                        let t = f[e];
                        if (i.props.hasOwnProperty(t)) {
                          if ('charSet' === t) r.has(t) ? (o = !1) : r.add(t);
                          else {
                            let e = i.props[t],
                              r = n[t] || new Set();
                            ('name' !== t || !s) && r.has(e) ? (o = !1) : (r.add(e), (n[t] = r));
                          }
                        }
                      }
                  }
                  return o;
                };
              })(),
            )
            .reverse()
            .map((e, t) => {
              let n = e.key || t;
              if (
                !r &&
                'link' === e.type &&
                e.props.href &&
                ['https://fonts.googleapis.com/css', 'https://use.typekit.net/'].some((t) =>
                  e.props.href.startsWith(t),
                )
              ) {
                let t = { ...(e.props || {}) };
                return (
                  (t['data-href'] = t.href),
                  (t.href = void 0),
                  (t['data-optimized-fonts'] = !0),
                  s.default.cloneElement(e, t)
                );
              }
              return s.default.cloneElement(e, { key: n });
            });
        }
        let g = function (e) {
          let { children: t } = e,
            r = (0, s.useContext)(l.AmpStateContext),
            n = (0, s.useContext)(u.HeadManagerContext);
          return (0, o.jsx)(a.default, {
            reduceComponentsToState: h,
            headManager: n,
            inAmpMode: (0, d.isInAmpMode)(r),
            children: t,
          });
        };
        ('function' == typeof t.default || ('object' == typeof t.default && null !== t.default)) &&
          void 0 === t.default.__esModule &&
          (Object.defineProperty(t.default, '__esModule', { value: !0 }),
          Object.assign(t.default, t),
          (e.exports = t.default));
      },
      7215: (e, t, r) => {
        'use strict';
        Object.defineProperty(t, '__esModule', { value: !0 }),
          Object.defineProperty(t, 'default', {
            enumerable: !0,
            get: function () {
              return s;
            },
          });
        let n = r(6689),
          i = () => {},
          o = () => {};
        function s(e) {
          var t;
          let { headManager: r, reduceComponentsToState: s } = e;
          function a() {
            if (r && r.mountedInstances) {
              let t = n.Children.toArray(Array.from(r.mountedInstances).filter(Boolean));
              r.updateHead(s(t, e));
            }
          }
          return (
            null == r || null == (t = r.mountedInstances) || t.add(e.children),
            a(),
            i(() => {
              var t;
              return (
                null == r || null == (t = r.mountedInstances) || t.add(e.children),
                () => {
                  var t;
                  null == r || null == (t = r.mountedInstances) || t.delete(e.children);
                }
              );
            }),
            i(
              () => (
                r && (r._pendingUpdate = a),
                () => {
                  r && (r._pendingUpdate = a);
                }
              ),
            ),
            o(
              () => (
                r && r._pendingUpdate && (r._pendingUpdate(), (r._pendingUpdate = null)),
                () => {
                  r && r._pendingUpdate && (r._pendingUpdate(), (r._pendingUpdate = null));
                }
              ),
            ),
            null
          );
        }
      },
      1997: (e, t) => {
        'use strict';
        Object.defineProperty(t, '__esModule', { value: !0 }),
          Object.defineProperty(t, 'warnOnce', {
            enumerable: !0,
            get: function () {
              return r;
            },
          });
        let r = (e) => {};
      },
      6814: (e, t, r) => {
        'use strict';
        r.r(t), r.d(t, { default: () => s });
        var n = r(997),
          i = r(968),
          o = r.n(i);
        r(6764);
        let s = function ({ Component: e, pageProps: t }) {
          return (0, n.jsxs)(n.Fragment, {
            children: [
              (0, n.jsxs)(o(), {
                children: [
                  n.jsx('meta', {
                    name: 'viewport',
                    content: 'width=device-width, initial-scale=1.0',
                  }),
                  n.jsx('title', { children: 'Meeting BaaS MCP Server' }),
                ],
              }),
              n.jsx(e, { ...t }),
            ],
          });
        };
      },
      7645: (e, t, r) => {
        'use strict';
        r.r(t), r.d(t, { default: () => a });
        var n = r(997),
          i = r(6859),
          o = r.n(i);
        class s extends o() {
          render() {
            return (0, n.jsxs)(i.Html, {
              lang: 'en',
              children: [
                (0, n.jsxs)(i.Head, {
                  children: [
                    n.jsx('meta', { charSet: 'utf-8' }),
                    n.jsx('link', { rel: 'icon', href: '/favicon.ico' }),
                  ],
                }),
                (0, n.jsxs)('body', { children: [n.jsx(i.Main, {}), n.jsx(i.NextScript, {})] }),
              ],
            });
          }
        }
        let a = s;
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
      8039: (e, t, r) => {
        'use strict';
        e.exports = r(7093).vendored.contexts.AmpContext;
      },
      1988: (e, t, r) => {
        'use strict';
        e.exports = r(7093).vendored.contexts.HeadManagerContext;
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
      8760: (e, t) => {
        'use strict';
        function r(e) {
          if ('function' != typeof WeakMap) return null;
          var t = new WeakMap(),
            n = new WeakMap();
          return (r = function (e) {
            return e ? n : t;
          })(e);
        }
        t._ = t._interop_require_wildcard = function (e, t) {
          if (!t && e && e.__esModule) return e;
          if (null === e || ('object' != typeof e && 'function' != typeof e)) return { default: e };
          var n = r(t);
          if (n && n.has(e)) return n.get(e);
          var i = { __proto__: null },
            o = Object.defineProperty && Object.getOwnPropertyDescriptor;
          for (var s in e)
            if ('default' !== s && Object.prototype.hasOwnProperty.call(e, s)) {
              var a = o ? Object.getOwnPropertyDescriptor(e, s) : null;
              a && (a.get || a.set) ? Object.defineProperty(i, s, a) : (i[s] = e[s]);
            }
          return (i.default = e), n && n.set(e, i), i;
        };
      },
    });
  var t = require('../webpack-runtime.js');
  t.C(e);
  var r = (e) => t((t.s = e)),
    n = t.X(0, [859], () => r(6968));
  module.exports = n;
})();
