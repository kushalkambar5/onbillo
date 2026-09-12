export const config = {
  api: { bodyParser: false },
};

// Standalone diagnostics — does NOT boot Nest, so it works even when the
// main handler's Nest bootstrap is broken. Lets us tell apart:
//   - Vercel deploy/pipeline broken (this 500s too) vs
//   - Nest bootstrap crashing (this returns 200 with env checklist).
export default function handler(req: any, res: any) {
  const origin = req?.headers?.origin as string | undefined;
  res.setHeader('Access-Control-Allow-Origin', origin ?? '*');
  res.setHeader('Vary', 'Origin');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader(
    'Access-Control-Allow-Methods',
    'GET,POST,PUT,PATCH,DELETE,OPTIONS',
  );
  res.setHeader(
    'Access-Control-Allow-Headers',
    (req?.headers?.['access-control-request-headers'] as string) ??
      'Content-Type, Authorization',
  );
  if (req?.method === 'OPTIONS') {
    return res.status(204).end();
  }
  return res.status(200).json({
    ok: true,
    route: '/api/health',
    env: {
      // booleans only — never leak secret values
      hasDatabaseUrl: !!process.env.DATABASE_URL,
      hasClerkSecretKey: !!process.env.CLERK_SECRET_KEY,
      hasClerkWebhookSecret: !!process.env.CLERK_WEBHOOK_SECRET,
      hasR2Endpoint: !!process.env.R2_ENDPOINT,
      hasGroqKey: !!(process.env.GROQ_API_KEY || process.env.OPENAI_API_KEY),
    },
    node: process.version,
  });
}
