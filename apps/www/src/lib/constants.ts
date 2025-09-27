export const MESSAGE_CHAR_LIMIT = 200;

export const NEXT_PUBLIC_URL = process.env
  .NEXT_PUBLIC_VERCEL_PROJECT_PRODUCTION_URL
  ? `https://${process.env.NEXT_PUBLIC_VERCEL_PROJECT_PRODUCTION_URL}`
  : process.env.NEXT_PUBLIC_VERCEL_URL
  ? `https://${process.env.NEXT_PUBLIC_VERCEL_URL}`
  : `http://${process.env.NEXT_PUBLIC_LOCAL_URL}`;
