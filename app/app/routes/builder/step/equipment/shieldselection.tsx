// routes/builder/step/shield-selection.tsx
import {
  Form,
  useLoaderData,
  useActionData,
  useNavigation,
  redirect,
  useNavigate,
} from 'react-router';
import { getAuthCode, getSession, commitSession } from '~/utils/auth.server';
import type { Route } from './+types/shieldselection';

// 🔹 Escudos (p.142)
const SHIELDS = [
  {
    name: 'Escudo Leve',
    rd: 2,
    penalty: -1,
    cost: 1,
    damage: '1d4',
    size: 1,
    action: 'Ação Comum',
  },
  {
    name: 'Escudo Pequeno',
    rd: 2,
    penalty: 0,
    cost: 2,
    damage: '1d3',
    size: 1,
    action: 'Ação Comum',
  },
  {
    name: 'Escudo Médio',
    rd: 4,
    penalty: -2,
    cost: 2,
    damage: '1d6',
    size: 1,
    action: 'Ação Comum',
  },
  {
    name: 'Escudo Pesado',
    rd: 6,
    penalty: -4,
    cost: 3,
    damage: '1d8',
    size: 2,
    action: 'Ação Comum',
  },
] as const;

export async function loader({ request }: Route.LoaderArgs) {
  const code = await getAuthCode(request);
  if (!code) return redirect('/');

  const session = await getSession(request);
  const savedData = session.get('characterData') ?? {};

  return { savedData };
}

export default function ShieldSelection() {
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
            Seleção de Escudo
          </h1>
          <p className="text-gray-400">
            Escolha <strong>1 escudo</strong> permitido pela sua especialização (custo 1–3).
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-800">
              <tr>
                <th className="py-2 px-3 text-left">Nome</th>
                <th className="py-2 px-3 text-center">RD</th>
                <th className="py-2 px-3 text-center">Penalidade</th>
                <th className="py-2 px-3 text-center">Dano</th>
                <th className="py-2 px-3 text-center">Tamanho</th>
                <th className="py-2 px-3 text-center">Custo</th>
                <th className="py-2 px-3 w-24"></th>
              </tr>
            </thead>
            <tbody>
              {SHIELDS.map((shield) => (
                <tr
                  key={shield.name}
                  className="border-b border-gray-800 hover:bg-gray-850/30"
                >
                  <td className="py-2 px-3 font-medium">{shield.name}</td>
                  <td className="py-2 px-3 text-center">{shield.rd}</td>
                  <td className="py-2 px-3 text-center">{shield.penalty >= 0 ? `+${shield.penalty}` : shield.penalty}</td>
                  <td className="py-2 px-3 text-center">{shield.damage}</td>
                  <td className="py-2 px-3 text-center">{shield.size}</td>
                  <td className="py-2 px-3 text-center">{shield.cost}</td>
                  <td className="py-2 px-3 text-center">
                    <Form method="post" replace>
                      <input
                        type="hidden"
                        name="shield"
                        value={shield.name}
                      />
                      <input
                        type="hidden"
                        name="intent"
                        value="select-shield"
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
          <strong>Regra (p.142):</strong> Escudos fornecem RD enquanto empunhados. Ao atacar com um escudo, ele deixa de fornecer RD até o início do seu próximo turno.
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

// ✅ action — só salva selectedShield
export async function action({ request }: Route.ActionArgs) {
  const formData = await request.formData();
  const shield = formData.get('shield');

  if (typeof shield !== 'string' || !SHIELDS.some(s => s.name === shield)) {
    return { error: 'Escudo inválido' };
  }

  const session = await getSession(request);
  const existing = session.get('characterData') ?? {};
  const updated = { ...existing, selectedShield: shield };

  session.set('characterData', updated);
  const headers = { 'Set-Cookie': await commitSession(session) };

  return redirect('/builder/step/equipment', { headers });
}