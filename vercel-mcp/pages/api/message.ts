import { NextApiRequest, NextApiResponse } from 'next';
import handler from '../../api/server';

export default async function messageHandler(req: NextApiRequest, res: NextApiResponse) {
  // Set the URL to /message before passing to the handler
  const originalUrl = req.url;
  (req as any).url = '/message';

  // Forward to the main handler
  return handler(req as any, res as any);
}
