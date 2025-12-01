// routes/builder/origin/objetoamaldicoado.tsx
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
import type { Route } from './+types/objetoamaldicoado';

// 🔹 Encantamentos válidos (p.156–160)
const VALID_ENCHANTMENTS = [
  'Afiada', 'Avassalador', 'Distorcivo', 'Escaldante', 'Explosivo', 'Fatiante',
  'Gélido', 'Ignição', 'Impacto', 'Inflamável', 'Perfuração', 'Precisa',
  'Ressonante', 'Sísmica', 'Veneno', 'Vibrante',
] as const;

// 🔹 Schema correto (p.21)
const ObjetoAmaldiçoadoSchema = z.object({
  origin: z.literal('Objeto Amaldiçoado'), // ✅ nome exato do livro
  bonusAttr: z.enum(['con', 'pre']),
  innateEnchantment: z.enum(VALID_ENCHANTMENTS), // ✅ só opções válidas
});

// ✅ loader
export async function loader({ request }: Route.LoaderArgs) {
  const code = await getAuthCode(request);
  if (!code) return redirect('/');

  const session = await getSession(request);
  const savedData = session.get('characterData') ?? {};

  // ✅ Correção: 'Objeto Amaldiçoado' (com acento e espaço)
  if (savedData.origin !== 'ObjetoAmaldicoado') {
    return redirect('/builder/step/origin');
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

  const result = ObjetoAmaldiçoadoSchema.safeParse({
    origin: 'Objeto Amaldiçoado',
    bonusAttr: formData.get('bonusAttr'),
    innateEnchantment: formData.get('innateEnchantment'),
  });

  if (!result.success) {
    return {
      errors: result.error.flatten().fieldErrors,
      submitted: Object.fromEntries(formData.entries()),
    };
  }

  updated = { ...updated, ...result.data };
  session.set('characterData', updated);
  const headers = { 'Set-Cookie': await commitSession(session) };

  const nextStepId = getNextStepId('origin', updated);
  const nextStep = flow.find(s => s.id === nextStepId);
  if (!nextStep) throw new Error(`Próxima etapa '${nextStepId}' não encontrada`);
  return redirect(nextStep.path, { headers });
}

// ✅ Componente — mínimo, fiel, funcional
export default function ObjetoAmaldiçoadoOrigin() {
  const { savedData } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const navigate = useNavigate();
  const isSubmitting = navigation.state === 'submitting';

  const bonusAttr = savedData.bonusAttr ?? 'con';
  const innateEnchantment = savedData.innateEnchantment ?? '';

  return (
    <div className="min-h-screen bg-gray-900 text-white py-8 px-4 sm:px-6">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-rose-400 mb-2">
            Origem: <span className="text-rose-300">Objeto Amaldiçoado</span>
          </h1>
          <p className="text-gray-400">
            Você é um objeto amaldiçoado que ganhou consciência e forma humana — uma relíquia ancestral com poder latente e ligação indissolúvel com sua essência original.
          </p>
        </div>

        <div className="bg-gray-800 rounded-xl p-6 shadow-lg border border-rose-700/30">
          <div className="mb-6 p-4 bg-rose-900/20 rounded-lg border border-rose-800">
            <h3 className="font-bold text-rose-300 mb-2">Benefícios da Origem Objeto Amaldiçoado</h3>
            <ul className="list-disc pl-5 space-y-1 text-sm">
              <li><strong>Bônus em Atributo:</strong> +2 em Constituição ou Presença</li>
              <li><strong>Resistência Objetiva:</strong> +2 RD contra dano físico</li>
              <li><strong>Encantamento Inato:</strong> comece com 1 Encantamento de Ferramenta (p.156)</li>
            </ul>
            <p className="text-xs text-rose-200 mt-3">
              (Livro de Regras, p.21 — benefícios automáticos no nível 1)
            </p>
          </div>

          <Form method="post" className="space-y-8">
            <input type="hidden" name="intent" value="submit" />

            {/* BÔNUS DE ATRIBUTO */}
            <div>
              <h3 className="text-xl font-bold mb-4">Bônus em Atributo (+2)</h3>
              <p className="text-sm text-gray-400 mb-3">
                Escolha entre <strong>Constituição</strong> (resiliência) ou <strong>Presença</strong> (força espiritual).
              </p>
              <div className="space-y-3">
                {(['con', 'pre'] as const).map(attr => {
                  const isChecked = bonusAttr === attr;
                  return (
                    <label
                      key={attr}
                      className={`flex items-start p-4 rounded-lg border-2 cursor-pointer transition ${
                        isChecked
                          ? 'border-rose-500 bg-rose-900/20'
                          : 'border-gray-600 bg-gray-800 hover:border-rose-400'
                      }`}
                    >
                      <input
                        type="radio"
                        name="bonusAttr"
                        value={attr}
                        defaultChecked={isChecked}
                        className="mt-1 text-rose-500"
                        required
                      />
                      <div className="ml-4">
                        <div className="font-medium">
                          +2 em {attr === 'con' ? 'Constituição' : 'Presença'}
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

            {/* ENCANTAMENTO INATO */}
            <div>
              <h3 className="text-xl font-bold mb-2">Encantamento Inato</h3>
              <p className="text-sm text-gray-400 mb-3">
                Escolha <strong>1 encantamento válido</strong> (p.156–160).  
                <strong>Exemplos:</strong> Afiada, Avassalador, Distorcivo, Escaldante, Precisa.
              </p>
              <select
                name="innateEnchantment"
                defaultValue={innateEnchantment}
                className="w-full p-3 bg-gray-700 rounded border border-gray-600"
                required
              >
                <option value="">— Selecione um encantamento —</option>
                {VALID_ENCHANTMENTS.map(enc => (
                  <option key={enc} value={enc}>{enc}</option>
                ))}
              </select>
              {actionData?.errors?.innateEnchantment && (
                <p className="text-red-400 text-sm mt-1">{actionData.errors.innateEnchantment[0]}</p>
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
                className="px-6 py-2 bg-rose-600 hover:bg-rose-700 text-white font-medium rounded-lg shadow-md disabled:opacity-75"
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