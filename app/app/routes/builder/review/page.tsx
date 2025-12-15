// routes/builder/review.tsx
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

// 🔹 Helper: retorna cor por origem
function getOriginColorClass(origin: string): string {
  const map: Record<string, string> = {
    'Inato': 'text-amber-400 border-amber-700/50 bg-amber-900/10',
    'Herdado': 'text-purple-400 border-purple-700/50 bg-purple-900/10',
    'Sem-Técnica': 'text-gray-400 border-gray-700/50 bg-gray-800/30',
    'Derivado': 'text-blue-400 border-blue-700/50 bg-blue-900/10',
    'Feto Amaldiçoado Híbrido': 'text-emerald-400 border-emerald-700/50 bg-emerald-900/10',
    'Corpo Amaldiçoado Mutante': 'text-teal-400 border-teal-700/50 bg-teal-900/10',
    'Restringido': 'text-slate-400 border-slate-700/50 bg-slate-900/20',
  };
  return map[origin] || 'text-cyan-400 border-cyan-700/50 bg-cyan-900/10';
}

// 🔹 Helper: formata atributos
function formatAttributes(attrs?: Record<string, number>) {
  if (!attrs) return '—';
  const map: Record<string, string> = {
    for: 'FOR', des: 'DES', con: 'CON', int: 'INT', sab: 'SAB', pre: 'PRE'
  };
  return Object.entries(attrs)
    .map(([k, v]) => `${map[k] || k.toUpperCase()}: ${v}`)
    .join(' | ');
}

// 🔹 Helper: formata lista
const fmtList = (arr?: string[]) => arr && arr.length ? arr.join(', ') : '—';

export async function loader({ request }: Route.LoaderArgs) {
  const code = await getAuthCode(request);
  if (!code) return redirect('/');

  const session = await getSession(request);
  const savedData = session.get('characterData') ?? {};

  const result = CharacterSheetSchema.safeParse(savedData);
  if (!result.success) {
    console.error('Ficha inválida na revisão:', result.error.flatten());
    return redirect('/builder/step/base');
  }

  return { savedData: result.data };
}

export async function action({ request }: Route.ActionArgs) {
  const formData = await request.formData();
  const intent = formData.get('intent');

  if (intent === 'print') {
    return { success: true };
  }

  if (intent === 'restart') {
    const session = await getSession(request);
    session.set('characterData', {});
    const headers = { 'Set-Cookie': await commitSession(session) };
    return redirect('/builder/step/base', { headers });
  }

  return { error: 'Ação inválida' };
}

export default function ReviewStep() {
  const { savedData } = useLoaderData<typeof loader>();
  const navigate = useNavigate();

if(savedData.origin === undefined) {
  navigate('/builder/step/origin');
}

  const originColor = getOriginColorClass(savedData.origin);
  const spells = Array.isArray(savedData.spells) ? savedData.spells : [];
  const isHerdado = savedData.origin === 'Herdado';
  const isFeto = savedData.origin === 'ObjetoAmaldicoado';
  const isCorpo = savedData.origin === 'Corpo Amaldiçoado Mutante';
  const isSemTecnica = savedData.origin === 'Sem-Técnica';
  const isRestringido = savedData.origin === 'Restringido';

  // 🔹 Extração segura de dados
  const od = savedData.originDetails || {};
  const sd = savedData.specializationDetails || {};

  return (
    <div className="min-h-screen bg-gray-900 text-white py-6 px-4 sm:px-6">
      <div className="max-w-6xl mx-auto">
        {/* 🔹 Cabeçalho */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-cyan-300 mb-2">Ficha Completa — Nível 1</h1>
          <p className="text-gray-400">Todos os dados coletados durante a criação do personagem.</p>
        </div>

        <div className="space-y-8">
          {/* 🔸 1. Dados Básicos */}
          <section className="bg-gray-800 rounded-xl p-5 border border-cyan-800/30">
            <h2 className="text-xl font-bold text-cyan-400 mb-3 flex items-center">
              <span>👤</span> <span className="ml-2">Dados Básicos</span>
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
              <div><strong>Jogador:</strong> {savedData.playerName || '—'}</div>
              <div><strong>Personagem:</strong> {savedData.characterName || '—'}</div>
              <div><strong>Idade:</strong> {savedData.appearance?.age || '—'}</div>
              <div><strong>Altura / Peso:</strong> {savedData.appearance?.height || '—'} / {savedData.appearance?.weight || '—'}</div>
            </div>
          </section>

          {/* 🔸 2. Aspectos Pessoais */}
          <section className="bg-gray-800 rounded-xl p-5 border border-cyan-800/30">
            <h2 className="text-xl font-bold text-cyan-400 mb-3 flex items-center">
              <span>🧠</span> <span className="ml-2">Aspectos Pessoais</span>
            </h2>
            <div className="text-sm space-y-1">
              <div><strong>Traços:</strong> {fmtList(savedData.personalityTraits)}</div>
              <div><strong>Ideais:</strong> {fmtList(savedData.ideals)}</div>
              <div><strong>Ligações:</strong> {fmtList(savedData.bonds)}</div>
              <div><strong>Complicações:</strong> {fmtList(savedData.complications)}</div>
            </div>
          </section>

          {/* 🔸 3. Atributos */}
          <section className="bg-gray-800 rounded-xl p-5 border border-cyan-800/30">
            <h2 className="text-xl font-bold text-cyan-400 mb-3 flex items-center">
              <span>📈</span> <span className="ml-2">Atributos</span>
            </h2>
            <div className="text-sm">
              <div><strong>Método:</strong> {savedData.attributeMethod || '—'}</div>
              <div><strong>Valores:</strong> {formatAttributes(savedData.attributes)}</div>
              {savedData.bonusAttr1 && (
                <div><strong>Bônus Inato:</strong> +2 em {savedData.bonusAttr1.toUpperCase()}
                  {savedData.bonusAttr2 && ` e +1 em ${savedData.bonusAttr2.toUpperCase()}`}
                </div>
              )}
            </div>
          </section>

          {/* 🔸 4. Origem */}
          <section className="bg-gray-800 rounded-xl p-5 border border-cyan-800/30">
            <h2 className="text-xl font-bold text-cyan-400 mb-3 flex items-center">
              <span>🌀</span> <span className="ml-2">Origem: {savedData.origin}</span>
            </h2>
            <div className={`p-4 rounded-lg border ${originColor}`}>
              {/* Inato */}
              {savedData.origin === 'Inato' && (
                <>
                  <div><strong>Marca Registrada:</strong> {od.trademarkSpell || '—'}</div>
                  <div><strong>Técnica:</strong> {savedData.originDetails?.techniqueName || '—'}</div>
                </>
              )}

              {/* Herdado */}
              {isHerdado && (
                <>
                  <div><strong>Clã:</strong> {od.clan || '—'}</div>
                  <div><strong>Feitiço do Clã:</strong> {od.clanSpell || '—'}</div>
                  <div><strong>Técnica:</strong> {savedData.originDetails?.techniqueName || '—'}</div>
                </>
              )}

              {/* Feto Amaldiçoado Híbrido */}
              {isFeto && (
                <>
                  <div><strong>Nome da Maldição:</strong> {od.maldictionName || '—'}</div>
                  <div><strong>Grau:</strong> {od.maldictionGrade || '1'}</div>
                  <div><strong>Anatomia:</strong> {savedData.originDetails?.anatomia || '—'}</div>
                  <div><strong>Técnica:</strong> {savedData.originDetails?.techniqueName || '—'}</div>
                </>
              )}

              {/* Corpo Amaldiçoado Mutante */}
              {isCorpo && (
                <>
                  <div><strong>Núcleo Primário:</strong> {od.primaryCore || '—'}</div>
                  <div><strong>Nome do Núcleo:</strong> {od.coreName || '—'}</div>
                  <div><strong>Núcleos:</strong> {savedData.originDetails?.nucleo1}, {savedData.originDetails?.nucleo2}, {savedData.originDetails?.nucleo3}</div>
                  <div><strong>Técnica:</strong> {savedData.originDetails?.techniqueName || '—'}</div>
                </>
              )}

              {/* Sem-Técnica */}
              {isSemTecnica && (
                <div><strong>Voto:</strong> {savedData.originDetails?.vow || '—'}</div>
              )}

              {/* Derivado */}
              {savedData.origin === 'Derivado' && (
                <>
                  <div><strong>Técnica de Origem:</strong> {od.sourceTechnique || '—'}</div>
                  <div><strong>Adaptação:</strong> {od.adaptation || '—'}</div>
                  <div><strong>Técnica:</strong> {savedData.originDetails?.techniqueName || '—'}</div>
                </>
              )}

              {/* Restringido */}
              {isRestringido && (
                <div><strong>Especialização vinculada:</strong> Restringido</div>
              )}
            </div>
          </section>

          {/* 🔸 5. Talentos */}
          <section className="bg-gray-800 rounded-xl p-5 border border-cyan-800/30">
            <h2 className="text-xl font-bold text-cyan-400 mb-3 flex items-center">
              <span>✨</span> <span className="ml-2">Talentos</span>
            </h2>
            <div className="text-sm">
              <div><strong>Nível 1:</strong> {savedData.talents?.level1 || '—'}</div>
              <div><strong>Nível 5:</strong> {savedData.talents?.level5 || '—'}</div>
              <div><strong>Talento Natural:</strong> {savedData.naturalTalent || '—'}</div>
            </div>
          </section>

          {/* 🔸 6. Especialização */}
          <section className="bg-gray-800 rounded-xl p-5 border border-cyan-800/30">
            <h2 className="text-xl font-bold text-cyan-400 mb-3 flex items-center">
              <span>🎯</span> <span className="ml-2">Especialização: {sd.type || savedData.specialization || '—'}</span>
            </h2>
            {sd.type && (
              <div className="text-sm space-y-1">
                <div><strong>Atributo-chave:</strong> {sd.specializationAttr?.toUpperCase() || '—'}</div>
                <div><strong>Resistência:</strong> {sd.resistance || '—'}</div>
                {sd.combatSkill && <div><strong>Habilidade de Combate:</strong> {sd.combatSkill}</div>}
                {sd.oficio1 && <div><strong>Ofícios:</strong> {sd.oficio1}{sd.oficio2 && `, ${sd.oficio2}`}</div>}
                {sd.craft && <div><strong>Ofício:</strong> {sd.craft}</div>}
                {sd.foundationChanges && <div><strong>Alterações de Fundamento:</strong> {fmtList(sd.foundationChanges)}</div>}
                <div><strong>Armas:</strong> {fmtList(sd.weaponsProficiencies)}</div>
                <div><strong>Perícias Livres:</strong> {fmtList(sd.freeSkills)}</div>
              </div>
            )}
          </section>

          {/* 🔸 7. Equipamentos */}
          <section className="bg-gray-800 rounded-xl p-5 border border-cyan-800/30">
            <h2 className="text-xl font-bold text-cyan-400 mb-3 flex items-center">
              <span>🛡️</span> <span className="ml-2">Equipamentos</span>
            </h2>
            <div className="text-sm space-y-1">
              <div><strong>Arma 1:</strong> {savedData.selectedWeapon1 || '—'}</div>
              <div><strong>Arma 2:</strong> {savedData.selectedWeapon2 || '—'}</div>
              <div><strong>Escudo:</strong> {savedData.selectedShield || '—'}</div>
              <div><strong>Uniforme:</strong> {savedData.selectedUniform || '—'}</div>
              <div><strong>Kit de Ofício:</strong> {savedData.selectedToolkit || '—'}</div>
              <div><strong>Seleção de Ofício:</strong> {savedData.craftSelection || '—'}</div>
            </div>
          </section>

          {/* 🔸 8. Feitiços */}
          {spells.length > 0 || od.trademarkSpell || od.clanSpell && (
            <section className="bg-gray-800 rounded-xl p-5 border border-cyan-800/30">
              <h2 className="text-xl font-bold text-cyan-400 mb-3 flex items-center">
                <span>🌀</span> <span className="ml-2">Feitiços</span>
              </h2>
              <div className="space-y-2">
                {spells.map((s, i) => <div key={i} className="p-1 pl-3 bg-gray-900/30 rounded">• {s}</div>)}
                {od.trademarkSpell && (
                  <div className="p-1 pl-3 bg-amber-900/20 rounded">✓ Marca Registrada: <em>{od.trademarkSpell}</em></div>
                )}
                {od.clanSpell && (
                  <div className="p-1 pl-3 bg-purple-900/20 rounded">✓ Feitiço do Clã: <em>{od.clanSpell}</em></div>
                )}
              </div>
            </section>
          )}

          {/* 🔸 9. Detalhes Finais */}
          <section className="bg-gray-800 rounded-xl p-5 border border-cyan-800/30">
            <h2 className="text-xl font-bold text-cyan-400 mb-3 flex items-center">
              <span>📜</span> <span className="ml-2">Detalhes Finais</span>
            </h2>
            <div className="text-sm space-y-1">
              <div><strong>Domínio Interior:</strong> {savedData.innerDomain || '—'}</div>
              <div><strong>Presença:</strong> {savedData.appearance?.presenceNote || '—'}</div>
              <div><strong>Voz:</strong> {savedData.appearance?.voiceDescription || '—'}</div>
              <div><strong>Expressão habitual:</strong> {savedData.appearance?.usualExpression || '—'}</div>
            </div>
          </section>

          {/* 🔸 10. Aparência */}
          <section className="bg-gray-800 rounded-xl p-5 border border-cyan-800/30">
            <h2 className="text-xl font-bold text-cyan-400 mb-3 flex items-center">
              <span>🖼️</span> <span className="ml-2">Aparência</span>
            </h2>
            <div className="text-sm space-y-1">
              <div><strong>Cabelo:</strong> {savedData.appearance?.hairColor || '—'}</div>
              <div><strong>Olhos:</strong> {savedData.appearance?.eyeColor || '—'}</div>
              <div><strong>Tom de pele:</strong> {savedData.appearance?.skinTone || '—'}</div>
              <div><strong>Traços distintivos:</strong> {savedData.appearance?.distinctiveFeatures || '—'}</div>
              <div><strong>Uniforme preferido:</strong> {savedData.appearance?.uniformPreference || savedData.selectedUniform || '—'}</div>
            </div>
          </section>
        </div>

        {/* 🔹 Ações */}
        <div className="mt-8 flex flex-col sm:flex-row justify-between gap-4">
          <button
            type="button"
            onClick={() => navigate('/builder/step/appearance')}
            className="px-5 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg"
          >
            ← Editar Aparência
          </button>

          <div className="flex gap-3">
            <Form method="post">
              <input type="hidden" name="intent" value="print" />
              <button
                type="button"
                onClick={() => window.print()}
                className="px-5 py-2 bg-cyan-700 hover:bg-cyan-600 text-white rounded-lg flex items-center"
              >
                <span>🖨️</span> <span className="ml-1">Imprimir Ficha</span>
              </button>
            </Form>

            <Form method="post">
              <input type="hidden" name="intent" value="restart" />
              <button
                type="submit"
                className="px-5 py-2 bg-red-700 hover:bg-red-600 text-white rounded-lg"
              >
                Recomeçar
              </button>
            </Form>
          </div>
        </div>
      </div>

      {/* 🔹 Estilos para impressão */}
      <style jsx>{`
        @media print {
          body {
            background: white;
            color: black;
            -webkit-print-color-adjust: exact;
          }
          .min-h-screen, .bg-gray-900, .shadow-lg, .rounded-xl {
            background: white !important;
            color: black !important;
            box-shadow: none !important;
            border-radius: 0 !important;
          }
          button, .no-print {
            display: none !important;
          }
          section {
            break-inside: avoid;
            page-break-inside: avoid;
          }
          h1, h2 {
            color: #1f2937;
          }
          @page {
            margin: 1.5cm;
          }
        }
      `}</style>
    </div>
  );
}