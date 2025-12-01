import { Form, useActionData, useNavigation, redirect } from "react-router";
import { json } from "~/utils/utilities";
import { isValidCode, createAuthSession, commitSession } from "~/utils/auth.server";
import type { Route }  from "./+types/home";

export async function action({ request }: Route.ActionArgs ) {
  const formData = await request.formData();
  const code = String(formData.get('code') ?? '').trim();

  if (!code) {
    return { error: 'Código é obrigatório' };
  }

  if (!isValidCode(code)) {
    return { error: 'Código inválido ou expirado' };
  }

  // ✅ Agora o redirecionamento está aqui — onde pertence
  const session = await createAuthSession(code);
  return redirect('/builder/step/base', {
    headers: {
      'Set-Cookie': await commitSession(session),
    },
  });
}

export default function AuthPage() {
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-gray-800 rounded-xl shadow-2xl p-8 border border-gray-700">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Feitiços & Maldições</h1>
          <p className="text-gray-400">
            Sistema de RPG baseado em <span className="text-amber-400">Jujutsu Kaisen</span>
          </p>
        </div>

        <Form method="post" className="space-y-6">
          <div>
            <label htmlFor="code" className="block text-sm font-medium text-gray-300 mb-2">
              Código de Acesso
            </label>
            <input
              id="code"
              name="code"
              type="text"
              autoComplete="off"
              autoCapitalize="none"
              className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-amber-500 focus:border-transparent transition"
              placeholder="Ex: abc123"
              disabled={isSubmitting}
            />
            {actionData?.error && (
              <p className="mt-2 text-sm text-red-400">{actionData.error}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3 px-4 bg-amber-600 hover:bg-amber-700 text-white font-semibold rounded-lg shadow-md transition disabled:opacity-75 disabled:cursor-not-allowed"
          >
            {isSubmitting ? "Verificando..." : "Entrar"}
          </button>
        </Form>

        <div className="mt-8 pt-6 border-t border-gray-700 text-center">
          <p className="text-xs text-gray-500">
            Apenas convidados autorizados podem acessar esta aplicação.
          </p>
        </div>
      </div>
    </div>
  );
}
