import { addMonths, format, parseISO, startOfMonth, subMonths } from 'date-fns';

export const todayLocal = () => format(new Date(), 'yyyy-MM-dd');
export const toMonthKey = (dateLocal: string) => dateLocal.slice(0, 7);
export const nowIso = () => new Date().toISOString();

export const monthRangeBack = (months: number, endMonthKey: string) => {
  const [year, month] = endMonthKey.split('-').map(Number);
  const end = startOfMonth(new Date(year, month - 1, 1));
  return Array.from({ length: months }, (_, index) =>
    format(subMonths(end, months - index - 1), 'yyyy-MM')
  );
};

export const nextMonthKey = (monthKey: string, step: number) => {
  const dt = parseISO(`${monthKey}-01`);
  return format(addMonths(dt, step), 'yyyy-MM');
};
