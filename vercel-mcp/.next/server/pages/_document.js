'use strict';
(() => {
  var e = {};
  (e.id = 660),
    (e.ids = [660]),
    (e.modules = {
      7645: (e, r, s) => {
        s.r(r), s.d(r, { default: () => x });
        var t = s(997),
          i = s(6859),
          n = s.n(i);
        class a extends n() {
          render() {
            return (0, t.jsxs)(i.Html, {
              lang: 'en',
              children: [
                (0, t.jsxs)(i.Head, {
                  children: [
                    t.jsx('meta', { charSet: 'utf-8' }),
                    t.jsx('link', { rel: 'icon', href: '/favicon.ico' }),
                  ],
                }),
                (0, t.jsxs)('body', { children: [t.jsx(i.Main, {}), t.jsx(i.NextScript, {})] }),
              ],
            });
          }
        }
        let x = a;
      },
      2785: (e) => {
        e.exports = require('next/dist/compiled/next-server/pages.runtime.prod.js');
      },
      6689: (e) => {
        e.exports = require('react');
      },
      997: (e) => {
        e.exports = require('react/jsx-runtime');
      },
      5315: (e) => {
        e.exports = require('path');
      },
    });
  var r = require('../webpack-runtime.js');
  r.C(e);
  var s = (e) => r((r.s = e)),
    t = r.X(0, [859], () => s(7645));
  module.exports = t;
})();
