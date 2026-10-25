import {expect,it} from 'vitest';
import {calendarMonthDays} from '@/features/schedule/date';
it('actually changes the month grid when the workspace starts the week on Sunday',()=>{expect(calendarMonthDays('2026-10',0)[0]).toBe('2026-09-27');expect(calendarMonthDays('2026-10',1)[0]).toBe('2026-09-28');expect(calendarMonthDays('2026-10',0)).toHaveLength(42);});
