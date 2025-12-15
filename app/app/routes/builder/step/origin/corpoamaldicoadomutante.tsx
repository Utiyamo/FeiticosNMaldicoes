// routes/builder/origin/corpoamaldicoadomutante.tsx
import {
  Form,
  useLoaderData,
  useActionData,
  useNavigation,
  redirect,
  useNavigate,
} from 'react-router';
import { getAuthCode, getSession, commitSession } from '~/utils/auth.server';
import { flow, getNextStepId } from '~/types/flow';
import { OriginDetailsSchema } from '~/types/builder'; // ✅ schema centralizado
import type { Route } from './+types/corpoamaldicoadomutante';

// ✅ loader
export async function loader({ request }: Route.LoaderArgs) {
  const code = await getAuthCode(request);
  if (!code) return redirect('/');

  const session = await getSession(request);
  const savedData = session.get('characterData') ?? {};

  // ✅ Nome exato do livro: "Corpo Amaldiçoado Mutante"
  if (savedData.origin !== 'ObjetoAmaldicoado') {
    return redirect('/builder/step/origin');
  }

  return { code, savedData };
}

// ✅ action — usa OriginDetailsSchema diretamente
export async function action({ request }: Route.ActionArgs) {
  const code = await getAuthCode(request);
  if (!code) return redirect('/');

  const formData = await request.formData();

  const session = await getSession(request);
  const existing = session.get('characterData') ?? {};
  let updated = { ...existing };

  // ✅ Dados compatíveis com o ramo "Corpo Amaldiçoado Mutante" do OriginDetailsSchema
  const originDetailsInput = {
    type: 'Corpo Amaldiçoado Mutante' as const,
    primaryCore: formData.get('primaryCore')?.toString().trim() || '',
    coreName: formData.get('coreName')?.toString().trim() || '',
    objectName: formData.get('objectName')?.toString().trim() || undefined,
  };

  const result = OriginDetailsSchema.safeParse(originDetailsInput);

  if (!result.success) {
    return {
      errors: result.error.flatten().fieldErrors,
      submitted: Object.fromEntries(formData.entries()),
    };
  }

  updated = {
    ...updated,
    origin: 'Corpo Amaldiçoado Mutante',
    originDetails: result.data,
  };

  session.set('characterData', updated);
  const headers = { 'Set-Cookie': await commitSession(session) };

  const nextStepId = getNextStepId('origin', updated);
  const nextStep = flow.find(s => s.id === nextStepId);
  if (!nextStep) throw new Error(`Próxima etapa '${nextStepId}' não encontrada`);
  return redirect(nextStep.path, { headers });
}

// ✅ Componente — UI fiel às regras (p.39–41)
export default function CorpoAmaldiçoadoMutanteOrigin() {
  const { savedData } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const navigate = useNavigate();
  const isSubmitting = navigation.state === 'submitting';

  const primaryCore = savedData.originDetails?.primaryCore ?? '';
  const coreName = savedData.originDetails?.coreName ?? '';
  const objectName = savedData.originDetails?.objectName ?? '';

  return (
    <div className="min-h-screen bg-gray-900 text-white py-8 px-4 sm:px-6">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-emerald-400 mb-2">
            Origem: <span className="text-emerald-300">Corpo Amaldiçoado Mutante</span>
          </h1>
          <p className="text-gray-400">
            Você é uma forma de vida artificial, criada com consciência própria e múltiplos núcleos — como Panda, uma relíquia viva do jujutsu.
          </p>
        </div>

        <div className="bg-gray-800 rounded-xl p-6 shadow-lg border border-emerald-700/30">
          <div className="mb-6 p-4 bg-emerald-900/20 rounded-lg border border-emerald-800">
            <h3 className="font-bold text-emerald-300 mb-2">Benefícios da Origem (p.39)</h3>
            <ul className="list-disc pl-5 space-y-1 text-sm">
              <li><strong>Bônus em Atributo:</strong> +2 pontos livres para distribuir</li>
              <li><strong>Forma de Vida Sintética:</strong> imune a veneno/condição envenenado; não se beneficia de refeições/medicinas</li>
              <li><strong>Mutação Abrupta:</strong> 3 núcleos, troca como Ação Bônus, técnica definida pelo núcleo primário</li>
            </ul>
            <p className="text-xs text-emerald-200 mt-3">
              (Livro de Regras, pp.39–41 — exemplo: Panda)
            </p>
          </div>

          <Form method="post" className="space-y-8">
            <input type="hidden" name="intent" value="submit" />

            {/* NOME NARRATIVO (opcional) */}
            <div>
              <h3 className="text-xl font-bold mb-2">Nome do Corpo/Objeto (opcional)</h3>
              <p className="text-sm text-gray-400 mb-3">
                Qual é o nome ou designação do seu corpo criado?  
                Ex: <em>Puppet-07</em>, <em>Vaso da Lua Partida</em>, <em>Unidade Tóxica-α</em>.
              </p>
              <input
                type="text"
                name="objectName"
                defaultValue={objectName}
                className="w-full p-3 bg-gray-700 rounded border border-gray-600"
                placeholder="Ex: Puppet-07"
              />
            </div>

            {/* NÚCLEO PRIMÁRIO */}
            <div>
              <h3 className="text-xl font-bold mb-2">Núcleo Primário</h3>
              <p className="text-sm text-gray-400 mb-3">
                Escolha o foco do seu núcleo primário — ele definirá sua técnica e especialização base.
              </p>
              <div className="space-y-3">
                {(['Físico', 'Técnico', 'Híbrido'] as const).map(core => {
                  const isChecked = primaryCore === core;
                  return (
                    <label
                      key={core}
                      className={`flex items-start p-4 rounded-lg border-2 cursor-pointer transition ${
                        isChecked
                          ? 'border-emerald-500 bg-emerald-900/20'
                          : 'border-gray-600 bg-gray-800 hover:border-emerald-400'
                      }`}
                    >
                      <input
                        type="radio"
                        name="primaryCore"
                        value={core}
                        defaultChecked={isChecked}
                        className="mt-1 text-emerald-500"
                        required
                      />
                      <div className="ml-4">
                        <div className="font-medium">{core}</div>
                        <div className="text-sm text-gray-400">
                          {core === 'Físico' && 'Foco em combate corpo a corpo, força e resistência'}
                          {core === 'Técnico' && 'Foco em feitiços, técnica e manipulação de energia'}
                          {core === 'Híbrido' && 'Equilíbrio entre físico e técnico'}
                        </div>
                      </div>
                    </label>
                  );
                })}
              </div>
              {actionData?.errors?.primaryCore && (
                <p className="text-red-400 text-sm mt-2">{actionData.errors.primaryCore[0]}</p>
              )}
            </div>

            {/* NOME DO NÚCLEO PRIMÁRIO */}
            <div>
              <h3 className="text-xl font-bold mb-2">Nome do Núcleo Primário</h3>
              <p className="text-sm text-gray-400 mb-3">
                Dê um nome ao seu núcleo principal. Este nome será usado para identificá-lo em combate.
                Ex: <em>Núcleo de Aço</em>, <em>Núcleo Solar</em>, <em>Modo Tóxico</em>.
              </p>
              <input
                type="text"
                name="coreName"
                defaultValue={coreName}
                className="w-full p-3 bg-gray-700 rounded border border-gray-600"
                placeholder="Ex: Núcleo de Aço"
                required
              />
              {actionData?.errors?.coreName && (
                <p className="text-red-400 text-sm mt-1">{actionData.errors.coreName[0]}</p>
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
                className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-lg shadow-md disabled:opacity-75"
              >
                {isSubmitting ? 'Criando núcleos...' : 'Confirmar Origem →'}
              </button>
            </div>
          </Form>
        </div>
      </div>
    </div>
  );
}