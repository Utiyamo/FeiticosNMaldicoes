// routes/builder/origin/sem-tecnica.tsx
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
  ATTRIBUTE_VALUES,
  CharacterSheetSchema,
  NaturalTalentSchema,
} from '~/types/builder';
import { flow, getNextStepId } from '~/types/flow';
import type { Route } from './+types/semtecnica';

// 🔹 Mapeamento atributo → nome
const attrNames = {
  for: 'Força',
  des: 'Destreza',
  con: 'Constituição',
  int: 'Inteligência',
  sab: 'Sabedoria',
  pre: 'Presença',
};

// 🔹 Talentos válidos para Sem-Técnica no nível 1 (p.163+)
const LEVEL_1_TALENTS = [
  { id: 'Incremento de Atributo', desc: 'Aumenta um atributo em +2 (máx 30)' },
  { id: 'Adepto de Briga', desc: '+2 em Acrobacia e Atletismo' },
  { id: 'Adepto de Medicina', desc: '+2 em Medicina e Sobrevivência' },
  { id: 'Alma Inquebrável', desc: '+2 em testes contra efeitos mentais' },
  { id: 'Resistência Fícia', desc: '+2 em Fortitude' },
  { id: 'Gosto pela Luta', desc: '+2 em ataques corpo a corpo e dano' },
  { id: 'Saltador Constante', desc: '+4,5m em Deslocamento' },
];

// ✅ loader
export async function loader({ request }: Route.LoaderArgs) {
  const code = await getAuthCode(request);
  if (!code) return redirect('/');

  const session = await getSession(request);
  const savedData = session.get('characterData') ?? {};

  if (savedData.origin !== 'Sem-Técnica') {
    return redirect('/builder/step/origin');
  }

  return { code, savedData };
}

// ✅ action
export async function action({ request }: Route.ActionArgs) {
  const code = await getAuthCode(request);
  if (!code) return redirect('/');

  const formData = await request.formData();
  const intent = formData.get('intent')?.toString() ?? 'submit';

  const session = await getSession(request);
  const existing = session.get('characterData') ?? {};
  let updated = { ...existing };

  if (intent === 'update' && formData.get('field')) {
    const field = formData.get('field')!.toString();
    const value = formData.get('value')?.toString() ?? '';
    updated = { ...updated, [field]: value };
  }

  if (intent === 'submit') {
    const result = CharacterSheetSchema.safeParse({
      origin: 'Sem-Técnica',
      bonusAttr1: formData.get('bonusAttr1'),
      bonusAttr2: formData.get('bonusAttr2'),
      talents: {
        level1: formData.get('naturalTalent')
      }
    });

    if (!result.success) {
      return {
        errors: result.error.flatten().fieldErrors,
        submitted: Object.fromEntries(formData.entries()),
      };
    }

    // Atributos devem ser diferentes
    if (result.data.bonusAttr1 === result.data.bonusAttr2) {
      return {
        errors: { bonusAttr2: ['Os atributos devem ser diferentes'] },
        submitted: Object.fromEntries(formData.entries()),
      };
    }

    updated = { ...updated, ...result.data };
  }

  session.set('characterData', updated);
  const headers = { 'Set-Cookie': await commitSession(session) };

  if (intent === 'submit') {
    const nextStepId = getNextStepId('origin', updated);
    const nextStep = flow.find((s) => s.id === nextStepId);
    if (!nextStep)
      throw new Error(`Próxima etapa '${nextStepId}' não encontrada`);
    return redirect(nextStep.path, { headers });
  }

  return redirect('/builder/origin/sem-tecnica', { headers });
}

// ✅ Componente — 100% SSR, radio buttons, sem JS obrigatório
export default function SemTecnicaOrigin() {
  const { savedData } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const navigate = useNavigate();
  const isSubmitting = navigation.state === 'submitting';

  // Valores atuais (do loader)
  const bonusAttr1 = savedData.bonusAttr1 ?? 'for';
  const bonusAttr2 = savedData.bonusAttr2 ?? 'des';
  const naturalTalent = savedData.naturalTalent ?? '';

  return (
    <div className="min-h-screen bg-gray-900 text-white py-8 px-4 sm:px-6">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-red-400 mb-2">
            Origem: <span className="text-red-300">Sem-Técnica</span>
          </h1>
          <p className="text-gray-400">
            Você não possui uma técnica amaldiçoada — mas domina o combate com
            puro treinamento, força de vontade e domínio corporal. Sua energia
            amaldiçoada é bruta, direta e letal.
          </p>
        </div>

        <div className="bg-gray-800 rounded-xl p-6 shadow-lg border border-red-700/30">
          <div className="mb-6 p-4 bg-red-900/20 rounded-lg border border-red-800">
            <h3 className="font-bold text-red-300 mb-2">
              Benefícios da Origem Sem-Técnica
            </h3>
            <ul className="list-disc pl-5 space-y-1 text-sm">
              <li>
                <strong>Bônus em Atributos:</strong> +1 em Força e +1 em
                Destreza
              </li>
              <li>
                <strong>Talento Natural:</strong> 1 talento à escolha no 1º
                nível
              </li>
              <li>
                <strong>Combate Amaldiçoado:</strong> +1d6 de dano em ataques
                corpo a corpo
              </li>
              <li>
                <strong>Resistência Superior:</strong> +2 em testes de Fortitude
              </li>
            </ul>
          </div>

          <Form method="post" className="space-y-8">
            <input type="hidden" name="intent" value="submit" />

            {/* BÔNUS DE ATRIBUTOS */}
            <div>
              <h3 className="text-xl font-bold mb-4">Bônus em Atributos</h3>
              <p className="text-sm text-gray-400 mb-3">
                Por padrão, Sem-Técnica concede{' '}
                <strong>+1 em Força e +1 em Destreza</strong> (regra fixa).
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Atributo +1 (1º)
                  </label>
                  <select
                    name="bonusAttr1"
                    defaultValue="for"
                    readOnly
                    className="w-full p-2 bg-gray-700 rounded border border-gray-600 cursor-not-allowed"
                    required
                  >
                    <option value="for">Força</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Atributo +1 (2º)
                  </label>
                  <select
                    name="bonusAttr2"
                    defaultValue="des"
                    readOnly
                    className="w-full p-2 bg-gray-700 rounded border border-gray-600 cursor-not-allowed"
                    required
                  >
                    <option value="des">Destreza</option>
                  </select>
                </div>
              </div>
            </div>

            {/* TALENTO NATURAL */}
            <div>
              <h3 className="text-xl font-bold mb-3">Talento Natural</h3>
              <p className="text-sm text-gray-400 mb-4">
                Escolha 1 talento (p.163 do Livro de Regras). Este é o único
                talento concedido no 1º nível para Sem-Técnica.
              </p>
              <div className="space-y-3">
                {LEVEL_1_TALENTS.map((talent) => {
                  const isChecked = naturalTalent === talent.id;
                  return (
                    <label
                      key={talent.id}
                      className={`flex items-start p-4 rounded-lg border-2 cursor-pointer transition border-gray-600 bg-gray-800 hover:border-red-400`}
                    >
                      <input
                        type="radio"
                        name="naturalTalent"
                        value={talent.id}
                        defaultChecked={isChecked}
                        className="mt-1 text-red-500"
                        required
                      />
                      <div className="ml-4">
                        <div className="font-medium">{talent.id}</div>
                        <div className="text-sm text-gray-300">
                          {talent.desc}
                        </div>
                      </div>
                    </label>
                  );
                })}
              </div>
              {actionData?.errors?.naturalTalent && (
                <p className="text-red-400 text-sm mt-2">
                  {actionData.errors.naturalTalent[0]}
                </p>
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
                className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg shadow-md disabled:opacity-75"
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