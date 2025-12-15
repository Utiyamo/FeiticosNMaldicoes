// routes/builder/step/toolkit-selection.tsx
import {
  Form,
  useLoaderData,
  useActionData,
  useNavigation,
  redirect,
  useNavigate,
} from 'react-router';
import { getAuthCode, getSession, commitSession } from '~/utils/auth.server';
import type { Route } from './+types/toolkitselection';

// 🔹 Kits de Ferramentas (p.142–144)
const TOOLKITS = [
  {
    name: 'Ferramentas de Ferreiro',
    description: 'Criação/melhoria de armas, escudos e ferramentas amaldiçoadas.',
    cost: 1,
  },
  {
    name: 'Ferramentas de Canalizador',
    description: 'Criação de itens espirituais e imbuir energia em equipamentos.',
    cost: 1,
  },
  {
    name: 'Ferramentas de Alfaiate',
    description: 'Confecção de acessórios e uniformes sob medida.',
    cost: 1,
  },
  {
    name: 'Ferramentas de Alquimista',
    description: 'Criação de misturas (venenos, óleos, explosivos).',
    cost: 1,
  },
  {
    name: 'Ferramentas de Farmacêutico',
    description: 'Preparo de fármacos (remédios, antídotos, estimulantes).',
    cost: 1,
  },
  {
    name: 'Ferramentas de Serralheiro',
    description: 'Criação de mecanismos, armadilhas, fechaduras e dispositivos.',
    cost: 1,
  },
] as const;

export async function loader({ request }: Route.LoaderArgs) {
  const code = await getAuthCode(request);
  if (!code) return redirect('/');

  const session = await getSession(request);
  const savedData = session.get('characterData') ?? {};

  return { savedData };
}

export default function ToolkitSelection() {
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
            Seleção de Kit de Ferramentas
          </h1>
          <p className="text-gray-400">
            Escolha <strong>1 kit</strong> para criar itens durante interlúdios (custo 1).
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-800">
              <tr>
                <th className="py-2 px-3 text-left">Kit</th>
                <th className="py-2 px-3 text-left">Descrição</th>
                <th className="py-2 px-3 text-center">Custo</th>
                <th className="py-2 px-3 w-24"></th>
              </tr>
            </thead>
            <tbody>
              {TOOLKITS.map((kit) => (
                <tr
                  key={kit.name}
                  className="border-b border-gray-800 hover:bg-gray-850/30"
                >
                  <td className="py-2 px-3 font-medium">{kit.name}</td>
                  <td className="py-2 px-3 text-gray-300 text-sm">
                    {kit.description}
                  </td>
                  <td className="py-2 px-3 text-center">{kit.cost}</td>
                  <td className="py-2 px-3 text-center">
                    <Form method="post" replace>
                      <input type="hidden" name="toolkit" value={kit.name} />
                      <input type="hidden" name="intent" value="select-toolkit" />
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
          <strong>Regra (p.142):</strong> Todo personagem inicia com <em>1 kit de ferramentas</em>. Durante um interlúdio, você pode usá-lo para criar itens, acessórios ou invocações.
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

// ✅ action — salva selectedToolkit
export async function action({ request }: Route.ActionArgs) {
  const formData = await request.formData();
  const toolkit = formData.get('toolkit');

  if (typeof toolkit !== 'string' || !TOOLKITS.some(k => k.name === toolkit)) {
    return { error: 'Kit inválido' };
  }

  const session = await getSession(request);
  const existing = session.get('characterData') ?? {};
  const updated = { ...existing, selectedToolkit: toolkit };

  session.set('characterData', updated);
  const headers = { 'Set-Cookie': await commitSession(session) };

  return redirect('/builder/step/equipment', { headers });
}