// routes/builder/step/craft-selection.tsx
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
import type { Route } from './+types/page';

// 🔹 Ofícios válidos (p.285)
const OFICIO_OPTIONS = [
  'Ofício (Ferreiro)',
  'Ofício (Canalizador)',
  'Ofício (Costureiro)',
  'Ofício (Serralheiro)',
  'Ofício (Alquimista)',
  'Ofício (Carpinteiro)',
] as const;

// ✅ loader — só mostra se Ofício foi escolhido e ainda não definiu craftSelection
export async function loader({ request }: Route.LoaderArgs) {
  const code = await getAuthCode(request);
  if (!code) return redirect('/');

  const session = await getSession(request);
  const savedData = session.get('characterData') ?? {};

  // Filtra ofícios já escolhidos na especialização
  const alreadySelected = [
    savedData.specializationDetails?.oficio1,
    savedData.specializationDetails?.oficio2,
    savedData.specializationDetails?.craft,
  ].filter(Boolean) as string[];

  const availableOptions = OFICIO_OPTIONS.filter(option => !alreadySelected.includes(option));

  return { savedData, availableOptions };
}

// ✅ action
export async function action({ request }: Route.ActionArgs) {
  const formData = await request.formData();

  const session = await getSession(request);
  const existing = session.get('characterData') ?? {};

  const craftSelection = formData.get('craftSelection');
  if (typeof craftSelection !== 'string' || !OFICIO_OPTIONS.includes(craftSelection as any)) {
    return {
      errors: { craftSelection: ['Selecione um ofício válido.'] },
      submitted: Object.fromEntries(formData.entries()),
    };
  }

  // ✅ VALIDAÇÃO: não pode ser um ofício já escolhido na especialização
  const alreadySelected = [
    existing.specializationDetails?.oficio1,
    existing.specializationDetails?.oficio2,
    existing.specializationDetails?.craft,
  ].filter(Boolean) as string[];

  if (alreadySelected.includes(craftSelection)) {
    return {
      errors: {
        craftSelection: [
          `Você já escolheu "${craftSelection}". Escolha um ofício diferente.`,
        ],
      },
      submitted: Object.fromEntries(formData.entries()),
    };
  }

  const updated = {
    ...existing,
    craftSelection,
  };

  session.set('characterData', updated);
  const headers = { 'Set-Cookie': await commitSession(session) };

  return redirect('/builder/step/equipment', { headers });
}

// ✅ Componente — SSR-only, apenas opções válidas exibidas
export default function CraftSelectionStep() {
  const { savedData, availableOptions } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const navigate = useNavigate();
  const isSubmitting = navigation.state === 'submitting';

  const craftSelection = savedData.craftSelection ?? '';

  return (
    <div className="min-h-screen bg-gray-900 text-white py-8 px-4 sm:px-6">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-cyan-400 mb-2">
            Escolha de Ofício Especializado
          </h1>
          <p className="text-gray-400">
            Você selecionou <strong>Ofício</strong> como perícia livre. Escolha sua especialidade.
          </p>
        </div>

        <div className="bg-gray-800 rounded-xl p-6 shadow-lg border border-cyan-700/30">
          <div className="mb-4 p-3 bg-cyan-900/20 rounded text-sm">
            <strong>Regra (p.285):</strong> Ofício é uma perícia que requer especialização — ex: <em>Ofício (Ferreiro)</em>.
          </div>

          <Form method="post" className="space-y-6">
            <input type="hidden" name="intent" value="submit" />

            <div>
              <h3 className="text-xl font-bold mb-3">Especialidade de Ofício</h3>
              <p className="text-sm text-gray-400 mb-3">
                Escolha <strong>uma</strong> especialidade para sua perícia <em>Ofício</em>.
              </p>

              <div className="space-y-3">
                {availableOptions.map((option) => (
                  <label
                    key={option}
                    className={`flex items-start p-4 rounded-lg border-2 cursor-pointer transition ${
                      craftSelection === option
                        ? 'border-cyan-500 bg-cyan-900/20'
                        : 'border-gray-600 bg-gray-800 hover:border-cyan-400'
                    }`}
                  >
                    <input
                      type="radio"
                      name="craftSelection"
                      value={option}
                      defaultChecked={craftSelection === option}
                      className="mt-1 text-cyan-500"
                      required
                    />
                    <div className="ml-4">
                      <div className="font-medium">{option}</div>
                    </div>
                  </label>
                ))}
              </div>

              {actionData?.errors?.craftSelection && (
                <p className="text-red-400 text-sm mt-2">
                  {actionData.errors.craftSelection[0]}
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
                className="px-6 py-2 bg-cyan-600 hover:bg-cyan-700 text-white font-medium rounded-lg shadow-md disabled:opacity-75"
              >
                {isSubmitting ? 'Salvando...' : 'Confirmar Ofício →'}
              </button>
            </div>
          </Form>

          <div className="mt-6 text-center text-xs text-gray-500">
            Etapa opcional • Próximo: Equipamentos
          </div>
        </div>
      </div>
    </div>
  );
}