/**
 * Regression tests for the overtime engine.
 *
 * Each case here maps to a bug that shipped. They exist so the next refactor of
 * the balance cannot quietly reintroduce one of them.
 */

import { describe, expect, it } from 'vitest';

import { OvertimeCalculator } from '../domain/services/OvertimeCalculator';
import { EntryDomain } from '../domain/models/Entry';
import { OvertimeDomain } from '../domain/models/Overtime';
import {
  getDailyOvertimeMinutes,
  getDailyTargetMinutes,
  getRecoveryDeductionMinutes,
} from './logic';
import { Entry, OvertimeEvent, OvertimeState, Settings } from './types';
import { computeOvertimeEarned, getUsedMinutes } from './utils';
import { buildOvertimeHistory, summariseHistory } from './overtimeHistory';

// --- fixtures -------------------------------------------------------------

/** 35h/week, 7h a day Mon-Fri, weekend off. */
const sameSettings: Settings = {
  weeklyTarget: 35,
  workDays: 5,
  baseHours: {
    mode: 'same',
    same: { start: '09:00', lunchStart: '12:30', lunchEnd: '13:30', end: '17:00' },
    days: {
      mon: { enabled: true, start: '09:00', lunchStart: '12:30', lunchEnd: '13:30', end: '17:00' },
      tue: { enabled: true, start: '09:00', lunchStart: '12:30', lunchEnd: '13:30', end: '17:00' },
      wed: { enabled: true, start: '09:00', lunchStart: '12:30', lunchEnd: '13:30', end: '17:00' },
      thu: { enabled: true, start: '09:00', lunchStart: '12:30', lunchEnd: '13:30', end: '17:00' },
      fri: { enabled: true, start: '09:00', lunchStart: '12:30', lunchEnd: '13:30', end: '17:00' },
      sat: { enabled: false, start: '', lunchStart: '', lunchEnd: '', end: '' },
      sun: { enabled: false, start: '', lunchStart: '', lunchEnd: '', end: '' },
    },
  },
};

/** 39h/week: 8h Mon-Thu, 7h on Friday. */
const perDaySettings: Settings = {
  weeklyTarget: 39,
  workDays: 5,
  baseHours: {
    mode: 'per-day',
    same: { start: '', lunchStart: '', lunchEnd: '', end: '' },
    days: {
      mon: { enabled: true, start: '09:00', lunchStart: '12:30', lunchEnd: '13:30', end: '18:00' },
      tue: { enabled: true, start: '09:00', lunchStart: '12:30', lunchEnd: '13:30', end: '18:00' },
      wed: { enabled: true, start: '09:00', lunchStart: '12:30', lunchEnd: '13:30', end: '18:00' },
      thu: { enabled: true, start: '09:00', lunchStart: '12:30', lunchEnd: '13:30', end: '18:00' },
      fri: { enabled: true, start: '09:00', lunchStart: '12:30', lunchEnd: '13:30', end: '17:00' },
      sat: { enabled: false, start: '', lunchStart: '', lunchEnd: '', end: '' },
      sun: { enabled: false, start: '', lunchStart: '', lunchEnd: '', end: '' },
    },
  },
};

// 2026-01-05 is a Monday, 2026-01-09 a Friday, 2026-01-10 a Saturday.
const MONDAY = '2026-01-05';
const FRIDAY = '2026-01-09';
const SATURDAY = '2026-01-10';

function entry(over: Partial<Entry> & { date: string }): Entry {
  return {
    id: `id-${over.date}-${over.status || 'work'}`,
    start: '09:00',
    lunchStart: '12:30',
    lunchEnd: '13:30',
    end: '17:00',
    notes: '',
    status: 'work',
    ...over,
  };
}

function event(over: Partial<OvertimeEvent> & { date: string; minutes: number }): OvertimeEvent {
  return { id: `ev-${over.date}-${over.minutes}`, note: '', ...over };
}

// --- daily targets --------------------------------------------------------

describe('getDailyTargetMinutes', () => {
  it('reads the schedule of that weekday in per-day mode', () => {
    expect(getDailyTargetMinutes(MONDAY, perDaySettings)).toBe(480); // 8h
    expect(getDailyTargetMinutes(FRIDAY, perDaySettings)).toBe(420); // 7h
  });

  it('applies the shared schedule in same mode', () => {
    expect(getDailyTargetMinutes(MONDAY, sameSettings)).toBe(420); // 7h
  });

  it('expects nothing on a day marked as not worked, even in same mode', () => {
    // Regression: a Saturday used to inherit a full daily target, turning any
    // hour logged there into a deficit instead of overtime.
    expect(getDailyTargetMinutes(SATURDAY, sameSettings)).toBe(0);
  });

  it('honours a frozen historical target over current settings', () => {
    const frozen = entry({ date: MONDAY, customTargetMinutes: 390, targetSource: 'snapshot' });
    expect(getDailyTargetMinutes(MONDAY, sameSettings, frozen)).toBe(390);
  });
});

// --- daily overtime -------------------------------------------------------

describe('getDailyOvertimeMinutes', () => {
  it('returns the surplus over the daily target', () => {
    const worked = entry({ date: MONDAY, end: '17:30' }); // 7h30 vs 7h
    expect(getDailyOvertimeMinutes(worked, sameSettings, [])).toBe(30);
  });

  it('credits recovery taken that day so the day comes out even', () => {
    // Worked the afternoon only, took 3h30 of recovery in the morning.
    const worked = entry({ date: MONDAY, start: '13:30', lunchStart: '', lunchEnd: '', end: '17:00' });
    const events = [event({ date: MONDAY, minutes: -210, start: '09:00', end: '12:30' })];
    expect(getDailyOvertimeMinutes(worked, sameSettings, events)).toBe(0);
  });

  it('does not let a manual credit reduce the day target', () => {
    // Regression: positive events were counted through Math.abs, so a credit
    // shrank the day's target on top of being credited globally.
    const worked = entry({ date: MONDAY });
    const events = [event({ date: MONDAY, minutes: 120 })];
    expect(getDailyOvertimeMinutes(worked, sameSettings, events)).toBe(0);
  });

  it('expects nothing from a justified absence', () => {
    const off = entry({ date: MONDAY, status: 'vacation' });
    expect(getDailyOvertimeMinutes(off, sameSettings, [])).toBe(0);
  });

  it('counts hours worked on a non-working day as pure overtime', () => {
    const saturday = entry({ date: SATURDAY, start: '09:00', lunchStart: '', lunchEnd: '', end: '13:00' });
    expect(getDailyOvertimeMinutes(saturday, sameSettings, [])).toBe(240);
  });
});

// --- recovery deduction ---------------------------------------------------

describe('getRecoveryDeductionMinutes', () => {
  it('caps a full-day recovery at the daily target, not the clock span', () => {
    // Stored 09:00-18:00 (9h of wall clock) but a Friday only costs 7h.
    const recovery = entry({ date: FRIDAY, status: 'recovery', start: '09:00', lunchStart: '', lunchEnd: '', end: '18:00' });
    expect(getRecoveryDeductionMinutes(recovery, perDaySettings)).toBe(420);
  });

  it('deducts the real duration of a partial recovery', () => {
    const recovery = entry({ date: MONDAY, status: 'recovery', start: '14:00', lunchStart: '', lunchEnd: '', end: '17:00' });
    expect(getRecoveryDeductionMinutes(recovery, sameSettings)).toBe(180);
  });
});

// --- balance --------------------------------------------------------------

describe('overtime balance', () => {
  it('nets out to zero when recovery matches the hours earned', () => {
    const entries = [
      entry({ date: MONDAY, end: '18:00' }), // 8h -> +1h
      // Friday: took the last hour off, worked the rest.
      entry({ date: FRIDAY, start: '09:00', lunchStart: '12:30', lunchEnd: '13:30', end: '16:00' }),
    ];
    const events = [event({ date: FRIDAY, minutes: -60, start: '16:00', end: '17:00' })];

    const state = OvertimeCalculator.recalculateState(
      { balanceMinutes: 0, earnedMinutes: 0, usedMinutes: 0, events },
      entries,
      sameSettings
    );

    expect(state.earnedMinutes).toBe(60); // +1h Monday, Friday comes out even
    expect(state.usedMinutes).toBe(60);
    expect(state.balanceMinutes).toBe(0);
  });

  it('credits a manual adjustment even with no entry on that date', () => {
    // Regression: a positive event on an empty day moved nothing at all.
    const events = [event({ date: SATURDAY, minutes: 120, note: 'Prime' })];
    expect(computeOvertimeEarned([], sameSettings, events)).toBe(120);
  });

  it('debits a recovery once, not twice, when an entry accompanies the event', () => {
    // A full-day recovery creates BOTH an event and a recovery entry.
    const entries = [entry({ date: FRIDAY, status: 'recovery', start: '09:00', lunchStart: '', lunchEnd: '', end: '17:00' })];
    const events = [event({ date: FRIDAY, minutes: -420, start: '09:00', end: '17:00' })];

    const state = OvertimeCalculator.recalculateState(
      { balanceMinutes: 0, earnedMinutes: 0, usedMinutes: 0, events },
      entries,
      sameSettings
    );

    expect(state.earnedMinutes).toBe(0);
    expect(state.balanceMinutes).toBe(-420);
  });

  it('debits a standalone recovery entry that has no matching event', () => {
    const entries = [entry({ date: FRIDAY, status: 'recovery', start: '13:30', lunchStart: '', lunchEnd: '', end: '17:00' })];
    expect(computeOvertimeEarned(entries, sameSettings, [])).toBe(-210);
  });

  it('rebuilds usedMinutes from the events instead of trusting a stored total', () => {
    // Regression: usedMinutes was an incremental counter. Once corrupted -
    // by a cloud restore, a storage migration or a second tab - it stayed wrong
    // for good. It must be recomputed from the event list every time.
    const events = [event({ date: MONDAY, minutes: -60 })];
    const corrupted: OvertimeState = {
      balanceMinutes: 9999,
      earnedMinutes: 9999,
      usedMinutes: 9999,
      events,
    };

    const state = OvertimeCalculator.recalculateState(corrupted, [], sameSettings);

    expect(state.usedMinutes).toBe(60);
    expect(state.balanceMinutes).toBe(-60);
  });

  it('keeps the balance consistent as events are added and removed', () => {
    let state: OvertimeState = { balanceMinutes: 0, earnedMinutes: 300, usedMinutes: 0, events: [] };

    const recovery = OvertimeDomain.createEvent({ date: MONDAY, minutes: -120, note: '' });
    state = OvertimeDomain.addEvent(state, recovery);
    expect(state.usedMinutes).toBe(120);
    expect(state.balanceMinutes).toBe(180);

    state = OvertimeDomain.removeEvent(state, recovery.id);
    expect(state.usedMinutes).toBe(0);
    expect(state.balanceMinutes).toBe(300);
  });

  it('ignores positive events when counting consumed time', () => {
    const events = [event({ date: MONDAY, minutes: -60 }), event({ date: FRIDAY, minutes: 90 })];
    expect(getUsedMinutes(events)).toBe(60);
  });
});

// --- entry integrity ------------------------------------------------------

describe('EntryDomain', () => {
  it('does not leave a ghost behind when an entry moves to another date', () => {
    // Regression: filtering on date alone kept the old row, producing two rows
    // sharing one id - counted twice, deleted unpredictably.
    const original: Entry = { ...entry({ date: MONDAY }), id: 'abc', updatedAt: 1 };
    const moved: Entry = { ...original, date: FRIDAY, updatedAt: 2 };

    const result = EntryDomain.upsertEntry([original], moved);

    expect(result).toHaveLength(1);
    expect(result[0].date).toBe(FRIDAY);
  });

  it('keeps one entry per date', () => {
    const a: Entry = { ...entry({ date: MONDAY }), id: 'a' };
    const b: Entry = { ...entry({ date: MONDAY }), id: 'b', end: '19:00' };

    const result = EntryDomain.upsertEntry([a], b);

    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('b');
  });

  it('lets the newest version win on merge', () => {
    const local: Entry = { ...entry({ date: MONDAY }), id: 'x', end: '19:00', updatedAt: 2000 };
    const staleFromCloud: Entry = { ...entry({ date: MONDAY }), id: 'x', end: '17:00', updatedAt: 1000 };

    const result = EntryDomain.mergeEntries([local], [staleFromCloud]);

    expect(result).toHaveLength(1);
    expect(result[0].end).toBe('19:00');
  });

  it('accepts a cloud version that is genuinely newer', () => {
    const local: Entry = { ...entry({ date: MONDAY }), id: 'x', end: '17:00', updatedAt: 1000 };
    const fresherFromCloud: Entry = { ...entry({ date: MONDAY }), id: 'x', end: '19:00', updatedAt: 2000 };

    const result = EntryDomain.mergeEntries([local], [fresherFromCloud]);

    expect(result[0].end).toBe('19:00');
  });
});

// --- PC <-> phone sync -----------------------------------------------------

describe('sync between devices', () => {
  const pcEntry = (over: Partial<Entry>): Entry => ({ ...entry({ date: MONDAY }), id: 'shared', ...over });

  it('brings back an edit made on the phone', () => {
    const onThePc = pcEntry({ end: '17:00', updatedAt: 1000 });
    const fromThePhone = pcEntry({ end: '19:00', updatedAt: 2000 });

    const merged = EntryDomain.mergeEntries([onThePc], [fromThePhone]);

    expect(merged[0].end).toBe('19:00');
  });

  it('does not let the cloud undo a local edit that is still pending', () => {
    // The laptop edited while offline; the cloud still holds the old version.
    const pendingLocalEdit = pcEntry({ end: '19:00', updatedAt: 2000 });
    const staleCloud = pcEntry({ end: '17:00', updatedAt: 1000 });

    const merged = EntryDomain.mergeEntries([pendingLocalEdit], [staleCloud]);

    expect(merged[0].end).toBe('19:00');
  });

  it('does not let a legacy cloud row without a timestamp win', () => {
    // Entries written before updatedAt existed must count as the oldest,
    // otherwise they overwrite whatever the device holds.
    const localEdit = pcEntry({ end: '19:00', updatedAt: 2000 });
    const legacyCloud: Entry = { ...pcEntry({ end: '08:00' }) };
    delete (legacyCloud as Partial<Entry>).updatedAt;

    const merged = EntryDomain.mergeEntries([localEdit], [legacyCloud]);

    expect(merged[0].end).toBe('19:00');
  });

  it('keeps days that only one device knows about', () => {
    // The heart of it: merging must never mean "replace everything".
    const onlyOnThePc = { ...entry({ date: MONDAY }), id: 'pc', updatedAt: 1000 };
    const onlyOnThePhone = { ...entry({ date: FRIDAY }), id: 'phone', updatedAt: 1000 };

    const merged = EntryDomain.mergeEntries([onlyOnThePc], [onlyOnThePhone]);

    expect(merged.map(e => e.date)).toEqual([MONDAY, FRIDAY]);
  });

  it('never drops local history when the cloud comes back empty', () => {
    // A failed or empty cloud read must be a no-op, not a wipe.
    const local = [
      { ...entry({ date: MONDAY }), id: 'a', updatedAt: 1000 },
      { ...entry({ date: FRIDAY }), id: 'b', updatedAt: 1000 },
    ];

    expect(EntryDomain.mergeEntries(local, [])).toHaveLength(2);
  });

  it('merges overtime events from both devices instead of picking a side', () => {
    const localOnly = event({ date: MONDAY, minutes: -60 });
    const cloudOnly = event({ date: FRIDAY, minutes: -30 });

    const merged = OvertimeDomain.withDerivedTotals({
      balanceMinutes: 0,
      earnedMinutes: 0,
      usedMinutes: 0,
      events: [localOnly, cloudOnly],
    });

    expect(merged.events).toHaveLength(2);
    expect(merged.usedMinutes).toBe(90);
  });
});

// --- export / panel consistency -------------------------------------------

describe('overtime history', () => {
  const entries = [
    entry({ date: MONDAY, end: '18:00' }),                       // +1h
    entry({ date: FRIDAY, start: '09:00', lunchStart: '12:30', lunchEnd: '13:30', end: '16:00' }),
    entry({ date: SATURDAY, start: '09:00', lunchStart: '', lunchEnd: '', end: '11:00' }), // +2h
  ];
  const events = [
    event({ date: FRIDAY, minutes: -60, start: '16:00', end: '17:00' }),
    event({ date: MONDAY, minutes: 45, note: 'Prime' }),
  ];

  it('nets out to exactly the balance shown in the app', () => {
    // The invariant that keeps the CSV totals and the balance card in step:
    // summing every movement must reproduce the balance, to the minute.
    const history = buildOvertimeHistory(entries, sameSettings, events);
    const totals = summariseHistory(history);

    const state = OvertimeCalculator.recalculateState(
      { balanceMinutes: 0, earnedMinutes: 0, usedMinutes: 0, events },
      entries,
      sameSettings
    );

    expect(totals.net).toBe(state.balanceMinutes);
  });

  it('lists a recovery once, not twice, when an entry accompanies the event', () => {
    const withRecoveryEntry = [
      ...entries,
      entry({ date: FRIDAY, status: 'recovery', start: '16:00', end: '17:00', lunchStart: '', lunchEnd: '' }),
    ];

    const recovered = buildOvertimeHistory(withRecoveryEntry, sameSettings, events)
      .filter(i => i.type === 'recovered');

    expect(recovered).toHaveLength(1);
  });

  it('sorts most recent first', () => {
    const dates = buildOvertimeHistory(entries, sameSettings, events).map(i => i.date);
    expect(dates).toEqual([...dates].sort().reverse());
  });
});
