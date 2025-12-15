// routes/builder/origin/inato.tsx
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
import type { Route } from './+types/inato';

// 🔹 Mapeamento atributo → nome
const attrNames = {
  for: 'Força',
  des: 'Destreza',
  con: 'Constituição',
  int: 'Inteligência',
  sab: 'Sabedoria',
  pre: 'Presença',
};

// 🔹 Talentos permitidos no nível 1 (p.163+)
const LEVEL_1_TALENTS = [
  { id: 'Incremento de Atributo', desc: 'Aumenta um atributo em +2 (máx 30)' },
  { id: 'Afinidade com Técnica', desc: 'Recebe 1 Feitiço adicional' },
  { id: 'Voto Emergencial', desc: 'Pode criar votos simples mesmo sem técnica' },
  { id: 'Perceber Oportunidade', desc: '+2 em ataques furtivos' },
  { id: 'Alma Inquebrável', desc: '+2 em testes contra efeitos mentais' },
  { id: 'Resistência Física', desc: '+2 em Fortitude' },
  { id: 'Saltador Constante', desc: '+4,5m em Deslocamento' },
];

// ✅ loader
export async function loader({ request }: Route.LoaderArgs) {
  const code = await getAuthCode(request);
  if (!code) return redirect('/');

  const session = await getSession(request);
  const savedData = session.get('characterData') ?? {};

  if (savedData.origin !== 'Inato') {
    return redirect('/builder/step/origin');
  }

  return { savedData };
}

// ✅ action — com originDetails correto
export async function action({ request }: Route.ActionArgs) {
  const session = await getSession(request);
  const existing = session.get('characterData') ?? {};

  const formData = await request.formData();

  // 🔹 Extrai dados do form
  const bonusAttr1 = formData.get('bonusAttr1')?.toString();
  const bonusAttr2 = formData.get('bonusAttr2')?.toString();
  const naturalTalent = formData.get('naturalTalent')?.toString();
  const trademarkSpell = formData.get('trademarkSpell')?.toString();
  const techniqueName = formData.get('techniqueName')?.toString();

  // 🔹 Validação manual (antes do schema)
  if (!bonusAttr1 || !bonusAttr2) {
    return { errors: { bonusAttr1: ['Atributos obrigatórios'] } };
  }
  if (bonusAttr1 === bonusAttr2) {
    return { errors: { bonusAttr2: ['Os atributos devem ser diferentes'] } };
  }

  // 🔹 Monta originDetails
  const originDetails = OriginDetailsSchema.safeParse({
    type: 'Inato',
    trademarkSpell: trademarkSpell,
    techniqueName: techniqueName ?? 'Técnica Inata',
  });

  if (!originDetails.success) {
    return {
      errors: originDetails.error.flatten().fieldErrors,
      submitted: Object.fromEntries(formData.entries()),
    };
  }

  // 🔹 Monta dados completos para validação final
  const updated = {
    ...existing,
    origin: 'Inato' as const,
    originDetails: originDetails.data,
    bonusAttr1,
    bonusAttr2,
    naturalTalent,
    talents: { level1: naturalTalent },
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

// ✅ Componente — SSR-only, radio buttons, sem JS
export default function InatoOrigin() {
  const { savedData } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const navigate = useNavigate();
  const isSubmitting = navigation.state === 'submitting';

  // 🔹 Valores atuais
  const bonusAttr1 = savedData.bonusAttr1 ?? 'for';
  const bonusAttr2 = savedData.bonusAttr2 ?? 'con';
  const naturalTalent = savedData.naturalTalent ?? '';
  const trademarkSpell = savedData.originDetails?.trademarkSpell ?? '';
  const techniqueName = savedData.originDetails?.techniqueName ?? '';

  return (
    <div className="min-h-screen bg-gray-900 text-white py-8 px-4 sm:px-6">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-amber-400 mb-2">
            Origem: <span className="text-yellow-300">Inato</span>
          </h1>
          <p className="text-gray-400">
            Você nasceu com uma técnica amaldiçoada única — fruto de uma linhagem poderosa ou anomalia natural.
          </p>
        </div>

        <div className="bg-gray-800 rounded-xl p-6 shadow-lg border border-amber-700/30">
          <div className="mb-6 p-4 bg-amber-900/20 rounded-lg border border-amber-800">
            <h3 className="font-bold text-amber-300 mb-2">Benefícios da Origem Inato</h3>
            <ul className="list-disc pl-5 space-y-1 text-sm">
              <li><strong>Bônus em Atributos:</strong> +2 em um atributo, +1 em outro</li>
              <li><strong>Talento Natural:</strong> 1 talento à escolha no 1º nível</li>
              <li><strong>Marca Registrada:</strong> 1 Feitiço com custo reduzido em 1 PE</li>
            </ul>
          </div>

          <Form method="post" className="space-y-8">
            <input type="hidden" name="intent" value="submit" />

            {/* BÔNUS DE ATRIBUTOS */}
            <div>
              <h3 className="text-xl font-bold mb-4">Bônus em Atributos</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Atributo +2</label>
                  <select
                    name="bonusAttr1"
                    defaultValue={bonusAttr1}
                    className="w-full p-2 bg-gray-700 rounded border border-gray-600"
                    required
                  >
                    {Object.entries(attrNames).map(([key, name]) => (
                      <option key={key} value={key}>{name}</option>
                    ))}
                  </select>
                  {actionData?.errors?.bonusAttr1 && (
                    <p className="text-red-400 text-sm mt-1">{actionData.errors.bonusAttr1[0]}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Atributo +1 <span className="text-gray-500">(diferente do anterior)</span>
                  </label>
                  <select
                    name="bonusAttr2"
                    defaultValue={bonusAttr2}
                    className="w-full p-2 bg-gray-700 rounded border border-gray-600"
                    required
                  >
                    {Object.entries(attrNames)
                      .filter(([key]) => key !== bonusAttr1)
                      .map(([key, name]) => (
                        <option key={key} value={key}>{name}</option>
                      ))}
                  </select>
                  {actionData?.errors?.bonusAttr2 && (
                    <p className="text-red-400 text-sm mt-1">{actionData.errors.bonusAttr2[0]}</p>
                  )}
                </div>
              </div>
            </div>

            {/* TALENTO NATURAL */}
            <div>
              <h3 className="text-xl font-bold mb-3">Talento Natural</h3>
              <p className="text-sm text-gray-400 mb-4">
                Escolha <strong>um único talento</strong> (p.163 do Livro de Regras).
              </p>
              <div className="space-y-3">
                {LEVEL_1_TALENTS.map(talent => {
                  const isChecked = naturalTalent === talent.id;
                  return (
                    <label
                      key={talent.id}
                      className={`flex items-start p-4 rounded-lg border-2 cursor-pointer transition-colors ${
                        isChecked ? 'border-amber-500 bg-amber-900/20' : 'border-gray-600 bg-gray-800 hover:border-amber-400'
                      }`}
                    >
                      <input
                        type="radio"
                        name="naturalTalent"
                        value={talent.id}
                        defaultChecked={isChecked}
                        className="mt-1 text-amber-500"
                        required
                      />
                      <div className="ml-4">
                        <div className="font-medium">{talent.id}</div>
                        <div className="text-sm text-gray-300">{talent.desc}</div>
                      </div>
                    </label>
                  );
                })}
              </div>
              {actionData?.errors?.naturalTalent && (
                <p className="text-red-400 text-sm mt-2">{actionData.errors.naturalTalent[0]}</p>
              )}
            </div>

            {/* MARCA REGISTRADA + NOME DA TÉCNICA */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Nome da Técnica Inata
                </label>
                <input
                  type="text"
                  name="techniqueName"
                  defaultValue={techniqueName}
                  placeholder="Ex: Proporções"
                  className="w-full p-3 bg-gray-700 rounded border border-gray-600"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">
                  Marca Registrada (Feitiço com -1 PE)
                </label>
                <input
                  type="text"
                  name="trademarkSpell"
                  defaultValue={trademarkSpell}
                  placeholder="Ex: Proporção: 7:3"
                  className="w-full p-3 bg-gray-700 rounded border border-gray-600"
                  required
                />
              </div>
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
                className="px-6 py-2 bg-amber-600 hover:bg-amber-700 text-white font-medium rounded-lg shadow-md disabled:opacity-75"
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