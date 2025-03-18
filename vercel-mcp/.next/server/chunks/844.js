(exports.id = 844),
  (exports.ids = [844]),
  (exports.modules = {
    6608: () => {
      throw Error(
        "Module parse failed: Unexpected token (6:7)\nYou may need an appropriate loader to handle this file type, currently no loaders are configured to process this file. See https://webpack.js.org/concepts#loaders\n| \n| // Environment configuration\n> export type Environment = 'gmeetbot' | 'preprod' | 'prod';\n| \n| // Current active environment (default to prod)",
      );
    },
    5979: () => {
      'use strict';
      !(function () {
        var e = Error("Cannot find module './transcript.js'");
        throw ((e.code = 'MODULE_NOT_FOUND'), e);
      })();
    },
    1777: () => {
      'use strict';
      (function () {
        var e = Error("Cannot find module './meeting.js'");
        throw ((e.code = 'MODULE_NOT_FOUND'), e);
      })(),
        (function () {
          var e = Error("Cannot find module './search.js'");
          throw ((e.code = 'MODULE_NOT_FOUND'), e);
        })(),
        (function () {
          var e = Error("Cannot find module './calendar.js'");
          throw ((e.code = 'MODULE_NOT_FOUND'), e);
        })(),
        (function () {
          var e = Error("Cannot find module './links.js'");
          throw ((e.code = 'MODULE_NOT_FOUND'), e);
        })(),
        (function () {
          var e = Error("Cannot find module './deleteData.js'");
          throw ((e.code = 'MODULE_NOT_FOUND'), e);
        })(),
        (function () {
          var e = Error("Cannot find module './listBots.js'");
          throw ((e.code = 'MODULE_NOT_FOUND'), e);
        })(),
        (function () {
          var e = Error("Cannot find module './environment.js'");
          throw ((e.code = 'MODULE_NOT_FOUND'), e);
        })(),
        (function () {
          var e = Error("Cannot find module './qrcode.js'");
          throw ((e.code = 'MODULE_NOT_FOUND'), e);
        })();
    },
    2889: () => {
      throw Error(
        "Module parse failed: Unexpected token (8:12)\nYou may need an appropriate loader to handle this file type, currently no loaders are configured to process this file. See https://webpack.js.org/concepts#loaders\n| import * as os from 'os';\n| import * as path from 'path';\n> import type { SessionAuth } from '../api/client.js';\n| \n| // Define a minimal logger interface rather than importing from fastmcp",
      );
    },
    6249: (e, t) => {
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
    4882: (e, t, r) => {
      'use strict';
      r.a(e, async (e, n) => {
        try {
          r.d(t, { Z: () => p });
          var o = r(9926),
            i = r(9268),
            s = r(8109),
            a = r(7415),
            c = r(4354),
            d = r(1777),
            l = r(5979),
            u = e([o, c]);
          [o, c] = u.then ? (await u)() : u;
          let p = (0, c.T)(
            (e) => {
              (0, i.P)(),
                (0, a.Z)(e, d.Es),
                (0, a.Z)(e, d.XW),
                (0, a.Z)(e, d.jE),
                (0, a.Z)(e, d.Z5),
                (0, a.Z)(e, d.yu),
                (0, a.Z)(e, d.eK),
                (0, a.Z)(e, d.MD),
                (0, a.Z)(e, d.PG),
                (0, a.Z)(e, d.dk),
                (0, a.Z)(e, d.sD),
                (0, a.Z)(e, d.a9),
                (0, a.Z)(e, d.sE),
                (0, a.Z)(e, d.lq),
                (0, a.Z)(e, d.o),
                (0, a.Z)(e, d.Qb),
                (0, a.Z)(e, d.dS),
                (0, a.Z)(e, d.qf),
                (0, a.Z)(e, d.hO),
                (0, a.Z)(e, d.Nc),
                (0, a.Z)(e, d.Sz),
                (0, a.Z)(e, d.rG),
                (0, a.Z)(e, d.BU),
                (0, a.Z)(e, d.Ct),
                (0, a.Z)(e, d.$V),
                (0, a.Z)(e, d.EO),
                (0, a.Z)(e, d.UI),
                (0, a.Z)(e, d.Ek),
                (0, a.Z)(e, d.nX),
                (0, s.a)(e, l.E),
                (0, s.a)(e, l.l),
                e.tool('echo', { message: o.z.string() }, async ({ message: e }) => ({
                  content: [{ type: 'text', text: `Tool echo: ${e}` }],
                }));
            },
            {
              capabilities: {
                tools: {
                  joinMeeting: { description: 'Join a meeting via URL or ID' },
                  leaveMeeting: { description: 'Leave a meeting the bot is currently in' },
                  getMeetingData: {
                    description:
                      'Get data about a meeting recording, including transcript and metadata',
                  },
                  getMeetingDataWithCredentials: {
                    description: 'Get data about a meeting using provided credentials',
                  },
                  getMeetingTranscript: { description: 'Get transcript for a specific meeting' },
                  oauthGuidance: {
                    description: 'Get guidance on setting up OAuth for calendar integration',
                  },
                  listRawCalendars: { description: 'List all raw calendar data' },
                  setupCalendarOAuth: { description: 'Set up OAuth for calendar integration' },
                  listCalendars: { description: 'List all calendars' },
                  getCalendar: { description: 'Get a specific calendar by ID' },
                  deleteCalendar: { description: 'Delete a calendar' },
                  resyncAllCalendars: { description: 'Resync all calendars' },
                  listUpcomingMeetings: { description: 'List upcoming meetings' },
                  listEvents: { description: 'List events from calendars' },
                  listEventsWithCredentials: {
                    description: 'List events using provided credentials',
                  },
                  getEvent: { description: 'Get a specific event by ID' },
                  scheduleRecording: { description: 'Schedule a recording for a meeting' },
                  scheduleRecordingWithCredentials: {
                    description: 'Schedule a recording using provided credentials',
                  },
                  cancelRecording: { description: 'Cancel a scheduled recording' },
                  cancelRecordingWithCredentials: {
                    description: 'Cancel a recording using provided credentials',
                  },
                  checkCalendarIntegration: {
                    description: 'Check if calendar integration is set up',
                  },
                  shareableMeetingLink: {
                    description: 'Get a shareable link for a meeting recording',
                  },
                  shareMeetingSegments: {
                    description: 'Share specific segments of a meeting recording',
                  },
                  findKeyMoments: { description: 'Find key moments in a meeting recording' },
                  deleteData: { description: 'Delete meeting data' },
                  listBotsWithMetadata: { description: 'List bots with metadata' },
                  selectEnvironment: {
                    description: 'Select environment (gmeetbot, preprod, prod)',
                  },
                  generateQRCode: { description: 'Generate a QR code' },
                  echo: { description: 'Echo a message' },
                },
                resources: {
                  meetingTranscript: { description: 'Meeting transcript resources' },
                  meetingMetadata: { description: 'Meeting metadata resources' },
                },
              },
            },
          );
          n();
        } catch (e) {
          n(e);
        }
      });
    },
    9268: (e, t, r) => {
      'use strict';
      r.d(t, { P: () => o });
      var n = r(6608);
      function o() {
        let e = process.env.MEETING_BAAS_ENV || 'prod';
        return (
          (0, n.setEnvironment)(e),
          console.log(`[MCP Server] Environment: ${e} (${(0, n.getApiBaseUrl)()})`),
          (0, n.getApiBaseUrl)()
        );
      }
    },
    8109: (e, t, r) => {
      'use strict';
      r.d(t, { a: () => o });
      var n = r(2889);
      function o(e, t) {
        var r;
        let o =
          ((r = t.load),
          async (e, t) => {
            try {
              let o = t?.session
                  ? (0, n.createValidSession)(t.session, {
                      error: t.log?.error || console.error,
                      warn: t.log?.warn || console.warn,
                      info: t.log?.info || console.info,
                      debug: t.log?.debug || console.debug,
                    })
                  : void 0,
                i = t ? { ...t, session: o } : { session: o },
                s = await r(e, i);
              if (Array.isArray(s))
                return {
                  contents: s.map((t) => ({
                    uri: t.uri || e.uri || '',
                    text: t.text,
                    mimeType: t.mimeType || 'text/plain',
                  })),
                };
              if (s.text)
                return {
                  contents: [
                    {
                      uri: s.uri || e.uri || '',
                      text: s.text,
                      mimeType: s.mimeType || 'text/plain',
                    },
                  ],
                };
              if (s.blob)
                return {
                  contents: [
                    {
                      uri: s.uri || e.uri || '',
                      blob: s.blob,
                      mimeType: s.mimeType || 'application/octet-stream',
                    },
                  ],
                };
              if (s.contents) return s;
              else
                return {
                  contents: [
                    { uri: e.uri || '', text: JSON.stringify(s), mimeType: 'application/json' },
                  ],
                };
            } catch (e) {
              throw (console.error('Error in resource load:', e), e);
            }
          });
        e.resource(t.name, { pattern: t.uriTemplate, list: t.list || void 0 }, o);
      }
    },
    7415: (e, t, r) => {
      'use strict';
      r.d(t, { Z: () => o });
      var n = r(2889);
      function o(e, t) {
        let r = async (e, r) => {
          try {
            let o = {
                session: (0, n.createValidSession)(r.session, r.log),
                log: r.log,
                reportProgress: async (e) => {
                  if (r.reportProgress) return r.reportProgress(e);
                },
              },
              i = await t.execute(e, o);
            if ('string' == typeof i) return { content: [{ type: 'text', text: i }] };
            if ('object' == typeof i && null !== i && 'content' in i)
              return {
                content: i.content.map((e) =>
                  'text' === e.type
                    ? { type: 'text', text: e.text }
                    : 'image' === e.type
                      ? { type: 'image', data: e.data, mimeType: e.mimeType || 'image/png' }
                      : e,
                ),
                isError: i.isError,
              };
            return { content: [{ type: 'text', text: JSON.stringify(i) }] };
          } catch (t) {
            let e = t instanceof Error ? t.message : String(t);
            return (
              r.log.error(`Error executing tool: ${e}`),
              { content: [{ type: 'text', text: `Error: ${e}` }], isError: !0 }
            );
          }
        };
        e.tool(t.name, t.parameters, r);
      }
    },
    4354: (e, t, r) => {
      'use strict';
      r.a(e, async (e, n) => {
        try {
          r.d(t, { T: () => m });
          var o = r(7555),
            i = r(1767),
            s = r(2615),
            a = r(8216),
            c = r(3665),
            d = r.n(c),
            l = r(7773),
            u = r(4169),
            p = e([o, i]);
          function m(e, t = {}) {
            let r = u?.functions?.['api/server.ts']?.maxDuration || 800,
              n = process.env.REDIS_URL || process.env.KV_URL;
            if (!n) throw Error('REDIS_URL environment variable is not set');
            let c = (0, l.createClient)({ url: n }),
              p = (0, l.createClient)({ url: n });
            c.on('error', (e) => {
              console.error('Redis error', e);
            }),
              p.on('error', (e) => {
                console.error('Redis error', e);
              });
            let m = Promise.all([c.connect(), p.connect()]),
              g = [];
            return async function (n, l) {
              await m;
              let u = new URL(n.url || '', 'https://example.com');
              if ('/sse' === u.pathname) {
                let d, u;
                console.log('Got new SSE connection');
                let m = new i.SSEServerTransport('/message', l),
                  f = m.sessionId,
                  h = new o.McpServer(
                    { name: 'mcp-typescript server on vercel', version: '0.1.0' },
                    t,
                  );
                e(h),
                  g.push(h),
                  (h.server.onclose = () => {
                    console.log('SSE connection closed'), (g = g.filter((e) => e !== h));
                  });
                let y = [],
                  v = (e, ...t) => {
                    y.push({ type: e, messages: t });
                  },
                  E = async (e) => {
                    console.log('Received message from Redis', e),
                      v('log', 'Received message from Redis', e);
                    let t = JSON.parse(e),
                      r = (function (e = {}) {
                        let {
                            method: t = 'GET',
                            url: r = '/',
                            headers: n = {},
                            body: o = null,
                            socket: i = new a.Socket(),
                          } = e,
                          c = new s.IncomingMessage(i);
                        return (
                          (c.method = t),
                          (c.url = r),
                          (c.headers = n),
                          o
                            ? process.nextTick(() => {
                                'string' == typeof o
                                  ? c.emit('data', Buffer.from(o))
                                  : Buffer.isBuffer(o)
                                    ? c.emit('data', o)
                                    : c.emit('data', Buffer.from(JSON.stringify(o))),
                                  c.emit('end');
                              })
                            : process.nextTick(() => {
                                c.emit('end');
                              }),
                          c
                        );
                      })({ method: t.method, url: t.url, headers: t.headers, body: t.body }),
                      n = new s.ServerResponse(r),
                      o = 100,
                      i = '';
                    (n.writeHead = (e) => ((o = e), n)),
                      (n.end = (e) => ((i = e), n)),
                      await m.handlePostMessage(r, n),
                      await p.publish(
                        `responses:${f}:${t.requestId}`,
                        JSON.stringify({ status: o, body: i }),
                      ),
                      o >= 200 && o < 300
                        ? v('log', `Request ${f}:${t.requestId} succeeded: ${i}`)
                        : v(
                            'error',
                            `Message for ${f}:${t.requestId} failed with status ${o}: ${i}`,
                          );
                  },
                  w = setInterval(() => {
                    for (let e of y) console[e.type].call(console, ...e.messages);
                    y = [];
                  }, 100);
                await c.subscribe(`requests:${f}`, E), console.log(`Subscribed to requests:${f}`);
                let b = new Promise((e) => {
                    (u = e),
                      (d = setTimeout(
                        () => {
                          e('max duration reached');
                        },
                        (r - 5) * 1e3,
                      ));
                  }),
                  O = async () => {
                    clearTimeout(d),
                      clearInterval(w),
                      await c.unsubscribe(`requests:${f}`, E),
                      console.log('Done'),
                      (l.statusCode = 200),
                      l.end();
                  };
                n.on('close', () => u('client hang up')), await h.connect(m);
                let S = await b;
                console.log(S), await O();
              } else if ('/message' === u.pathname) {
                let e;
                console.log('Received message');
                let t = await d()(n, { length: n.headers['content-length'], encoding: 'utf-8' }),
                  r = u.searchParams.get('sessionId') || '';
                if (!r) {
                  (l.statusCode = 400), l.end('No sessionId provided');
                  return;
                }
                let o = crypto.randomUUID(),
                  i = {
                    requestId: o,
                    url: n.url || '',
                    method: n.method || '',
                    body: t,
                    headers: n.headers,
                  };
                await c.subscribe(`responses:${r}:${o}`, (t) => {
                  clearTimeout(e);
                  let r = JSON.parse(t);
                  (l.statusCode = r.status), l.end(r.body);
                }),
                  await p.publish(`requests:${r}`, JSON.stringify(i)),
                  console.log(`Published request to ${r}`),
                  (e = setTimeout(() => {
                    (l.statusCode = 408), l.end('Request timed out');
                  }, 1e4)),
                  l.on('close', () => {
                    clearTimeout(e);
                  });
              } else (l.statusCode = 404), l.end('Not found');
            };
          }
          ([o, i] = p.then ? (await p)() : p), n();
        } catch (e) {
          n(e);
        }
      });
    },
    7153: (e, t) => {
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
    1802: (e, t, r) => {
      'use strict';
      e.exports = r(145);
    },
    4169: (e) => {
      'use strict';
      e.exports = JSON.parse(
        '{"rewrites":[{"source":"/(.+)","destination":"/api/server"}],"functions":{"api/server.ts":{"maxDuration":60}}}',
      );
    },
  });
