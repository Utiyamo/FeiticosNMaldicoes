// routes/builder/step/spell-selection.tsx
import {
  Form,
  useLoaderData,
  useActionData,
  useNavigation,
  redirect,
  useNavigate,
} from 'react-router';
import { getAuthCode, getSession, commitSession } from '~/utils/auth.server';
import type { Route } from './+types/spellselection';

// 🔹 Feitiços liberados no NV1 (nível 0 e 1, sem pré-requisito)
const SPELLS = [
  { name: 'Golpe de Energia', type: 'Dano', level: 0, cost: 0, desc: '+1d4 dano em ataque desarmado ou corpo a corpo' },
  { name: 'Escudo de Energia', type: 'Defesa', level: 0, cost: 0, desc: 'RD 2 por 1 rodada (ação bônus)' },
  { name: 'Detectar Maldição', type: 'Utilitário', level: 0, cost: 0, desc: 'Percepção +2 vs. energia amaldiçoada por 1 minuto' },
  { name: 'Foco Amaldiçoado', type: 'Auxiliar', level: 0, cost: 0, desc: '+1d4 em rolagem de perícia (1x/descanso)' },
  { name: 'Reflexo Instintivo', type: 'Auxiliar', level: 1, cost: 2, desc: '+2 em TR Reflexos por 1 rodada (reação)' },
  { name: 'Carga Explosiva', type: 'Dano', level: 1, cost: 3, desc: '+2d6 dano em golpe corpo a corpo; empurra 1,5m' },
  { name: 'Aura de Pressão', type: 'Auxiliar', level: 1, cost: 2, desc: 'Aliados em 3m recebem +1 em ataques por 1 rodada' },
  { name: 'Rajada de Choque', type: 'Dano', level: 1, cost: 3, desc: 'Arma causa +1d8 dano elétrico em alvo + adjacente' },
  { name: 'Barreira Momentânea', type: 'Defesa', level: 1, cost: 3, desc: 'RD 2 por 1 rodada (ação bônus)' },
  { name: 'Concentração Afiada', type: 'Passivo', level: 1, cost: -2, desc: '+1 em ataques e CD de feitiços (custo fixo)' },
  { name: 'Soco Perfurante', type: 'Dano', level: 1, cost: 2, desc: 'Ataque desarmado ignora RD 2' },
] as const;

export async function loader({ request }: Route.LoaderArgs) {
  const code = await getAuthCode(request);
  if (!code) return redirect('/');

  const session = await getSession(request);
  const savedData = session.get('characterData') ?? {};

  // ✅ Só estas origens têm acesso a feitiços no nível 1 (p.27,30,34,39)
  const hasSpells = [
    'Inato',
    'Herdado',
    'Feto Amaldiçoado Híbrido',
    'Corpo Amaldiçoado Mutante',
  ].includes(savedData.origin);

  if (!hasSpells) {
    return redirect('/builder/step/spells');
  }

  return { savedData };
}

export default function SpellSelection() {
  const { savedData } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const navigate = useNavigate();
  const isSubmitting = navigation.state === 'submitting';

  const selectedSpells = Array.isArray(savedData.spells) ? savedData.spells : [];
  const hasAfinidade = savedData.naturalTalent === 'Afinidade com Técnica';
  const maxSpells = 2 + (hasAfinidade ? 1 : 0); // ✅ único talento que concede +1 feitiço (p.27)

  return (
    <div className="min-h-screen bg-gray-900 text-white py-8 px-4 sm:px-6">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-purple-400 mb-2">
            Seleção de Feitiços Iniciais
          </h1>
          <p className="text-gray-400">
            Escolha <strong>{maxSpells} feitiço(s)</strong> de nível 0 ou 1.
            Você já tem {selectedSpells.length}/{maxSpells}.
          </p>
          {hasAfinidade && (
            <p className="text-sm text-purple-300 mt-1">
              +1 feitiço pelo talento <strong>Afinidade com Técnica</strong>
            </p>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-800">
              <tr>
                <th className="py-2 px-3 text-left">Nome</th>
                <th className="py-2 px-3 text-center">Tipo</th>
                <th className="py-2 px-3 text-center">Nível</th>
                <th className="py-2 px-3 text-center">Custo</th>
                <th className="py-2 px-3 text-left">Efeito</th>
                <th className="py-2 px-3 w-24"></th>
              </tr>
            </thead>
            <tbody>
              {SPELLS.map((spell) => {
                const isSelected = selectedSpells.includes(spell.name);
                return (
                  <tr
                    key={spell.name}
                    className="border-b border-gray-800 hover:bg-gray-850/30"
                  >
                    <td className="py-2 px-3 font-medium">{spell.name}</td>
                    <td className="py-2 px-3 text-center">{spell.type}</td>
                    <td className="py-2 px-3 text-center">{spell.level}</td>
                    <td className="py-2 px-3 text-center">
                      {spell.cost >= 0 ? `${spell.cost} PE` : 'Fixo'}
                    </td>
                    <td className="py-2 px-3 text-gray-300 text-sm">{spell.desc}</td>
                    <td className="py-2 px-3 text-center">
                      <Form method="post" replace>
                        <input type="hidden" name="spell" value={spell.name} />
                        <input
                          type="hidden"
                          name="intent"
                          value={isSelected ? 'remove-spell' : 'add-spell'}
                        />
                        <button
                          type="submit"
                          disabled={isSelected ? false : selectedSpells.length >= maxSpells}
                          className={`px-3 py-1 rounded text-sm ${
                            isSelected
                              ? 'bg-purple-700 text-white'
                              : 'text-purple-500 hover:text-purple-400'
                          }`}
                        >
                          {isSelected ? '✓' : 'Selecionar'}
                        </button>
                      </Form>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="flex justify-between pt-6">
          <button
            type="button"
            onClick={() => navigate('/builder/step/spells')}
            className="px-4 py-2 text-gray-400 hover:text-white transition"
          >
            ← Voltar
          </button>

          <Form method="post" replace>
            <input type="hidden" name="intent" value="confirm-spells" />
            <button
              type="submit"
              disabled={selectedSpells.length !== maxSpells}
              className={`px-6 py-2 font-medium rounded-lg shadow-md ${
                selectedSpells.length === maxSpells
                  ? 'bg-purple-600 hover:bg-purple-700 text-white'
                  : 'bg-gray-700 text-gray-500 cursor-not-allowed'
              }`}
            >
              Confirmar Feitiços →
            </button>
          </Form>
        </div>
      </div>
    </div>
  );
}

// ✅ action — só gerencia a seleção (persistência), sem validação de regras
export async function action({ request }: Route.ActionArgs) {
  const formData = await request.formData();
  const session = await getSession(request);
  const existing = session.get('characterData') ?? {};
  const intent = formData.get('intent');

  const current = Array.isArray(existing.spells) ? existing.spells : [];
  const hasAfinidade = existing.naturalTalent === 'Afinidade com Técnica';
  const maxSpells = 2 + (hasAfinidade ? 1 : 0);

  let updatedSpells = [...current];

  if (intent === 'add-spell' || intent === 'remove-spell') {
    const spell = formData.get('spell');
    if (typeof spell !== 'string' || !SPELLS.some(s => s.name === spell)) {
      return { error: 'Feitiço inválido' };
    }

    if (intent === 'add-spell' && updatedSpells.length < maxSpells && !updatedSpells.includes(spell)) {
      updatedSpells.push(spell);
    } else if (intent === 'remove-spell' && updatedSpells.includes(spell)) {
      updatedSpells = updatedSpells.filter(s => s !== spell);
    }

    const updated = { ...existing, spells: updatedSpells };
    session.set('characterData', updated);
    const headers = { 'Set-Cookie': await commitSession(session) };
    return redirect('/builder/step/spell-selection', { headers });
  }

  if (intent === 'confirm-spells') {
    // ✅ Apenas persiste — validação real será em /step/spells
    const updated = { ...existing, spells: updatedSpells };
    session.set('characterData', updated);
    const headers = { 'Set-Cookie': await commitSession(session) };
    return redirect('/builder/step/spells', { headers });
  }

  return { error: 'Ação inválida' };
}