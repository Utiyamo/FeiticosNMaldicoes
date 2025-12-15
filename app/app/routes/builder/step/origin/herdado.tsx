// routes/builder/origin/herdado.tsx
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
import type { Route } from './+types/herdado';

// 🔹 Linhagens válidas
const LINEAGES = [
  {
    id: 'zenin',
    name: 'Clã Zenin',
    spell: 'Dez Sombras',
  },
  {
    id: 'gojo',
    name: 'Clã Gojo',
    spell: 'Ilusão Divina',
  },
  {
    id: 'kamo',
    name: 'Clã Kamo',
    spell: 'Sangue Vermelho',
  },
  {
    id: 'inumaki',
    name: 'Clã Inumaki',
    spell: 'Fala Amaldiçoada',
  },
] as const;

// 🔹 Talentos nível 1
const LEVEL_1_TALENTS = [
  { id: 'Incremento de Atributo', desc: 'Aumenta um atributo em +2 (máx 30)' },
  { id: 'Afinidade com Técnica', desc: 'Recebe 1 Feitiço adicional' },
  { id: 'Voto Emergencial', desc: 'Pode criar votos simples mesmo sem técnica' },
  { id: 'Perceber Oportunidade', desc: '+2 em ataques furtivos' },
  { id: 'Alma Inquebrável', desc: '+2 em testes contra efeitos mentais' },
  { id: 'Resistência Física', desc: '+2 em Fortitude' },
  { id: 'Artesão Amaldiçoado', desc: '+1 em criação de itens durante interlúdio' },
];

// ✅ loader
export async function loader({ request }: Route.LoaderArgs) {
  const code = await getAuthCode(request);
  if (!code) return redirect('/');

  const session = await getSession(request);
  const savedData = session.get('characterData') ?? {};

  if (savedData.origin !== 'Herdado') {
    return redirect('/builder/step/origin');
  }

  return { savedData };
}

// ✅ action — com originDetails correto
export async function action({ request }: Route.ActionArgs) {
  const session = await getSession(request);
  const existing = session.get('characterData') ?? {};

  const formData = await request.formData();
  const intent = formData.get('intent')?.toString();

  // ➕ Selecionar linhagem → avança para atributos/talentos
  if (intent === 'select-lineage') {
    const clan = formData.get('clan')?.toString();
    if (!clan) return { error: 'Clã inválido' };

    const clanData = LINEAGES.find(l => l.id === clan);
    const clanSpell = clanData?.spell ?? 'Técnica Herdada';

    const updated = {
      ...existing,
      origin: 'Herdado' as const,
      originDetails: {
        type: 'Herdado',
        clan,
        clanSpell,
      },
    };

    session.set('characterData', updated);
    const headers = { 'Set-Cookie': await commitSession(session) };
    return redirect('/builder/origin/herdado', { headers });
  }

  // ✅ Submissão final
  if (intent === 'submit') {
    const bonusAttr1 = formData.get('bonusAttr1')?.toString();
    const bonusAttr2 = formData.get('bonusAttr2')?.toString();
    const naturalTalent = formData.get('naturalTalent')?.toString();

    if (!bonusAttr1 || !bonusAttr2) {
      return { errors: { bonusAttr1: ['Atributos obrigatórios'] } };
    }
    if (bonusAttr1 === bonusAttr2) {
      return { errors: { bonusAttr2: ['Os atributos devem ser diferentes'] } };
    }

    // 🔹 Valida originDetails (já deve estar salvo)
    const originDetails = existing.originDetails;
    if (!originDetails || originDetails.type !== 'Herdado') {
      return { error: 'Clã não selecionado' };
    }

    const updated = {
      ...existing,
      origin: 'Herdado' as const,
      originDetails,
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

  return redirect('/builder/origin/herdado');
}

// ✅ Componente — SSR-only
export default function HerdadoOrigin() {
  const { savedData } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const navigate = useNavigate();
  const isSubmitting = navigation.state === 'submitting';

  // 🔹 Valores atuais
  const isClanSelected = savedData.originDetails?.type === 'Herdado';
  const clan = savedData.originDetails?.clan ?? '';
  const clanSpell = savedData.originDetails?.clanSpell ?? '';
  const bonusAttr1 = savedData.bonusAttr1 ?? 'for';
  const bonusAttr2 = savedData.bonusAttr2 ?? 'con';
  const naturalTalent = savedData.naturalTalent ?? '';

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
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-purple-400 mb-2">
            Origem: <span className="text-violet-300">Herdado</span>
          </h1>
          <p className="text-gray-400">
            Você recebeu uma técnica amaldiçoada por linhagem — um legado poderoso, mas com responsabilidades únicas.
          </p>
        </div>

        <div className="bg-gray-800 rounded-xl p-6 shadow-lg border border-purple-700/30">
          <div className="mb-6 p-4 bg-purple-900/20 rounded-lg border border-purple-800">
            <h3 className="font-bold text-purple-300 mb-2">Benefícios da Origem Herdado</h3>
            <ul className="list-disc pl-5 space-y-1 text-sm">
              <li><strong>Técnica de Linhagem:</strong> Recebe um feitiço fixo do seu clã</li>
              <li><strong>+1 em dois atributos diferentes</strong></li>
              <li><strong>1 Talento Natural</strong> no 1º nível</li>
            </ul>
          </div>

          <Form method="post" className="space-y-8">
            {!isClanSelected ? (
              // 🔹 Etapa 1: Selecionar clã
              <>
                <input type="hidden" name="intent" value="select-lineage" />
                <h3 className="text-xl font-bold mb-4">1. Qual é a sua linhagem?</h3>
                <p className="text-sm text-gray-400 mb-4">
                  Escolha o clã que lhe concedeu a técnica herdada.
                </p>
                <div className="space-y-3">
                  {LINEAGES.map(l => (
                    <label
                      key={l.id}
                      className={`flex items-start p-4 rounded-lg border-2 cursor-pointer transition ${
                        clan === l.id
                          ? 'border-purple-500 bg-purple-900/20'
                          : 'border-gray-600 bg-gray-800 hover:border-purple-400'
                      }`}
                    >
                      <input
                        type="radio"
                        name="clan"
                        value={l.id}
                        defaultChecked={clan === l.id}
                        className="mt-1 text-purple-500"
                        required
                      />
                      <div className="ml-4">
                        <div className="font-bold">{l.name}</div>
                        <div className="text-sm text-gray-300 mt-1">
                          <span className="text-amber-400">Feitiço do Clã:</span> {l.spell}
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
                <button
                  type="submit"
                  className="w-full py-3 px-4 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-lg shadow-md"
                >
                  Avançar → Definir Atributos e Talentos
                </button>
              </>
            ) : (
              // 🔹 Etapa 2: Atributos + Talento
              <>
                <input type="hidden" name="intent" value="submit" />

                <div className="mb-6 p-3 bg-gray-700/50 rounded">
                  <h4 className="font-bold text-purple-300">Linhagem Selecionada:</h4>
                  <p>
                    <strong>{LINEAGES.find(l => l.id === clan)?.name}</strong><br />
                    Feitiço do Clã: <span className="text-amber-300">{clanSpell}</span>
                  </p>
                </div>

                {/* Atributos */}
                <div>
                  <h3 className="text-xl font-bold mb-4">Bônus em Atributos (+1 em dois)</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">Atributo +1 (1º)</label>
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
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Atributo +1 (2º) <span className="text-gray-500">(diferente do anterior)</span>
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
                    </div>
                  </div>
                </div>

                {/* Talento */}
                <div>
                  <h3 className="text-xl font-bold mb-3">Talento Natural</h3>
                  <div className="space-y-3">
                    {LEVEL_1_TALENTS.map(talent => {
                      const isChecked = naturalTalent === talent.id;
                      return (
                        <label
                          key={talent.id}
                          className={`flex items-start p-4 rounded-lg border-2 cursor-pointer transition ${
                            isChecked
                              ? 'border-purple-500 bg-purple-900/20'
                              : 'border-gray-600 bg-gray-800 hover:border-purple-400'
                          }`}
                        >
                          <input
                            type="radio"
                            name="naturalTalent"
                            value={talent.id}
                            defaultChecked={isChecked}
                            className="mt-1 text-purple-500"
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
                    className="px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg shadow-md disabled:opacity-75"
                  >
                    {isSubmitting ? 'Salvando...' : 'Confirmar Origem →'}
                  </button>
                </div>
              </>
            )}
          </Form>
        </div>
      </div>
    </div>
  );
}