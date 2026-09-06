/**
 * taskRecurrence.ts
 * Pure, side-effect-free utilities for task period key computation and due date resolution.
 * No UI or store dependencies — safe to import anywhere.
 */

export type Frequency =
  | 'ONE_TIME'
  | 'DAILY'
  | 'WEEKLY'
  | 'MONTHLY'
  | 'QUARTERLY'
  | 'HALF_YEARLY'
  | 'YEARLY';

/**
 * Computes a human-readable period key for a given frequency and reference date.
 * Examples:
 *   MONTHLY  → "2026-09"
 *   QUARTERLY → "2026-Q3"
 *   YEARLY   → "2026"
 *   WEEKLY   → "2026-W36"
 *   DAILY    → "2026-09-05"
 *   ONE_TIME → "once"
 */
export function computePeriodKey(frequency: string, date: Date = new Date()): string {
  const freq = frequency.toUpperCase() as Frequency;
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');

  switch (freq) {
    case 'ONE_TIME':
      return 'once';
    case 'DAILY':
      return `${y}-${m}-${d}`;
    case 'WEEKLY': {
      const w = getISOWeek(date);
      return `${y}-W${String(w).padStart(2, '0')}`;
    }
    case 'MONTHLY':
      return `${y}-${m}`;
    case 'QUARTERLY': {
      const q = Math.ceil((date.getMonth() + 1) / 3);
      return `${y}-Q${q}`;
    }
    case 'HALF_YEARLY': {
      const h = date.getMonth() < 6 ? 'H1' : 'H2';
      return `${y}-${h}`;
    }
    case 'YEARLY':
      return `${y}`;
    default:
      return `${y}-${m}`;
  }
}

/**
 * Computes the next N period keys starting from a given date.
 * Returns current period + (count - 1) future periods.
 */
export function computeNextPeriods(
  frequency: string,
  startDate: Date = new Date(),
  count: number = 3
): string[] {
  const freq = frequency.toUpperCase() as Frequency;
  const periods: string[] = [];
  const cursor = new Date(startDate);

  for (let i = 0; i < count; i++) {
    periods.push(computePeriodKey(freq, cursor));
    switch (freq) {
      case 'ONE_TIME':
        return [computePeriodKey(freq, cursor)];
      case 'DAILY':
        cursor.setDate(cursor.getDate() + 1);
        break;
      case 'WEEKLY':
        cursor.setDate(cursor.getDate() + 7);
        break;
      case 'MONTHLY':
        cursor.setMonth(cursor.getMonth() + 1);
        break;
      case 'QUARTERLY':
        cursor.setMonth(cursor.getMonth() + 3);
        break;
      case 'HALF_YEARLY':
        cursor.setMonth(cursor.getMonth() + 6);
        break;
      case 'YEARLY':
        cursor.setFullYear(cursor.getFullYear() + 1);
        break;
      default:
        cursor.setMonth(cursor.getMonth() + 1);
    }
  }

  return periods;
}

/**
 * Resolves a due date string from a periodKey + rule.
 *
 * Supported rule formats:
 *   "Nth_following_month"       — e.g. "7th_following_month" -> 7th day of next month
 *   "Nth_current_month"         — e.g. "15th_current_month"  -> 15th of current period month
 *   "Nd_after_period_end"       — e.g. "10d_after_period_end" -> N days after last day of period
 *   "last_day"                  — last day of the current period month
 *   "manual:YYYY-MM-DD"         — literal date, returned as-is
 *   anything else               — falls back to last day of period
 */
export function computeDueDate(dueDateRule: string, periodKey: string): string {
  const rule = dueDateRule.trim().toLowerCase();

  if (rule.startsWith('manual:')) {
    return rule.replace('manual:', '');
  }

  const { periodEnd } = resolvePeriodBounds(periodKey);

  if (rule === 'last_day') {
    return formatDate(periodEnd);
  }

  const followingMatch = rule.match(/^(\d+)(?:st|nd|rd|th)?_following_month$/);
  if (followingMatch) {
    const day = parseInt(followingMatch[1], 10);
    const d = new Date(periodEnd);
    d.setMonth(d.getMonth() + 1, day);
    return formatDate(d);
  }

  const currentMonthMatch = rule.match(/^(\d+)(?:st|nd|rd|th)?_current_month$/);
  if (currentMonthMatch) {
    const day = parseInt(currentMonthMatch[1], 10);
    const d = new Date(periodEnd);
    d.setDate(day);
    return formatDate(d);
  }

  const afterEndMatch = rule.match(/^(\d+)d_after_period_end$/);
  if (afterEndMatch) {
    const days = parseInt(afterEndMatch[1], 10);
    const d = new Date(periodEnd);
    d.setDate(d.getDate() + days);
    return formatDate(d);
  }

  return formatDate(periodEnd);
}

// Internal helpers

function resolvePeriodBounds(periodKey: string): { periodStart: Date; periodEnd: Date } {
  const now = new Date();

  if (periodKey === 'once') {
    return { periodStart: now, periodEnd: now };
  }

  if (/^\d{4}-\d{2}-\d{2}$/.test(periodKey)) {
    const d = new Date(periodKey);
    return { periodStart: d, periodEnd: d };
  }

  const weekMatch = periodKey.match(/^(\d{4})-W(\d{2})$/);
  if (weekMatch) {
    const year = parseInt(weekMatch[1], 10);
    const week = parseInt(weekMatch[2], 10);
    const start = isoWeekToDate(year, week);
    const end = new Date(start);
    end.setDate(end.getDate() + 6);
    return { periodStart: start, periodEnd: end };
  }

  const qMatch = periodKey.match(/^(\d{4})-Q(\d)$/);
  if (qMatch) {
    const year = parseInt(qMatch[1], 10);
    const q = parseInt(qMatch[2], 10);
    const startMonth = (q - 1) * 3;
    const start = new Date(year, startMonth, 1);
    const end = new Date(year, startMonth + 3, 0);
    return { periodStart: start, periodEnd: end };
  }

  const hMatch = periodKey.match(/^(\d{4})-H([12])$/);
  if (hMatch) {
    const year = parseInt(hMatch[1], 10);
    const h = parseInt(hMatch[2], 10);
    const startMonth = (h - 1) * 6;
    const start = new Date(year, startMonth, 1);
    const end = new Date(year, startMonth + 6, 0);
    return { periodStart: start, periodEnd: end };
  }

  if (/^\d{4}$/.test(periodKey)) {
    const year = parseInt(periodKey, 10);
    return { periodStart: new Date(year, 0, 1), periodEnd: new Date(year, 11, 31) };
  }

  const mMatch = periodKey.match(/^(\d{4})-(\d{2})$/);
  if (mMatch) {
    const year = parseInt(mMatch[1], 10);
    const month = parseInt(mMatch[2], 10) - 1;
    const start = new Date(year, month, 1);
    const end = new Date(year, month + 1, 0);
    return { periodStart: start, periodEnd: end };
  }

  return { periodStart: now, periodEnd: now };
}

function formatDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function getISOWeek(d: Date): number {
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  date.setUTCDate(date.getUTCDate() + 4 - (date.getUTCDay() || 7));
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  return Math.ceil(((date.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}

function isoWeekToDate(year: number, week: number): Date {
  const jan4 = new Date(year, 0, 4);
  const dayOfWeek = jan4.getDay() || 7;
  const weekStart = new Date(jan4);
  weekStart.setDate(jan4.getDate() - dayOfWeek + 1 + (week - 1) * 7);
  return weekStart;
}
