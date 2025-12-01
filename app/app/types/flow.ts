import type { CharacterSheet, FlowStep, FlowStepId } from './builder';

export const flow: FlowStep[] = [
  {
    id: 'auth',
    title: 'Autenticação',
    path: '/',
    next: 'base',
  },
  {
    id: 'base',
    title: 'Dados Básicos',
    path: '/builder/step/base',
    next: 'personal',
  },
  {
    id: 'personal',
    title: 'Aspectos Pessoais',
    path: '/builder/step/personal',
    next: 'attributes',
  },
  {
    id: 'attributes',
    title: 'Atributos e Origem',
    path: '/builder/step/attributes',
    next: 'origin',
  },
  {
    id: 'origin',
    title: 'Origem',
    path: '/builder/step/origin',
    next: {
      if: (data) =>
        data.talents?.level1 === 'Incremento de Atributo',
      then: 'attribute-increment',
      else: 'specialization',
    },
  },
  {
    id: 'attribute-increment',
    title: 'Incremento de Atributo',
    path: '/builder/step/attribute-increment',
    next: 'specialization',
  },
  {
    id: 'specialization',
    title: 'Especialização',
    path: '/builder/step/specialization',
    next: 'equipment',
  },
  {
    id: 'equipment',
    title: 'Equipamentos',
    path: '/builder/step/equipment',
    next: 'spells',
  },
  {
    id: 'spells',
    title: 'Técnicas e Feitiços',
    path: '/builder/step/spells',
    next: 'final-details',
  },
  {
    id: 'final-details',
    title: 'Detalhes Finais',
    path: '/builder/step/final-details',
    next: 'appearance',
  },
  {
    id: 'appearance',
    title: 'Aparência',
    path: '/builder/step/appearance',
    next: 'review',
  },
  {
    id: 'review',
    title: 'Revisão e Impressão',
    path: '/builder/review',
    next: 'review',
  },
];

export function getStepById(id: FlowStepId): FlowStep | undefined {
  return flow.find((step) => step.id === id);
}

export function getNextStepId(
  currentId: FlowStepId,
  data: Partial<CharacterSheet>
): FlowStepId {
  const step = getStepById(currentId);
  if (!step) return 'base';

  if (typeof step.next === 'string') {
    return step.next;
  }

  return step.next.if(data) ? step.next.then : step.next.else;
}