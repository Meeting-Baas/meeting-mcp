import { NextApiRequest, NextApiResponse } from 'next';
import handler from '../../api/server';

export default async function sseHandler(req: NextApiRequest, res: NextApiResponse) {
  // Set the URL to /sse before passing to the handler
  const originalUrl = req.url;
  (req as any).url = '/sse';

  // Forward to the main handler
  return handler(req as any, res as any);
}
