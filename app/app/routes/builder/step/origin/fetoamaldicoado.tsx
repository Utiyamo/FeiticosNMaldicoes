// routes/builder/origin/feto-amaldicoado.tsx
import {
  Form,
  useLoaderData,
  useActionData,
  useNavigation,
  useNavigate,
  redirect,
} from 'react-router';

import { getAuthCode, getSession, commitSession } from '~/utils/auth.server';
import {
  CharacterSheetSchema,
  OriginDetailsSchema,
} from '~/types/builder';
import { flow, getNextStepId } from '~/types/flow';
import type { Route } from './+types/fetoamaldicoado';

// ✅ loader
export async function loader({ request }: Route.LoaderArgs) {
  const code = await getAuthCode(request);
  if (!code) return redirect('/');

  const session = await getSession(request);
  const savedData = session.get('characterData') ?? {};

  // 🔹 Correção: schema usa 'Feto Amaldiçoado' (com acento e espaço)
  if (savedData.origin !== 'Feto Amaldiçoado') {
    return redirect('/builder/step/origin');
  }

  return { savedData };
}

// ✅ action — com originDetails
export async function action({ request }: Route.ActionArgs) {
  const session = await getSession(request);
  const existing = session.get('characterData') ?? {};

  const formData = await request.formData();

  // 🔹 Extrai dados
  const maldictionName = formData.get('maldictionName')?.toString();
  const maldictionGrade = formData.get('maldictionGrade')?.toString() ?? '1';

  if (!maldictionName) {
    return { errors: { maldictionName: ['Nome da maldição é obrigatório'] } };
  }

  // 🔹 Monta originDetails
  const originDetails = OriginDetailsSchema.safeParse({
    type: 'Feto Amaldiçoado',
    maldictionName,
    maldictionGrade,
  });

  if (!originDetails.success) {
    return {
      errors: originDetails.error.flatten().fieldErrors,
      submitted: Object.fromEntries(formData.entries()),
    };
  }

  // 🔹 Monta dados completos
  const updated = {
    ...existing,
    origin: 'Feto Amaldiçoado' as const,
    originDetails: originDetails.data,
    bonusAttr1: 'con', // +2 em CON (fixo)
    talents: { level1: undefined },
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

// ✅ Componente — SSR-only
export default function FetoAmaldiçoadoOrigin() {
  const { savedData } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const navigate = useNavigate();
  const isSubmitting = navigation.state === 'submitting';

  // 🔹 Valores atuais
  const maldictionName = savedData.originDetails?.maldictionName ?? '';
  const maldictionGrade = savedData.originDetails?.maldictionGrade ?? '1';

  return (
    <div className="min-h-screen bg-gray-900 text-white py-8 px-4 sm:px-6">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-emerald-400 mb-2">
            Origem: <span className="text-emerald-300">Feto Amaldiçoado</span>
          </h1>
          <p className="text-gray-400">
            Você é um feto amaldiçoado que nasceu com consciência e tomou forma humana — uma anomalia viva, moldada pela energia negativa acumulada no útero.
          </p>
        </div>

        <div className="bg-gray-800 rounded-xl p-6 shadow-lg border border-emerald-700/30">
          <div className="mb-6 p-4 bg-emerald-900/20 rounded-lg border border-emerald-800">
            <h3 className="font-bold text-emerald-300 mb-2">Benefícios da Origem Feto Amaldiçoado</h3>
            <ul className="list-disc pl-5 space-y-1 text-sm">
              <li><strong>+2 em Constituição</strong> (fixo)</li>
              <li><strong>Vigor Maldito:</strong> recupera PV ao entrar em combate</li>
              <li><strong>Maldição Inata:</strong> 1 feitiço de grau 1 (não usa PE)</li>
            </ul>
          </div>

          <Form method="post" className="space-y-8">
            <input type="hidden" name="intent" value="submit" />

            {/* MALDIÇÃO INATA */}
            <div>
              <h3 className="text-xl font-bold mb-2">Maldição Inata</h3>
              <p className="text-sm text-gray-400 mb-3">
                Nome do Feitiço de Maldição Grau 1 que você manifesta (ex: "Pulso de Ódio", "Semente da Desolação").
              </p>
              <input
                type="text"
                name="maldictionName"
                defaultValue={maldictionName}
                placeholder="Ex: Pulso de Ódio"
                className="w-full p-3 bg-gray-700 rounded border border-gray-600"
                required
              />
              {actionData?.errors?.maldictionName && (
                <p className="text-red-400 text-sm mt-1">{actionData.errors.maldictionName[0]}</p>
              )}
            </div>

            {/* GRAU DA MALDIÇÃO */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Grau da Maldição
              </label>
              <select
                name="maldictionGrade"
                defaultValue={maldictionGrade}
                className="w-full p-2 bg-gray-700 rounded border border-gray-600"
                required
              >
                <option value="1">Grau 1 (padrão NV1)</option>
                <option value="2">Grau 2</option>
                <option value="3">Grau 3</option>
                <option value="4">Grau 4</option>
              </select>
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
                className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-lg shadow-md disabled:opacity-75"
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