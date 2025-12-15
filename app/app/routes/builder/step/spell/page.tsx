// routes/builder/step/spells.tsx
import {
  Form,
  useLoaderData,
  useActionData,
  useNavigation,
  redirect,
  useNavigate,
} from 'react-router';
import { getAuthCode, getSession, commitSession } from '~/utils/auth.server';
import { CharacterSheetSchema } from '~/types/builder';
import type { Route } from './+types/page';

export async function loader({ request }: Route.LoaderArgs) {
  const code = await getAuthCode(request);
  if (!code) return redirect('/');

  const session = await getSession(request);
  const savedData = session.get('characterData') ?? {};

  const result = CharacterSheetSchema.safeParse(savedData);
  if (!result.success) {
    console.error('Erro no loader de spells:', result.error.flatten());
    return redirect('/builder/step/equipment');
  }

  return { savedData };
}

export default function SpellsStep() {
  const { savedData } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const navigate = useNavigate();
  const isSubmitting = navigation.state === 'submitting';

  // 🔹 Apenas "Afinidade com Técnica" concede +1 feitiço (p.27)
  const hasAfinidade = savedData.naturalTalent === 'Afinidade com Técnica';

  // 🔹 Quantidade de feitiços BÁSICOS esperados (não inclui Marca Registrada ou Clã)
  const feiticosBasicos = (() => {
    switch (savedData.origin) {
      case 'Inato':
      case 'Herdado':
      case 'Feto Amaldiçoado Híbrido':
      case 'Corpo Amaldiçoado Mutante':
        return 2 + (hasAfinidade ? 1 : 0);
      default:
        return 0;
    }
  })();

  const basicSpells = Array.isArray(savedData.spells) ? savedData.spells : [];
  const feiticosCompletos = basicSpells.length >= feiticosBasicos;

  // 🔹 Extrai dados de originDetails com segurança
  const isInato = savedData.origin === 'Inato';
  const isHerdado = savedData.origin === 'Herdado';

  const trademarkSpell = isInato
    ? (savedData.originDetails as { trademarkSpell?: string })?.trademarkSpell ?? ''
    : '';

  const clanSpell = isHerdado
    ? (savedData.originDetails as { clanSpell?: string })?.clanSpell ?? ''
    : '';

  const trademarkOK = !isInato || !!trademarkSpell;
  const clanOK = !isHerdado || !!clanSpell;

  const isComplete = feiticosCompletos && trademarkOK && clanOK;

  return (
    <div className="min-h-screen bg-gray-900 text-white py-8 px-4 sm:px-6">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-purple-400 mb-2">
            Etapa 7: Técnicas e Feitiços
          </h1>
          <p className="text-gray-400">
            Defina seus feitiços iniciais e revise habilidades únicas (Marca Registrada / Clã).
          </p>
        </div>

        <div className="bg-gray-800 rounded-xl p-6 shadow-lg border border-purple-700/30 space-y-6">
          {/* 🔹 Feitiços Básicos */}
          <div>
            <h3 className="text-lg font-bold mb-3">
              Feitiços Básicos ({basicSpells.length}/{feiticosBasicos})
            </h3>
            {basicSpells.length > 0 ? (
              <ul className="text-sm text-gray-300 space-y-1">
                {basicSpells.map((spell, i) => (
                  <li key={i}>• {spell}</li>
                ))}
              </ul>
            ) : (
              <span className="text-gray-500 text-sm">Aguardando seleção</span>
            )}
            <div className="mt-2">
              <Form method="post" replace>
                <input type="hidden" name="intent" value="select-basic-spells" />
                <button
                  type="submit"
                  className="px-4 py-1 text-sm rounded bg-purple-700 hover:bg-purple-600 text-white"
                >
                  {basicSpells.length > 0 ? 'Alterar' : 'Selecionar Feitiços'}
                </button>
              </Form>
            </div>
            {hasAfinidade && (
              <p className="text-xs text-purple-300 mt-1">
                +1 feitiço pelo talento <strong>Afinidade com Técnica</strong>
              </p>
            )}
          </div>

          {/* 🔹 Marca Registrada (Inato) */}
          {isInato && (
            <div>
              <h3 className="text-lg font-bold mb-3">Marca Registrada (Inato)</h3>
              {trademarkSpell ? (
                <div className="p-2 bg-gray-900/50 rounded">
                  <span className="font-medium">{trademarkSpell}</span>
                  <p className="text-xs text-gray-500 mt-1">
                    Feitiço com custo reduzido em 1 PE (definido na etapa de origem).
                  </p>
                </div>
              ) : (
                <span className="text-red-400 text-sm">⚠️ Não definido — volte à etapa de origem.</span>
              )}
            </div>
          )}

          {/* 🔹 Feitiço do Clã (Herdado) */}
          {isHerdado && (
            <div>
              <h3 className="text-lg font-bold mb-3">Feitiço do Clã (Herdado)</h3>
              {clanSpell ? (
                <div className="p-2 bg-gray-900/50 rounded">
                  <span className="font-medium">{clanSpell}</span>
                  <p className="text-xs text-gray-500 mt-1">
                    Feitiço fixo do seu clã (definido na etapa de origem).
                  </p>
                </div>
              ) : (
                <span className="text-red-400 text-sm">⚠️ Não definido — volte à etapa de origem.</span>
              )}
            </div>
          )}

          {/* 🔹 Habilidades Base */}
          <div>
            <h3 className="text-lg font-bold mb-3">Habilidades Base (Nível 1)</h3>
            {savedData.specializationDetails?.type ? (
              <span className="text-sm text-gray-300">
                • {getHabilidadeBase(savedData.specializationDetails.type)}
              </span>
            ) : (
              <span className="text-gray-500 text-sm">Aguardando especialização</span>
            )}
          </div>

          {/* 🔹 Botão de avançar */}
          <Form method="post" replace>
            <input type="hidden" name="intent" value="confirm-spells" />
            <div className="flex justify-end pt-4">
              <button
                type="submit"
                disabled={!isComplete}
                className={`px-6 py-2 font-medium rounded-lg shadow-md ${
                  isComplete
                    ? 'bg-purple-600 hover:bg-purple-700 text-white'
                    : 'bg-gray-700 text-gray-500 cursor-not-allowed'
                }`}
              >
                {isComplete ? 'Confirmar Feitiços →' : 'Complete todos os itens'}
              </button>
            </div>
          </Form>
        </div>
      </div>
    </div>
  );
}

function getHabilidadeBase(type: string): string {
  const map: Record<string, string> = {
    'Lutador': 'Corpo Treinado + Empolgação',
    'Especialista em Combate': 'Repertório do Especialista + Artes do Combate',
    'Especialista em Técnica': 'Domínio dos Fundamentos + Conjuração Aprimorada',
    'Controlador': 'Treinamento em Controle',
    'Suporte': 'Suporte em Combate',
    'Restringido': 'Restrito pelos Céus',
  };
  return map[type] || '—';
}

export async function action({ request }: Route.ActionArgs) {
  const session = await getSession(request);
  const existing = session.get('characterData') ?? {};
  const intent = (await request.formData()).get('intent');

  if (intent === 'select-basic-spells') return redirect('/builder/step/spell-selection');

  if (intent === 'confirm-spells') {
    const hasAfinidade = existing.naturalTalent === 'Afinidade com Técnica';
    const feiticosBasicos = (() => {
      switch (existing.origin) {
        case 'Inato':
        case 'Herdado':
        case 'Feto Amaldiçoado Híbrido':
        case 'Corpo Amaldiçoado Mutante':
          return 2 + (hasAfinidade ? 1 : 0);
        default:
          return 0;
      }
    })();
    const basicSpells = Array.isArray(existing.spells) ? existing.spells : [];

    if (basicSpells.length < feiticosBasicos) {
      return { error: `Você deve selecionar ${feiticosBasicos} feitiço(s) básico(s).` };
    }

    // Validação final com schema
    const result = CharacterSheetSchema.safeParse(existing);
    if (!result.success) {
      return { error: 'Dados inválidos. Verifique todos os passos.' };
    }

    const updated = { ...result.data, spellsConfirmed: true };
    session.set('characterData', updated);
    const headers = { 'Set-Cookie': await commitSession(session) };
    return redirect('/builder/step/final-details', { headers });
  }

  return { error: 'Ação inválida' };
}