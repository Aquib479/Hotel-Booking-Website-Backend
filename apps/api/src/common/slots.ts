import { fromZonedTime } from 'date-fns-tz';

const HOTEL_TZ = 'Asia/Jakarta';

export type SlotType = 'HALF_DAY' | 'FULL_DAY';

export interface ResolvedSlot {
  start: Date;
  end: Date;
  /** PostgreSQL tstzrange literal: [start, end) */
  period: string;
}

/**
 * Resolve a date + slot type into UTC start/end times.
 *
 * HALF_DAY: 00:00–12:00 WIB on the given date
 * FULL_DAY: 12:00 WIB on the given date – 12:00 WIB the next day
 */
export function resolveSlot(date: string, slotType: SlotType): ResolvedSlot {
  if (slotType === 'HALF_DAY') {
    const start = fromZonedTime(`${date}T00:00:00`, HOTEL_TZ);
    const end = fromZonedTime(`${date}T12:00:00`, HOTEL_TZ);
    return { start, end, period: toTstzrange(start, end) };
  }

  const start = fromZonedTime(`${date}T12:00:00`, HOTEL_TZ);
  const nextDay = incrementDate(date);
  const end = fromZonedTime(`${nextDay}T12:00:00`, HOTEL_TZ);
  return { start, end, period: toTstzrange(start, end) };
}

function toTstzrange(start: Date, end: Date): string {
  return `[${start.toISOString()},${end.toISOString()})`;
}

function incrementDate(dateStr: string): string {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + 1);
  return d.toISOString().slice(0, 10);
}
