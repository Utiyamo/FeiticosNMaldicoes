// app/routes/_auth.tsx
import { Outlet, useLoaderData, redirect } from 'react-router';
import { getAuthCode } from '~/utils/auth.server';
import type { Route } from './+types/baseLayout';

export async function loader({ request }: Route.LoaderArgs) {
  const code = await getAuthCode(request);
  if (!code) {
    return redirect('/');
  }
  return { authenticated: true, code };
}

export default function AuthLayout() {
  const data = useLoaderData<typeof loader>();
  return <Outlet />;
}