// routes.ts
import { type RouteConfig, index, route, layout } from "@react-router/dev/routes";

export default [
  // Página inicial → redireciona ou explica
  index("routes/home.tsx"),

  // Layout de proteção — NÃO é uma rota acessível diretamente
  layout(
    // layout component (com loader que protege)
    "routes/layout/baseLayout.tsx",
    [
      // Rotas filhas protegidas
      route("/builder/step/base", "routes/builder/step/base/page.tsx"),
      route("/builder/step/personal", "routes/builder/step/personal/page.tsx"),
      route("/builder/step/origin", "routes/builder/step/origin/page.tsx"),
      route("/builder/origin/inato", "routes/builder/step/origin/inato.tsx"),
      route("/builder/origin/herdado", "routes/builder/step/origin/herdado.tsx"),
      route("/builder/origin/sem-tecnica", "routes/builder/step/origin/semtecnica.tsx"),
      route("/builder/origin/derivado", "routes/builder/step/origin/derivado.tsx"),
      route("/builder/origin/FetoAmaldicoado", "routes/builder/step/origin/fetoamaldicoado.tsx"),
      route('/builder/origin/ObjetoAmaldicoado', 'routes/builder/step/origin/corpoamaldicoadomutante.tsx'),
      route('/builder/origin/Restringido', 'routes/builder/step/origin/restringido.tsx'),
      route('/builder/step/attribute-increment', 'routes/builder/step/attribute-increment/page.tsx'),
      route("/builder/step/attributes", "routes/builder/step/attributes/page.tsx"),
      route("/builder/step/specialization", "routes/builder/step/specialization/page.tsx"),
      route("/builder/specialization/lutador", "routes/builder/step/specialization/lutador.tsx"),
      route("/builder/specialization/especialista-em-combate", "routes/builder/step/specialization/especialistacombate.tsx"),
      route("/builder/specialization/especialista-em-técnica", "routes/builder/step/specialization/especialistatecnica.tsx"),
      route("/builder/specialization/controlador", "routes/builder/step/specialization/controlador.tsx"),
      route("/builder/specialization/suporte", "routes/builder/step/specialization/suporte.tsx"),
      route("/builder/specialization/restringido", "routes/builder/step/specialization/restringido.tsx"),
      route("/builder/step/craft-selection", "routes/builder/step/craft-selection/page.tsx"),
      route("/builder/step/equipment", "routes/builder/step/equipment/page.tsx"),
      route("/builder/step/weapon-selection", "routes/builder/step/equipment/weaponselection.tsx"),
      route("/builder/step/shield-selection", "routes/builder/step/equipment/shieldselection.tsx"),
      route("/builder/step/uniform-selection", "routes/builder/step/equipment/uniformselection.tsx"),
      route("/builder/step/toolkit-selection", "routes/builder/step/equipment/toolkitselection.tsx"),
      route("/builder/step/spells", "routes/builder/step/spell/page.tsx"),
      route("/builder/step/spell-selection", "routes/builder/step/spell/spellselection.tsx"),
      route("/builder/step/final-details", "routes/builder/step/final-details/page.tsx"),
      route("/builder/step/appearance", "routes/builder/step/appearance/page.tsx"),
      route("/builder/review", "routes/builder/review/page.tsx"),
      // + demais etapas...
    ]
  ),

  // Logout (livre, para resetar sessão)
  route("/logout", "routes/logout/page.tsx"),
] satisfies RouteConfig;