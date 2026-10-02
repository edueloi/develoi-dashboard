import { useCallback, useEffect, useState } from 'react';
import { useLiveEvents } from './liveEvents';

export interface WaCounts { bot: number; waiting: number; active: number; closed: number }

// Quantas conversas há em cada etapa do atendimento (atualiza sozinho quando algo muda)
export function useWaCounts(): WaCounts {
  const [counts, setCounts] = useState<WaCounts>({ bot: 0, waiting: 0, active: 0, closed: 0 });
  const load = useCallback(async () => {
    try {
      const r = await fetch('/api/admin/bot/conversations/counts');
      if (r.ok) setCounts(await r.json());
    } catch {}
  }, []);
  useEffect(() => { load(); const t = setInterval(load, 30000); return () => clearInterval(t); }, [load]);
  useLiveEvents(['WppConversation'], load);
  return counts;
}
