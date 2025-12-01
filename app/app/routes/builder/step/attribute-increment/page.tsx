// routes/builder/step/attribute-increment.tsx
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
import type { Route } from './+types/page';

const AttributeSchema = z.enum(['for', 'des', 'con', 'int', 'sab', 'pre']);
const AttributeIncrementSchema = z.object({
  attributeToIncrement: AttributeSchema,
});

// ✅ loader
export async function loader({ request }: Route.LoaderArgs) {
  const code = await getAuthCode(request);
  if (!code) return redirect('/');

  const session = await getSession(request);
  const savedData = session.get('characterData') ?? {};

  // Garante que só chega aqui se tiver talento nível 1 = Incremento de Atributo
  if (savedData.talents?.level1 !== 'Incremento de Atributo') {
    return redirect('/builder/step/specialization');
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

  const result = AttributeIncrementSchema.safeParse({
    attributeToIncrement: formData.get('attributeToIncrement'),
  });

  if (!result.success) {
    return {
      errors: result.error.flatten().fieldErrors,
      submitted: Object.fromEntries(formData.entries()),
    };
  }

  // Aplica +2 no atributo escolhido
  const attr = result.data.attributeToIncrement;
  const current = updated.attributes?.[attr] ?? 10;
  if (current > 28) {
    return {
      errors: { attributeToIncrement: [`O atributo deve ser ≤ 28 para incrementar`] },
    };
  }

  const newAttrs = { ...updated.attributes, [attr]: current + 2 };
  updated = { ...updated, attributes: newAttrs };

  session.set('characterData', updated);
  const headers = { 'Set-Cookie': await commitSession(session) };

  const nextStepId = getNextStepId('attribute-increment', updated);
  const nextStep = flow.find(s => s.id === nextStepId);
  if (!nextStep) throw new Error(`Próxima etapa '${nextStepId}' não encontrada`);
  return redirect(nextStep.path, { headers });
}

// ✅ Componente — simples, funcional, acessível
export default function AttributeIncrementStep() {
  const { savedData } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const navigate = useNavigate();
  const isSubmitting = navigation.state === 'submitting';

  const attrs = savedData.attributes ?? { for: 10, des: 10, con: 10, int: 10, sab: 10, pre: 10 };
  const attrNames = {
    for: 'Força',
    des: 'Destreza',
    con: 'Constituição',
    int: 'Inteligência',
    sab: 'Sabedoria',
    pre: 'Presença',
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white py-8 px-4 sm:px-6">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-amber-400 mb-2">
            Incremento de Atributo
          </h1>
          <p className="text-gray-400">
            Seu talento <strong>Incremento de Atributo</strong> permite aumentar um atributo em +2 (máx 30).
          </p>
        </div>

        <div className="bg-gray-800 rounded-xl p-6 shadow-lg border border-amber-700/30">
          <div className="mb-4 p-3 bg-amber-900/20 rounded text-sm">
            <strong>Regra (p.163):</strong> Apenas atributos ≤ 28 podem ser incrementados.
          </div>

          <Form method="post" className="space-y-6">
            <input type="hidden" name="intent" value="submit" />

            <div>
              <h3 className="text-xl font-bold mb-3">Escolha o atributo para incrementar</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {Object.entries(attrNames).map(([key, name]) => {
                  const value = attrs[key as keyof typeof attrs] ?? 10;
                  const canIncrement = value <= 28;
                  const isChecked = savedData.attributeIncrement === key;

                  return (
                    <label
                      key={key}
                      className={`p-3 rounded border cursor-pointer transition ${
                        isChecked
                          ? 'border-amber-500 bg-amber-900/20'
                          : canIncrement
                          ? 'border-gray-600 bg-gray-800 hover:border-amber-400'
                          : 'border-gray-800 bg-gray-900/50 cursor-not-allowed opacity-60'
                      }`}
                    >
                      <input
                        type="radio"
                        name="attributeToIncrement"
                        value={key}
                        defaultChecked={isChecked}
                        disabled={!canIncrement}
                        className="sr-only"
                      />
                      <div className="flex justify-between">
                        <span>{name}</span>
                        <span className="font-mono">{value} → {value + (canIncrement ? 2 : 0)}</span>
                      </div>
                      {!canIncrement && (
                        <p className="text-xs text-red-400 mt-1">Máximo atingido</p>
                      )}
                    </label>
                  );
                })}
              </div>

              {actionData?.errors?.attributeToIncrement && (
                <p className="text-red-400 text-sm mt-2">
                  {actionData.errors.attributeToIncrement[0]}
                </p>
              )}
            </div>

            <div className="flex justify-between pt-4">
              <button
                type="button"
                onClick={() => navigate(-1)}
                className="px-4 py-2 text-gray-400 hover:text-white transition"
              >
                ← Voltar
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-6 py-2 bg-amber-600 hover:bg-amber-700 text-white font-medium rounded-lg shadow-md disabled:opacity-75"
              >
                {isSubmitting ? 'Aplicando...' : 'Confirmar Incremento →'}
              </button>
            </div>
          </Form>

          <div className="mt-6 text-center text-xs text-gray-500">
            Etapa extra (opcional) • Próximo: Especialização
          </div>
        </div>
      </div>
    </div>
  );
}