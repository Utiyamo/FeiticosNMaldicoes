import {
  Form,
  useLoaderData,
  useActionData,
  useNavigation,
  redirect,
  useNavigate,
} from "react-router";
import { getAuthCode, getSession, commitSession } from "~/utils/auth.server";
import type { Route } from "./+types/weaponselection";

// 🔹 Armas Simples (p.132) — só as que são realmente armas
const SIMPLE_WEAPONS = [
  { name: "Adaga", damage: "1d6", type: "Pf", size: 1, action: "Ação Comum", crit: "18" },
  { name: "Bastão", damage: "1d6/1d8", type: "Im", size: 1, action: "Ação Comum", crit: "19" },
  { name: "Lança", damage: "1d6/1d8", type: "Pf", size: 1, action: "Ação Comum", crit: "20" },
  { name: "Machado", damage: "1d8/1d10", type: "Ct", size: 1, action: "Ação Comum", crit: "20" },
] as const;

// 🔹 Armas Marciais (p.133–134)
const MARTIAL_WEAPONS = [
  { name: "Espada Curta", damage: "1d6", type: "Ct", size: 1, action: "Ação Comum", crit: "19" },
  { name: "Espada Longa", damage: "1d8/1d10", type: "Ct", size: 1, action: "Ação Comum", crit: "20" },
  { name: "Katana", damage: "1d8/1d10", type: "Ct", size: 1, action: "Ação Comum", crit: "19" },
  { name: "Machado de Batalha", damage: "1d10", type: "Ct", size: 2, action: "Ação Comum", crit: "20" },
  { name: "Martelo", damage: "1d8", type: "Im", size: 1, action: "Ação Comum", crit: "20" },
  { name: "Nunchaku", damage: "1d8", type: "Im", size: 1, action: "Ação Comum", crit: "19" },
  { name: "Rapieira", damage: "1d8", type: "Pf", size: 1, action: "Ação Comum", crit: "19" },
  { name: "Alabarda", damage: "1d10", type: "Ct", size: 2, action: "Ação Comum", crit: "20" },
  { name: "Lança Grande", damage: "1d12", type: "Pf", size: 2, action: "Ação Comum", crit: "20" },
  { name: "Machado Grande", damage: "1d10", type: "Ct", size: 2, action: "Ação Comum", crit: "20" },
  { name: "Martelo Grande", damage: "1d12", type: "Im", size: 2, action: "Ação Comum", crit: "20" },
  { name: "Nunchaku Pesado", damage: "2d6", type: "Im", size: 2, action: "Ação Comum", crit: "20" },
] as const;

// 🔹 Armas a Distância (p.132–134)
const RANGED_WEAPONS = [
  { name: "Arco Curto", damage: "1d6", type: "Pf", size: 1, action: "Ação Comum", crit: "19" },
  { name: "Besta Leve", damage: "1d8", type: "Pf", size: 1, action: "Ação Comum", crit: "19" },
  { name: "Pistola", damage: "1d10", type: "Pf", size: 1, action: "Ação Comum", crit: "20" },
] as const;

export async function loader({ request }: Route.LoaderArgs) {
  const code = await getAuthCode(request);
  if (!code) return redirect("/");

  const session = await getSession(request);
  const savedData = session.get("characterData") ?? {};

  return { savedData };
}

export default function WeaponSelection() {
  const { savedData } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const navigate = useNavigate();
  const isSubmitting = navigation.state === "submitting";

  const selectedWeaponMode = savedData.selectedWeaponMode ?? "1";
  const title = selectedWeaponMode === "1" ? "1ª Arma" : "2ª Arma";

  const proficiencies =
    savedData.specializationDetails?.weaponsProficiencies ?? [];
  const canUseSimple = proficiencies.includes("Simples");
  const canUseMartial = proficiencies.includes("Marciais");
  const canUseRanged = proficiencies.includes("Armas a Distancia");

  return (
    <div className="min-h-screen bg-gray-900 text-white py-8 px-4 sm:px-6">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-cyan-400 mb-2">
            Seleção de {title}
          </h1>
          <p className="text-gray-400">
            Escolha <strong>1 arma</strong> permitida pela sua especialização.
          </p>
        </div>

        {/* 🔹 Armas Simples */}
        {canUseSimple && (
          <div className="mb-10">
            <h2 className="text-2xl font-bold text-cyan-300 mb-4">
              Armas Simples
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-800">
                  <tr>
                    <th className="py-2 px-3 text-left">Nome</th>
                    <th className="py-2 px-3 text-center">Dano</th>
                    <th className="py-2 px-3 text-center">Tipo</th>
                    <th className="py-2 px-3 text-center">Crítico</th>
                    <th className="py-2 px-3 text-center">Tamanho</th>
                    <th className="py-2 px-3 w-24"></th>
                  </tr>
                </thead>
                <tbody>
                  {SIMPLE_WEAPONS.map((weapon) => (
                    <tr
                      key={weapon.name}
                      className="border-b border-gray-800 hover:bg-gray-850/30"
                    >
                      <td className="py-2 px-3 font-medium">{weapon.name}</td>
                      <td className="py-2 px-3 text-center">{weapon.damage}</td>
                      <td className="py-2 px-3 text-center">{weapon.type}</td>
                      <td className="py-2 px-3 text-center">{weapon.crit}</td>
                      <td className="py-2 px-3 text-center">{weapon.size}</td>
                      <td className="py-2 px-3 text-center">
                        <Form method="post" replace>
                          <input
                            type="hidden"
                            name="weapon"
                            value={weapon.name}
                          />
                          <input
                            type="hidden"
                            name="intent"
                            value="select-weapon"
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
          </div>
        )}

        {/* 🔹 Armas Marciais */}
        {canUseMartial && (
          <div className="mb-10">
            <h2 className="text-2xl font-bold text-cyan-300 mb-4">
              Armas Marciais
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-800">
                  <tr>
                    <th className="py-2 px-3 text-left">Nome</th>
                    <th className="py-2 px-3 text-center">Dano</th>
                    <th className="py-2 px-3 text-center">Tipo</th>
                    <th className="py-2 px-3 text-center">Crítico</th>
                    <th className="py-2 px-3 text-center">Tamanho</th>
                    <th className="py-2 px-3 w-24"></th>
                  </tr>
                </thead>
                <tbody>
                  {MARTIAL_WEAPONS.map((weapon) => (
                    <tr
                      key={weapon.name}
                      className="border-b border-gray-800 hover:bg-gray-850/30"
                    >
                      <td className="py-2 px-3 font-medium">{weapon.name}</td>
                      <td className="py-2 px-3 text-center">{weapon.damage}</td>
                      <td className="py-2 px-3 text-center">{weapon.type}</td>
                      <td className="py-2 px-3 text-center">{weapon.crit}</td>
                      <td className="py-2 px-3 text-center">{weapon.size}</td>
                      <td className="py-2 px-3 text-center">
                        <Form method="post" replace>
                          <input
                            type="hidden"
                            name="weapon"
                            value={weapon.name}
                          />
                          <input
                            type="hidden"
                            name="intent"
                            value="select-weapon"
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
          </div>
        )}

        {/* 🔹 Armas a Distância */}
        {canUseRanged && (
          <div className="mb-10">
            <h2 className="text-2xl font-bold text-cyan-300 mb-4">
              Armas a Distância
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-800">
                  <tr>
                    <th className="py-2 px-3 text-left">Nome</th>
                    <th className="py-2 px-3 text-center">Dano</th>
                    <th className="py-2 px-3 text-center">Tipo</th>
                    <th className="py-2 px-3 text-center">Crítico</th>
                    <th className="py-2 px-3 text-center">Tamanho</th>
                    <th className="py-2 px-3 w-24"></th>
                  </tr>
                </thead>
                <tbody>
                  {RANGED_WEAPONS.map((weapon) => (
                    <tr
                      key={weapon.name}
                      className="border-b border-gray-800 hover:bg-gray-850/30"
                    >
                      <td className="py-2 px-3 font-medium">{weapon.name}</td>
                      <td className="py-2 px-3 text-center">{weapon.damage}</td>
                      <td className="py-2 px-3 text-center">{weapon.type}</td>
                      <td className="py-2 px-3 text-center">{weapon.crit}</td>
                      <td className="py-2 px-3 text-center">{weapon.size}</td>
                      <td className="py-2 px-3 text-center">
                        <Form method="post" replace>
                          <input
                            type="hidden"
                            name="weapon"
                            value={weapon.name}
                          />
                          <input
                            type="hidden"
                            name="intent"
                            value="select-weapon"
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
          </div>
        )}

        <div className="flex justify-between pt-6">
          <button
            type="button"
            onClick={() => navigate("/builder/step/equipment")}
            className="px-4 py-2 text-gray-400 hover:text-white transition"
          >
            ← Voltar
          </button>
        </div>
      </div>
    </div>
  );
}

export async function action({ request }: Route.ActionArgs) {
  const formData = await request.formData();
  const weapon = formData.get("weapon");

  if (typeof weapon !== "string") {
    return { error: "Arma inválida" };
  }

  const session = await getSession(request);
  const existing = session.get("characterData") ?? {};
  const mode = existing.selectedWeaponMode ?? "1";
  const key = mode === "2" ? "selectedWeapon2" : "selectedWeapon1";

  const updated = { ...existing, [key]: weapon };
  session.set("characterData", updated);
  const headers = { "Set-Cookie": await commitSession(session) };

  return redirect("/builder/step/equipment", { headers });
}