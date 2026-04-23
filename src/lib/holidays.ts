export interface Holiday {
  date: string;
  name: string;
  type: 'national' | 'regional' | 'optional';
}

export const holidays: Holiday[] = [
  { date: '01-01', name: 'Confraternização Universal', type: 'national' },
  { date: '21-04', name: 'Tiradentes', type: 'national' },
  { date: '01-05', name: 'Dia do Trabalho', type: 'national' },
  { date: '07-09', name: 'Independência do Brasil', type: 'national' },
  { date: '12-10', name: 'Nossa Senhora Aparecida', type: 'national' },
  { date: '02-11', name: 'Finados', type: 'national' },
  { date: '15-11', name: 'Proclamação da República', type: 'national' },
  { date: '20-11', name: 'Dia da Consciência Negra', type: 'national' },
  { date: '25-12', name: 'Natal', type: 'national' },
];

export function isHoliday(date: Date): Holiday | null {
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const key = `${day}-${month}`;
  
  return holidays.find(h => h.date === key) || null;
}
