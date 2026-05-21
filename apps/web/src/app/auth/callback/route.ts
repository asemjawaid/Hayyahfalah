import { NextResponse } from 'next/server';

/**
 * OAuth / magic-link callback.
 * We cannot exchange the PKCE code on the server because the verifier
 * lives in the browser's localStorage.  Redirect to the client page that
 * does the exchange, forwarding the code param.
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/';

  const params = new URLSearchParams();
  if (code) params.set('code', code);
  params.set('next', next);

  return NextResponse.redirect(`${origin}/auth/processing?${params.toString()}`);
}
