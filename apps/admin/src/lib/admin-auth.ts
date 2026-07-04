import { cookies } from 'next/headers';
import { verifySessionToken } from '@/lib/session';

export function requireAdminSession(): boolean {
  const token = cookies().get('pi_auth_token')?.value;
  return !!(token && verifySessionToken(token));
}
