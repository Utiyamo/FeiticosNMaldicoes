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
import {
  CharacterSheetSchema,
  OriginDetailsSchema,
} from '~/types/builder';
import { flow, getNextStepId } from '~/types/flow';
import type { Route } from './+types/derivado';

// ✅ loader
export async function loader({ request }: Route.LoaderArgs) {
  const code = await getAuthCode(request);
  if (!code) return redirect('/');

  const session = await getSession(request);
  const savedData = session.get('characterData') ?? {};

  if (savedData.origin !== 'Derivado') {
    return redirect('/builder/step/origin');
  }

  return { savedData };
}

// ✅ action — com originDetails
export async function action({ request }: Route.ActionArgs) {
  const session = await getSession(request);
  const existing = session.get('characterData') ?? {};

  const formData = await request.formData();

  // 🔹 Extrai dados
  const bonusAttr = formData.get('bonusAttr')?.toString();
  const sourceTechnique = formData.get('sourceTechnique')?.toString();
  const adaptedSpell = formData.get('adaptedSpell')?.toString();

  // 🔹 Validação manual
  if (!bonusAttr || !sourceTechnique || !adaptedSpell) {
    return { errors: { adaptedSpell: ['Todos os campos são obrigatórios'] } };
  }

  // 🔹 Monta originDetails
  const originDetails = OriginDetailsSchema.safeParse({
    type: 'Derivado',
    sourceTechnique,
    adaptation: adaptedSpell,
  });

  if (!originDetails.success) {
    return {
      errors: originDetails.error.flatten().fieldErrors,
      submitted: Object.fromEntries(formData.entries()),
    };
  }

  // 🔹 Monta dados completos
  const updated = {
    ...existing,
    origin: 'Derivado' as const,
    originDetails: originDetails.data,
    bonusAttr1: bonusAttr, // Derivado usa só 1 atributo (+2)
    talents: { level1: undefined },
  };

  const result = CharacterSheetSchema.safeParse(updated);
  if (!result.success) {
    return {
      errors: result.error.flatten().fieldErrors,
      submitted: Object.fromEntries(formData.entries()),
    };
  }

  session.set('characterData', result.data);
  const headers = { 'Set-Cookie': await commitSession(session) };

  const nextStepId = getNextStepId('origin', result.data);
  const nextStep = flow.find(s => s.id === nextStepId);
  if (!nextStep) throw new Error(`Próxima etapa '${nextStepId}' não encontrada`);
  return redirect(nextStep.path, { headers });
}

// ✅ Componente — SSR-only
export default function DerivadoOrigin() {
  const { savedData } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const navigate = useNavigate();
  const isSubmitting = navigation.state === 'submitting';

  // 🔹 Valores atuais
  const bonusAttr = savedData.bonusAttr1 ?? 'sab';
  const sourceTechnique = savedData.originDetails?.sourceTechnique ?? '';
  const adaptation = savedData.originDetails?.adaptation ?? '';

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
              <li><strong>+2 em um atributo mental</strong> (Inteligência ou Sabedoria)</li>
              <li><strong>Técnica Adaptada</strong> — copiou/transformou uma técnica existente</li>
              <li><strong>Desenvolvimento Inesperado</strong> — pode ultrapassar o limite de atributo (máx 32)</li>
            </ul>
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

            {/* TÉCNICA DE ORIGEM */}
            <div>
              <h3 className="text-xl font-bold mb-2">Técnica de Origem</h3>
              <p className="text-sm text-gray-400 mb-3">
                Qual técnica você adaptou? (ex: "Ilimitado", "Proporções", "Dez Sombras")
              </p>
              <input
                type="text"
                name="sourceTechnique"
                defaultValue={sourceTechnique}
                placeholder="Ex: Ilimitado"
                className="w-full p-3 bg-gray-700 rounded border border-gray-600"
                required
              />
              {actionData?.errors?.sourceTechnique && (
                <p className="text-red-400 text-sm mt-1">{actionData.errors.sourceTechnique[0]}</p>
              )}
            </div>

            {/* ADAPTAÇÃO */}
            <div>
              <h3 className="text-xl font-bold mb-2">Adaptação</h3>
              <p className="text-sm text-gray-400 mb-3">
                Como sua versão difere? (ex: "Versão defensiva do Ilimitado", "Proporções com foco em cura")
              </p>
              <textarea
                name="adaptedSpell"
                defaultValue={adaptation}
                placeholder="Descreva sua adaptação..."
                className="w-full p-3 bg-gray-700 rounded border border-gray-600 min-h-[80px]"
                required
              />
              {actionData?.errors?.adaptation && (
                <p className="text-red-400 text-sm mt-1">{actionData.errors.adaptation[0]}</p>
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