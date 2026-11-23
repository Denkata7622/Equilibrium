export const CONFIG = {
  storeKey: 'olympiad_v8',
  legacyKeys: ['olympiad_v7','olympiad_v6','olympiad_v5','olympiad_v4','olympiad_v3','olympiad_v2','olympiad_progress'],
  themeKey: 'olympiad_theme',
  themes: ['green', 'contrast', 'high', 'light'],
  themeLabels: { green: 'GREEN', contrast: 'SOFT', high: 'HIGH', light: 'LIGHT' },
  pomo: { focus: 25*60, shortBreak: 5*60, longBreak: 15*60 },
  examDates: {
    regional:       new Date('2027-02-08T09:00:00'),
    nationalStart:  new Date('2027-04-03T09:00:00'),
    nationalEnd:    new Date('2027-04-06T18:00:00'),
  },
  planStartDate: new Date('2026-10-23T00:00:00'),
};