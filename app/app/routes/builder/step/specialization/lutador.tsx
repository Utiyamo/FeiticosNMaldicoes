// routes/builder/specialization/lutador.tsx
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
import type { Route } from './+types/lutador';

// 🔹 Dados fixos (p.47–52)
const ATTR_KEY_OPTIONS = ['for', 'des'] as const;
const RESISTANCE_OPTIONS = ['fortitude', 'reflexos'] as const;
const COMBAT_SKILL_OPTIONS = ['Atletismo', 'Acrobacia'] as const;
const FREE_SKILL_COUNT = 3;

// 🔹 Lista completa de perícias (p.285)
const ALL_SKILLS = [
  'Acrobacia', 'Atletismo', 'Atuação', 'Furtividade', 'História', 'Intimidação', 'Investigação',
  'Medicina', 'Natureza', 'Ofício', 'Percepção', 'Persuasão', 'Prestidigitação', 'Religião',
  'Sobrevivência'
] as const;

// 🔹 Schema (nível 1)
const LutadorSchema = z.object({
  specializationAttr: z.enum(ATTR_KEY_OPTIONS),
  resistance: z.enum(RESISTANCE_OPTIONS),
  combatSkill: z.enum(COMBAT_SKILL_OPTIONS),
  freeSkills: z.array(z.enum(ALL_SKILLS)).length(FREE_SKILL_COUNT),
});

// ✅ loader
export async function loader({ request }: Route.LoaderArgs) {
  const code = await getAuthCode(request);
  if (!code) return redirect('/');

  const session = await getSession(request);
  const savedData = session.get('characterData') ?? {};

  if (savedData.specialization !== 'Lutador') {
    return redirect('/builder/step/specialization');
  }

  return { savedData };
}

// ✅ action
export async function action({ request }: Route.ActionArgs) {
  const formData = await request.formData();

  const session = await getSession(request);
  const existing = session.get('characterData') ?? {};

  // Coletar freeSkills como array
  const freeSkills: string[] = [];
  for (let i = 0; i < FREE_SKILL_COUNT; i++) {
    const skill = formData.get(`freeSkill_${i}`);
    if (typeof skill === 'string') freeSkills.push(skill);
  }

  const result = LutadorSchema.safeParse({
    specializationAttr: formData.get('specializationAttr'),
    resistance: formData.get('resistance'),
    combatSkill: formData.get('combatSkill'),
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
    specializationDetails: {
      type: 'Lutador',
      specializationAttr: result.data.specializationAttr,
      resistance: result.data.resistance,
      combatSkill: result.data.combatSkill,
      freeSkills: result.data.freeSkills,
    },
  };

  session.set('characterData', updated);
  const headers = { 'Set-Cookie': await commitSession(session) };

  return redirect('/builder/step/equipment', { headers });
}

// ✅ Componente — nível 1, só o necessário
export default function LutadorDetail() {
  const { savedData } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const navigate = useNavigate();
  const isSubmitting = navigation.state === 'submitting';

  const specializationAttr = savedData.specializationDetails?.specializationAttr ?? 'for';
  const resistance = savedData.specializationDetails?.resistance ?? 'fortitude';
  const combatSkill = savedData.specializationDetails?.combatSkill ?? 'Atletismo';
  const freeSkills = savedData.specializationDetails?.freeSkills ?? [];

  return (
    <div className="min-h-screen bg-gray-900 text-white py-8 px-4 sm:px-6">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-red-400 mb-2">
            Especialização: <span className="text-red-300">Lutador</span>
          </h1>
          <p className="text-gray-400">
            Especialista no combate físico — resistente, móvel e potente.
          </p>
        </div>

        <div className="bg-gray-800 rounded-xl p-6 shadow-lg border border-red-700/30">
          <div className="mb-6 p-4 bg-red-900/20 rounded-lg">
            <h3 className="font-bold text-red-300 mb-2">Características (p.48)</h3>
            <ul className="list-disc pl-5 space-y-1 text-sm">
              <li><strong>PV inicial:</strong> 12 + mod. CON</li>
              <li><strong>PE inicial:</strong> 4</li>
              <li><strong>Treinamentos:</strong></li>
              <ul className="list-none pl-4 mt-1 space-y-1">
                <li>• <strong>Armas:</strong> Simples, Marciais, Escudo Leve</li>
                <li>• <strong>TR:</strong> Fortitude <em>ou</em> Reflexos</li>
                <li>• <strong>Perícias:</strong> Ofício + (Atletismo <em>ou</em> Acrobacia) + 3 livres</li>
              </ul>
              <li><strong>Atributo-chave:</strong> Força <em>ou</em> Destreza (CD de habilidades)</li>
              <li><strong>Habilidades Base:</strong> Corpo Treinado, Empolgação</li>
            </ul>
          </div>

          <Form method="post" className="space-y-8">
            {/* Atributo-chave */}
            <div>
              <h3 className="text-xl font-bold mb-3">Atributo-chave para CD</h3>
              <p className="text-sm text-gray-400 mb-2">
                Escolha o atributo usado para calcular a CD das suas habilidades.
              </p>
              <div className="space-y-2">
                {(['for', 'des'] as const).map(attr => {
                  const label = attr === 'for' ? 'Força' : 'Destreza';
                  return (
                    <label key={attr} className="flex items-center">
                      <input
                        type="radio"
                        name="specializationAttr"
                        value={attr}
                        defaultChecked={specializationAttr === attr}
                        className="mr-2 text-red-500"
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
                {(['fortitude', 'reflexos'] as const).map(tr => {
                  const label = tr === 'fortitude' ? 'Fortitude' : 'Reflexos';
                  return (
                    <label key={tr} className="flex items-center">
                      <input
                        type="radio"
                        name="resistance"
                        value={tr}
                        defaultChecked={resistance === tr}
                        className="mr-2 text-red-500"
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

            {/* Perícia de Combate */}
            <div>
              <h3 className="text-xl font-bold mb-3">Perícia de Combate</h3>
              <p className="text-sm text-gray-400 mb-2">
                Escolha <strong>uma</strong> perícia para combate corpo a corpo.
              </p>
              <div className="space-y-2">
                {(['Atletismo', 'Acrobacia'] as const).map(skill => (
                  <label key={skill} className="flex items-center">
                    <input
                      type="radio"
                      name="combatSkill"
                      value={skill}
                      defaultChecked={combatSkill === skill}
                      className="mr-2 text-red-500"
                      required
                    />
                    <span>{skill}</span>
                  </label>
                ))}
              </div>
              {actionData?.errors?.combatSkill && (
                <p className="text-red-400 text-sm mt-1">{actionData.errors.combatSkill[0]}</p>
              )}
            </div>

            {/* 3 Perícias Livres */}
            <div>
              <h3 className="text-xl font-bold mb-3">3 Perícias Livres</h3>
              <p className="text-sm text-gray-400 mb-2">
                Escolha <strong>3 perícias diferentes</strong> (excluindo Feitiçaria).
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
                className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg shadow-md disabled:opacity-75"
              >
                {isSubmitting ? 'Salvando...' : 'Confirmar Lutador →'}
              </button>
            </div>
          </Form>
        </div>
      </div>
    </div>
  );
}