// routes/builder/origin/derivado.tsx
import {
  Form,
  useLoaderData,
  useActionData,
  useNavigation,
  redirect,
  useNavigate,
} from 'react-router';
import { z } from 'zod';

import { getAuthCode, getSession, commitSession } from '~/utils/auth.server';
import { flow, getNextStepId } from '~/types/flow';
import type { Route } from './+types/derivado';

// 🔹 Schema exato (p.21)
const DerivadoDetailsSchema = z.object({
  origin: z.literal('Derivado'),
  bonusAttr: z.enum(['int', 'sab']),
  adaptedSpell: z.string().min(1, 'Nome do feitiço copiado é obrigatório'),
});

// ✅ loader
export async function loader({ request }: Route.LoaderArgs) {
  const code = await getAuthCode(request);
  if (!code) return redirect('/');

  const session = await getSession(request);
  const savedData = session.get('characterData') ?? {};

  if (savedData.origin !== 'Derivado') {
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

  const result = DerivadoDetailsSchema.safeParse({
    origin: 'Derivado',
    bonusAttr: formData.get('bonusAttr'),
    adaptedSpell: formData.get('adaptedSpell'),
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

// ✅ Componente — fiel ao livro, nível 1
export default function DerivadoOrigin() {
  const { savedData } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const navigate = useNavigate();
  const isSubmitting = navigation.state === 'submitting';

  const bonusAttr = savedData.bonusAttr ?? 'sab';
  const adaptedSpell = savedData.adaptedSpell ?? '';

  return (
    <div className="min-h-screen bg-gray-900 text-white py-8 px-4 sm:px-6">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-blue-400 mb-2">
            Origem: <span className="text-cyan-300">Derivado</span>
          </h1>
          <p className="text-gray-400">
            Sua técnica foi moldada a partir de outra — adaptada, fragmentada ou reinventada. Você não a criou, nem a herdou… você a transformou.
          </p>
        </div>

        <div className="bg-gray-800 rounded-xl p-6 shadow-lg border border-blue-700/30">
          <div className="mb-6 p-4 bg-blue-900/20 rounded-lg border border-blue-800">
            <h3 className="font-bold text-blue-300 mb-2">Benefícios da Origem Derivado</h3>
            <ul className="list-disc pl-5 space-y-1 text-sm">
              <li><strong>Bônus em Atributo:</strong> +2 em Inteligência ou Sabedoria</li>
              <li><strong>Domínio Adaptativo:</strong> pode copiar 1 feitiço de outra técnica (custo +1 PE)</li>
            </ul>
            <p className="text-xs text-blue-200 mt-3">
              (Livro de Regras, p.21 — benefícios automáticos no nível 1)
            </p>
          </div>

          <Form method="post" className="space-y-8">
            <input type="hidden" name="intent" value="submit" />

            {/* BÔNUS DE ATRIBUTO */}
            <div>
              <h3 className="text-xl font-bold mb-4">Bônus em Atributo (+2)</h3>
              <p className="text-sm text-gray-400 mb-3">
                Escolha entre <strong>Inteligência</strong> (análise, feitiços) ou <strong>Sabedoria</strong> (percepção, intuitivo).
              </p>
              <div className="space-y-3">
                {(['int', 'sab'] as const).map(attr => {
                  const isChecked = bonusAttr === attr;
                  return (
                    <label
                      key={attr}
                      className={`flex items-start p-4 rounded-lg border-2 cursor-pointer transition ${
                        isChecked
                          ? 'border-blue-500 bg-blue-900/20'
                          : 'border-gray-600 bg-gray-800 hover:border-blue-400'
                      }`}
                    >
                      <input
                        type="radio"
                        name="bonusAttr"
                        value={attr}
                        defaultChecked={isChecked}
                        className="mt-1 text-blue-500"
                        required
                      />
                      <div className="ml-4">
                        <div className="font-medium">
                          +2 em {attr === 'int' ? 'Inteligência' : 'Sabedoria'}
                        </div>
                      </div>
                    </label>
                  );
                })}
              </div>
              {actionData?.errors?.bonusAttr && (
                <p className="text-red-400 text-sm mt-2">{actionData.errors.bonusAttr[0]}</p>
              )}
            </div>

            {/* DOMÍNIO ADAPTATIVO — CAMPO OBRIGATÓRIO */}
            <div>
              <h3 className="text-xl font-bold mb-2">Domínio Adaptativo</h3>
              <p className="text-sm text-gray-400 mb-3">
                Nome do Feitiço copiado de outra técnica (ex: "Proporção: 7:3", "Chamas do Desastre").
                <br /><strong>Regra:</strong> seu custo será aumentado em 1 PE.
              </p>
              <input
                type="text"
                name="adaptedSpell"
                defaultValue={adaptedSpell}
                placeholder="Ex: Técnica de Barreira (cópia)"
                className="w-full p-3 bg-gray-700 rounded border border-gray-600"
                required
              />
              {actionData?.errors?.adaptedSpell && (
                <p className="text-red-400 text-sm mt-1">{actionData.errors.adaptedSpell[0]}</p>
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
                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg shadow-md disabled:opacity-75"
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