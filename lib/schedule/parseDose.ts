import type { MedicineDoseForm } from '@/types/medicine';

export function parseDoseFromApi(dose?: string): { amount: string; doseForm: MedicineDoseForm } {
  if (!dose) return { amount: '1', doseForm: 'tablet' };
  const lower = dose.toLowerCase();
  if (lower.includes('ml')) {
    const n = parseFloat(dose.replace(/[^\d.]/g, ''));
    return { amount: String(n > 0 ? n : 1), doseForm: 'syrup' };
  }
  const n = parseFloat(dose.replace(/[^\d.]/g, ''));
  return { amount: String(n > 0 ? n : 1), doseForm: 'tablet' };
}
