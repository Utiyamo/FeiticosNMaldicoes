// routes/builder/specialization/suporte.tsx
import {
  Form,
  useLoaderData,
  useActionData,
  useNavigation,
  redirect,
  useNavigate,
} from 'react-router';

import { getAuthCode, getSession, commitSession } from '~/utils/auth.server';
import { SpecializationDetailsSchema } from '~/types/builder';
import type { Route } from './+types/suporte';
import { flow, getNextStepId } from '~/types/flow';

// 🔹 Dados fixos (p.102–104)
const ATTR_KEY_OPTIONS = ['pre', 'sab'] as const;
const RESISTANCE_OPTIONS = ['astucia', 'vontade'] as const;
const OFICIO_OPTIONS = [
  'Ofício (Ferreiro)', 'Ofício (Canalizador)', 'Ofício (Costureiro)',
  'Ofício (Serralheiro)', 'Ofício (Alquimista)', 'Ofício (Carpinteiro)'
] as const;
const REQUIRED_SKILLS = ['Medicina', 'Percepção'] as const;
const FREE_SKILL_COUNT = 2;

// 🔹 Lista de perícias (p.285)
const ALL_SKILLS = [
  'Acrobacia', 'Atletismo', 'Atuação', 'Furtividade', 'História', 'Intimidação',
  'Investigação', 'Medicina', 'Natureza', 'Ofício', 'Percepção', 'Persuasão',
  'Prestidigitação', 'Religião', 'Sobrevivência'
] as const;

// ✅ loader
export async function loader({ request }: Route.LoaderArgs) {
  const code = await getAuthCode(request);
  if (!code) return redirect('/');

  const session = await getSession(request);
  const savedData = session.get('characterData') ?? {};

  if (savedData.specialization !== 'Suporte') {
    return redirect('/builder/step/specialization');
  }

  return { savedData };
}

// ✅ action — só 1 parse, com SpecializationDetailsSchema + validação de duplicatas
export async function action({ request }: Route.ActionArgs) {
  const formData = await request.formData();

  const session = await getSession(request);
  const existing = session.get('characterData') ?? {};

  // Coletar freeSkills
  const freeSkills: string[] = [];
  for (let i = 0; i < FREE_SKILL_COUNT; i++) {
    const skill = formData.get(`freeSkill_${i}`);
    if (typeof skill === 'string') freeSkills.push(skill);
  }

  // ✅ VALIDAÇÃO: perícias livres devem ser diferentes entre si
  const hasDupes = new Set(freeSkills).size !== freeSkills.length;
  if (hasDupes) {
    return {
      errors: { freeSkills: ['As 2 perícias livres devem ser diferentes.'] },
      submitted: Object.fromEntries(formData.entries()),
    };
  }

  // ✅ VALIDAÇÃO: não pode repetir craft (sem prefixo), Medicina ou Percepção
  const craft = formData.get('craft') as string;
  const craftBase = craft?.replace('Ofício (', '').replace(')', '') ?? '';
  const forbidden = new Set([craftBase, 'Medicina', 'Percepção']);
  const invalidFree = freeSkills.filter(skill => forbidden.has(skill));

  if (invalidFree.length > 0) {
    return {
      errors: {
        freeSkills: [
          `As perícias livres não podem repetir ${craftBase}, Medicina ou Percepção.`,
        ],
      },
      submitted: Object.fromEntries(formData.entries()),
    };
  }

  // ✅ Só 1 parse com type: 'Suporte'
  const result = SpecializationDetailsSchema.safeParse({
    type: 'Suporte',
    specializationAttr: formData.get('specializationAttr'),
    resistance: formData.get('resistance'),
    craft,
    freeSkills,
  });

  if (!result.success) {
    return {
      errors: result.error.flatten().fieldErrors,
      submitted: Object.fromEntries(formData.entries()),
    };
  }

  const updated = {
    ...existing,
    specializationDetails: result.data, // ✅ inferido como SpecializationDetails
  };

  session.set('characterData', updated);
  const headers = { 'Set-Cookie': await commitSession(session) };

  const nextStepId = getNextStepId("specialization", updated);
    const nextStep = flow.find((s) => s.id === nextStepId);
    if (!nextStep)
      throw new Error(`Próxima etapa '${nextStepId}' não encontrada`);
  
    return redirect(nextStep.path, { headers });
}

// ✅ Componente — nível 1, só o necessário
export default function SuporteDetail() {
  const { savedData } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const navigate = useNavigate();
  const isSubmitting = navigation.state === 'submitting';

  const specializationAttr = savedData.specializationDetails?.specializationAttr ?? 'pre';
  const resistance = savedData.specializationDetails?.resistance ?? 'astucia';
  const craft = savedData.specializationDetails?.craft ?? '';
  const freeSkills = savedData.specializationDetails?.freeSkills ?? [];

  return (
    <div className="min-h-screen bg-gray-900 text-white py-8 px-4 sm:px-6">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-blue-400 mb-2">
            Especialização: <span className="text-blue-300">Suporte</span>
          </h1>
          <p className="text-gray-400">
            Domina a cura e o reforço — protetor, atencioso e capaz de manter seu grupo em pé mesmo nos momentos mais críticos.
          </p>
        </div>

        <div className="bg-gray-800 rounded-xl p-6 shadow-lg border border-blue-700/30">
          <div className="mb-6 p-4 bg-blue-900/20 rounded-lg">
            <h3 className="font-bold text-blue-300 mb-2">Características (p.102)</h3>
            <ul className="list-disc pl-5 space-y-1 text-sm">
              <li><strong>PV inicial:</strong> 10 + mod. CON</li>
              <li><strong>PE inicial:</strong> 5 + mod. PRE/SAB</li>
              <li><strong>Treinamentos:</strong></li>
              <ul className="list-none pl-4 mt-1 space-y-1">
                <li>• <strong>Armas:</strong> Simples</li>
                <li>• <strong>TR:</strong> Astúcia <em>ou</em> Vontade</li>
                <li>• <strong>Perícias:</strong> Ofício, Medicina, Percepção + 2 livres</li>
              </ul>
              <li><strong>Atributo-chave:</strong> Presença <em>ou</em> Sabedoria</li>
              <li><strong>Habilidades Base:</strong> Suporte em Combate (Apoiar como ação bônus, 2 usos de cura)</li>
            </ul>
          </div>

          <Form method="post" className="space-y-8">
            {/* Atributo-chave */}
            <div>
              <h3 className="text-xl font-bold mb-3">Atributo-chave para CD</h3>
              <p className="text-sm text-gray-400 mb-2">
                Escolha o atributo usado para calcular a CD das suas habilidades e PE.
              </p>
              <div className="space-y-2">
                {(['pre', 'sab'] as const).map(attr => {
                  const label = attr === 'pre' ? 'Presença' : 'Sabedoria';
                  return (
                    <label key={attr} className="flex items-center">
                      <input
                        type="radio"
                        name="specializationAttr"
                        value={attr}
                        defaultChecked={specializationAttr === attr}
                        className="mr-2 text-blue-500"
                        required
                      />
                      <span>{label}</span>
                    </label>
                  );
                })}
              </div>
              {actionData?.errors?.specializationAttr && (
                <p className="text-red-400 text-sm mt-1">{actionData.errors.specializationAttr[0]}</p>
              )}
            </div>

            {/* Teste de Resistência */}
            <div>
              <h3 className="text-xl font-bold mb-3">Teste de Resistência</h3>
              <p className="text-sm text-gray-400 mb-2">
                Escolha <strong>um</strong> teste de resistência para ser treinado.
              </p>
              <div className="space-y-2">
                {(['astucia', 'vontade'] as const).map(tr => {
                  const label = tr === 'astucia' ? 'Astúcia' : 'Vontade';
                  return (
                    <label key={tr} className="flex items-center">
                      <input
                        type="radio"
                        name="resistance"
                        value={tr}
                        defaultChecked={resistance === tr}
                        className="mr-2 text-blue-500"
                        required
                      />
                      <span>{label}</span>
                    </label>
                  );
                })}
              </div>
              {actionData?.errors?.resistance && (
                <p className="text-red-400 text-sm mt-1">{actionData.errors.resistance[0]}</p>
              )}
            </div>

            {/* Ofício */}
            <div>
              <h3 className="text-xl font-bold mb-3">Ofício (1)</h3>
              <p className="text-sm text-gray-400 mb-2">
                Escolha uma especialidade de Ofício (p.285).
              </p>
              <select
                name="craft"
                defaultValue={craft}
                className="w-full p-2 bg-gray-700 rounded border border-gray-600"
                required
              >
                <option value="">— Selecione —</option>
                {OFICIO_OPTIONS.map(o => (
                  <option key={o} value={o}>{o}</option>
                ))}
              </select>
              {actionData?.errors?.craft && (
                <p className="text-red-400 text-sm mt-1">{actionData.errors.craft[0]}</p>
              )}
            </div>

            {/* Perícias Fixas */}
            <div>
              <h3 className="text-xl font-bold mb-3">Perícias Fixas</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {REQUIRED_SKILLS.map(skill => (
                  <div key={skill} className="p-3 bg-gray-700/50 rounded">
                    <span className="font-medium">{skill}</span>
                    <span className="text-xs text-gray-400 block">→ Treinado automaticamente</span>
                  </div>
                ))}
              </div>
            </div>

            {/* 2 Perícias Livres */}
            <div>
              <h3 className="text-xl font-bold mb-3">2 Perícias Livres</h3>
              <p className="text-sm text-gray-400 mb-2">
                Escolha <strong>2 perícias diferentes</strong>, exceto Ofício, Medicina e Percepção.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {Array.from({ length: FREE_SKILL_COUNT }).map((_, i) => (
                  <select
                    key={i}
                    name={`freeSkill_${i}`}
                    defaultValue={freeSkills[i] || ''}
                    className="w-full p-2 bg-gray-700 rounded border border-gray-600"
                    required
                  >
                    <option value="">— Selecione —</option>
                    {ALL_SKILLS.map(skill => (
                      <option key={skill} value={skill}>
                        {skill}
                      </option>
                    ))}
                  </select>
                ))}
              </div>
              {actionData?.errors?.freeSkills && (
                <p className="text-red-400 text-sm mt-1">{actionData.errors.freeSkills[0]}</p>
              )}
            </div>

            <div className="flex justify-between pt-6">
              <button
                type="button"
                onClick={() => navigate('/builder/step/specialization')}
                className="px-4 py-2 text-gray-400 hover:text-white transition"
              >
                ← Voltar
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg shadow-md disabled:opacity-75"
              >
                {isSubmitting ? 'Salvando...' : 'Confirmar Suporte →'}
              </button>
            </div>
          </Form>
        </div>
      </div>
    </div>
  );
}