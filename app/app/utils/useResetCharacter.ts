// app/utils/useResetCharacter.ts
import { useFetcher } from '@remix-run/react';
import { logout } from './auth.server';

export function useResetCharacter() {
  const fetcher = useFetcher();

  const reset = () => {
    if (confirm('⚠️ Deseja realmente resetar todo o progresso?\nEssa ação não pode ser desfeita.')) {
      // Simples: apenas destrói a sessão (limpa cookie)
      // Como não há backend, isso já zera tudo
      fetcher.submit({}, { method: 'post', action: '/logout' });
    }
  };

  return { reset, isResetting: fetcher.state !== 'idle' };
}