import { useEffect, useRef } from 'react';

// Ouve "o que mudou" no sistema (tabela + ação) e avisa as telas interessadas.
// Um único verificador para o sistema todo: consulta /api/events a cada 3s (só com a aba visível).

export interface LiveEvent { id: number; model: string; action: 'created' | 'updated' | 'deleted'; recordId: string | null }
type Listener = (events: LiveEvent[]) => void;

const listeners = new Set<Listener>();
let cursor: number | null = null;
let timer: ReturnType<typeof setInterval> | null = null;
let busy = false;

async function tick() {
  if (busy || document.visibilityState !== 'visible') return;
  busy = true;
  try {
    const res = await fetch(cursor === null ? '/api/events' : `/api/events?since=${cursor}`);
    if (!res.ok) return;
    const data = await res.json();
    const first = cursor === null;
    cursor = data.cursor;
    if (!first && Array.isArray(data.events) && data.events.length) listeners.forEach(l => l(data.events));
  } catch {} finally { busy = false; }
}

function start() {
  if (timer) return;
  void tick();
  timer = setInterval(tick, 3000);
  window.addEventListener('focus', tick);
}
function stop() {
  if (timer && listeners.size === 0) {
    clearInterval(timer); timer = null; cursor = null;
    window.removeEventListener('focus', tick);
  }
}

// Chama `onChange` (com pequena espera, juntando rajadas) quando houver mudança nas tabelas indicadas.
// Ex.: useLiveEvents(['Client', 'ClientPayment'], () => fetchData(true))
export function useLiveEvents(models: string[], onChange: (events: LiveEvent[]) => void) {
  const cb = useRef(onChange);
  cb.current = onChange;
  const key = models.join('|');

  useEffect(() => {
    const wanted = new Set(key.split('|').filter(Boolean));
    let pending: LiveEvent[] = [];
    let wait: ReturnType<typeof setTimeout> | null = null;

    const listener: Listener = events => {
      const mine = events.filter(e => wanted.size === 0 || wanted.has(e.model));
      if (!mine.length) return;
      pending.push(...mine);
      if (wait) return;
      wait = setTimeout(() => { const batch = pending; pending = []; wait = null; cb.current(batch); }, 400);
    };

    listeners.add(listener);
    start();
    return () => { listeners.delete(listener); if (wait) clearTimeout(wait); stop(); };
  }, [key]);
}
