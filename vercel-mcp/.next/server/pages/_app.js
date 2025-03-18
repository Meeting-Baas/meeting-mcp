(() => {
  var e = {};
  (e.id = 888),
    (e.ids = [888]),
    (e.modules = {
      6814: (e, r, t) => {
        'use strict';
        t.r(r), t.d(r, { default: () => a });
        var i = t(997),
          s = t(968),
          n = t.n(s);
        t(6764);
        let a = function ({ Component: e, pageProps: r }) {
          return (0, i.jsxs)(i.Fragment, {
            children: [
              (0, i.jsxs)(n(), {
                children: [
                  i.jsx('meta', {
                    name: 'viewport',
                    content: 'width=device-width, initial-scale=1.0',
                  }),
                  i.jsx('title', { children: 'Meeting BaaS MCP Server' }),
                ],
              }),
              i.jsx(e, { ...r }),
            ],
          });
        };
      },
      6764: () => {},
      968: (e) => {
        'use strict';
        e.exports = require('next/head');
      },
      997: (e) => {
        'use strict';
        e.exports = require('react/jsx-runtime');
      },
    });
  var r = require('../webpack-runtime.js');
  r.C(e);
  var t = r((r.s = 6814));
  module.exports = t;
})();
