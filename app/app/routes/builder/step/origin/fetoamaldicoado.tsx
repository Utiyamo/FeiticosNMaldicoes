// routes/builder/origin/fetoamaldicoado.tsx
import {
  Form,
  useLoaderData,
  useActionData,
  useNavigation,
  useNavigate,
  redirect,
} from 'react-router';
import { z } from 'zod';

import { getAuthCode, getSession, commitSession } from '~/utils/auth.server';
import { flow, getNextStepId } from '~/types/flow';
import type { Route } from './+types/fetoamaldicoado';

// 🔹 Schema para Feto Amaldiçoado (nível 1, p.21)
const FetoAmaldiçoadoSchema = z.object({
  origin: z.literal('Feto Amaldiçoado'),
  bonusAttr: z.literal('con'), // +2 em Constituição (fixo)
  innateCurse: z.string().min(1, 'Nome do Feitiço de Maldição é obrigatório'),
});

// ✅ loader
export async function loader({ request }: Route.LoaderArgs) {
  const code = await getAuthCode(request);
  if (!code) return redirect('/');

  const session = await getSession(request);
  const savedData = session.get('characterData') ?? {};

  // ✅ Correção: 'Feto Amaldiçoado' (com acento e espaço)
  if (savedData.origin !== 'FetoAmaldicoado') {
    return redirect('/builder/step/origin');
  }

  return { code, savedData };
}

// ✅ action
export async function action({ request }: Route.ActionArgs) {
  const code = await getAuthCode(request);
  if (!code) return redirect('/');

  const formData = await request.formData();

  const session = await getSession(request);
  const existing = session.get('characterData') ?? {};
  let updated = { ...existing };

  const result = FetoAmaldiçoadoSchema.safeParse({
    origin: 'Feto Amaldiçoado',
    bonusAttr: 'con',
    innateCurse: formData.get('innateCurse'),
  });

  if (!result.success) {
    return {
      errors: result.error.flatten().fieldErrors,
      submitted: Object.fromEntries(formData.entries()),
    };
  }

  updated = { ...updated, ...result.data };
  session.set('characterData', updated);
  const headers = { 'Set-Cookie': await commitSession(session) };

  const nextStepId = getNextStepId('origin', updated);
  const nextStep = flow.find(s => s.id === nextStepId);
  if (!nextStep) throw new Error(`Próxima etapa '${nextStepId}' não encontrada`);
  return redirect(nextStep.path, { headers });
}

// ✅ Componente — mínimo, fiel, funcional
export default function FetoAmaldiçoadoOrigin() {
  const { savedData } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const navigate = useNavigate();
  const isSubmitting = navigation.state === 'submitting';

  const innateCurse = savedData.innateCurse ?? '';

  return (
    <div className="min-h-screen bg-gray-900 text-white py-8 px-4 sm:px-6">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-emerald-400 mb-2">
            Origem: <span className="text-emerald-300">Feto Amaldiçoado</span>
          </h1>
          <p className="text-gray-400">
            Você é um feto amaldiçoado que nasceu com consciência e tomou forma humana — uma anomalia viva, moldada pela energia negativa acumulada no útero.
          </p>
        </div>

        <div className="bg-gray-800 rounded-xl p-6 shadow-lg border border-emerald-700/30">
          <div className="mb-6 p-4 bg-emerald-900/20 rounded-lg border border-emerald-800">
            <h3 className="font-bold text-emerald-300 mb-2">Benefícios da Origem Feto Amaldiçoado</h3>
            <ul className="list-disc pl-5 space-y-1 text-sm">
              <li><strong>Bônus em Atributo:</strong> +2 em Constituição</li>
              <li><strong>Vigor Maldito:</strong> recupere PV ao entrar em combate (1d6 + mod. CON)</li>
              <li><strong>Maldição Inata:</strong> comece com 1 Feitiço de Grau 1 de maldição</li>
            </ul>
            <p className="text-xs text-emerald-200 mt-3">
              (Livro de Regras, p.21 — benefícios automáticos no nível 1)
            </p>
          </div>

          <Form method="post" className="space-y-8">
            <input type="hidden" name="intent" value="submit" />
            <input type="hidden" name="bonusAttr" value="con" />

            {/* MALDIÇÃO INATA */}
            <div>
              <h3 className="text-xl font-bold mb-2">Maldição Inata</h3>
              <p className="text-sm text-gray-400 mb-3">
                Nome do Feitiço de Grau 1 de maldição que você manifesta (ex: "Pulso de Ódio", "Semente da Desolação").
                <br /><strong>Fonte:</strong> Grimório — Maldições Grau 1 (p.5)
              </p>
              <input
                type="text"
                name="innateCurse"
                defaultValue={innateCurse}
                placeholder="Ex: Pulso de Ódio"
                className="w-full p-3 bg-gray-700 rounded border border-gray-600"
                required
              />
              {actionData?.errors?.innateCurse && (
                <p className="text-red-400 text-sm mt-1">{actionData.errors.innateCurse[0]}</p>
              )}
            </div>

            <div className="flex justify-between pt-6">
              <button
                type="button"
                onClick={() => navigate('/builder/step/origin')}
                className="px-4 py-2 text-gray-400 hover:text-white transition"
              >
                ← Voltar
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-lg shadow-md disabled:opacity-75"
              >
                {isSubmitting ? 'Salvando...' : 'Confirmar Origem →'}
              </button>
            </div>
          </Form>
        </div>
      </div>
    </div>
  );
}