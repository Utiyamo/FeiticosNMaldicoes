// routes/builder/step/uniform-selection.tsx
import {
  Form,
  useLoaderData,
  useActionData,
  useNavigation,
  redirect,
  useNavigate,
} from 'react-router';
import { getAuthCode, getSession, commitSession } from '~/utils/auth.server';
import type { Route } from './+types/uniformselection';

// 🔹 Uniformes (p.140)
const UNIFORMS = [
  {
    name: 'Uniforme Comum',
    def: 10,
    penalty: 0,
    cost: 1,
    description: 'Defesa padrão: 10 + mod. DES + metade do nível',
  },
  {
    name: 'Uniforme com Revestimento Leve',
    def: 12,
    penalty: 0,
    cost: 2,
    description: '+2 DEF, sem penalidade',
  },
  {
    name: 'Uniforme com Revestimento Médio',
    def: 14,
    penalty: -2,
    cost: 3,
    description: '+4 DEF, -2 em testes com DES',
  },
  {
    name: 'Uniforme com Revestimento Robusto',
    def: 16,
    penalty: -4,
    cost: 4,
    description: '+6 DEF, -4 em testes com DES',
  },
] as const;

export async function loader({ request }: Route.LoaderArgs) {
  const code = await getAuthCode(request);
  if (!code) return redirect('/');

  const session = await getSession(request);
  const savedData = session.get('characterData') ?? {};

  return { savedData };
}

export default function UniformSelection() {
  const { savedData } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const navigate = useNavigate();
  const isSubmitting = navigation.state === 'submitting';

  return (
    <div className="min-h-screen bg-gray-900 text-white py-8 px-4 sm:px-6">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-cyan-400 mb-2">
            Seleção de Uniforme
          </h1>
          <p className="text-gray-400">
            Escolha <strong>1 uniforme</strong> (custo 1–4). Todos começam com um uniforme comum.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-800">
              <tr>
                <th className="py-2 px-3 text-left">Nome</th>
                <th className="py-2 px-3 text-center">DEF</th>
                <th className="py-2 px-3 text-center">Penalidade</th>
                <th className="py-2 px-3 text-center">Custo</th>
                <th className="py-2 px-3 text-left">Descrição</th>
                <th className="py-2 px-3 w-24"></th>
              </tr>
            </thead>
            <tbody>
              {UNIFORMS.map((uniform) => (
                <tr
                  key={uniform.name}
                  className="border-b border-gray-800 hover:bg-gray-850/30"
                >
                  <td className="py-2 px-3 font-medium">{uniform.name}</td>
                  <td className="py-2 px-3 text-center">{uniform.def}+mod</td>
                  <td className="py-2 px-3 text-center">
                    {uniform.penalty >= 0 ? `+${uniform.penalty}` : uniform.penalty}
                  </td>
                  <td className="py-2 px-3 text-center">{uniform.cost}</td>
                  <td className="py-2 px-3 text-sm text-gray-300">{uniform.description}</td>
                  <td className="py-2 px-3 text-center">
                    <Form method="post" replace>
                      <input
                        type="hidden"
                        name="uniform"
                        value={uniform.name}
                      />
                      <input
                        type="hidden"
                        name="intent"
                        value="select-uniform"
                      />
                      <button
                        type="submit"
                        className="text-cyan-500 hover:text-cyan-400 font-medium"
                      >
                        Selecionar
                      </button>
                    </Form>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-8 text-sm text-gray-500 bg-gray-800/50 p-3 rounded">
          <strong>Regra (p.140):</strong> Todo personagem inicia com um <em>Uniforme Comum</em>. Modificações aumentam a DEF, mas podem aplicar penalidade em testes com Destreza.
        </div>

        <div className="flex justify-between pt-6">
          <button
            type="button"
            onClick={() => navigate('/builder/step/equipment')}
            className="px-4 py-2 text-gray-400 hover:text-white transition"
          >
            ← Voltar
          </button>
        </div>
      </div>
    </div>
  );
}

// ✅ action — só salva selectedUniform
export async function action({ request }: Route.ActionArgs) {
  const formData = await request.formData();
  const uniform = formData.get('uniform');

  if (typeof uniform !== 'string' || !UNIFORMS.some(u => u.name === uniform)) {
    return { error: 'Uniforme inválido' };
  }

  const session = await getSession(request);
  const existing = session.get('characterData') ?? {};
  const updated = { ...existing, selectedUniform: uniform };

  session.set('characterData', updated);
  const headers = { 'Set-Cookie': await commitSession(session) };

  return redirect('/builder/step/equipment', { headers });
}