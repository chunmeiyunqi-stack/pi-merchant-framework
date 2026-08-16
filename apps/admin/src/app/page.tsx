import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';

export default function RootPage() {
  const token = cookies().get('pi_auth_token')?.value;
  if (!token) {
    redirect('/login');
  }
  redirect('/dashboard');
}
