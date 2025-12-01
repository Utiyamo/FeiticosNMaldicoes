// app/utils/auth.server.ts
import { createCookieSessionStorage } from 'react-router';

const sessionSecret = process.env.VITE_SESSION_SECRET;
if (!sessionSecret) {
  throw new Error('VITE_SESSION_SECRET must be set in .env');
}

const sessionStorage = createCookieSessionStorage({
  cookie: {
    name: '__session',
    httpOnly: true,
    path: '/',
    sameSite: 'lax',
    secrets: [sessionSecret],
    secure: process.env.NODE_ENV === 'production',
    maxAge: 6 * 60 * 60,
  },
});

const AUTH_CODES = (process.env.VITE_INVITE_AUTH_TOKEN || '')
  .split(';')
  .map(s => s.trim())
  .filter(Boolean);

// ✅ Pura função — sem efeitos HTTP
export function isValidCode(code: string): boolean {
  return AUTH_CODES.includes(code);
}

export async function getSession(request: Request) {
  const cookie = request.headers.get('Cookie');
  return sessionStorage.getSession(cookie);
}

// ✅ Retorna apenas os dados da sessão — não uma Response
export async function createAuthSession(code: string) {
  const session = await sessionStorage.getSession();
  session.set('authCode', code);
  return session; // ← devolve a sessão, não a resposta
}

export async function commitSession(session: any) {
  return sessionStorage.commitSession(session);
}

export async function destroySession(request: Request) {
  const session = await sessionStorage.getSession(request.headers.get('Cookie'));
  return sessionStorage.destroySession(session);
}

// ✅ Pura verificação — retorna o código ou null
export async function getAuthCode(request: Request): Promise<string | null> {
  const session = await sessionStorage.getSession(request.headers.get('Cookie'));
  const code = session.get('authCode');
  return isValidCode(code) ? code : null;
}