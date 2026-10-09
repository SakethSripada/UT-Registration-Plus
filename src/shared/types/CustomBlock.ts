import type { Day } from './CourseMeeting';

export interface CustomBlockDraft {
    name: string;
    days: Day[];
    /** Minutes since midnight, matching CourseMeeting. Retained when allDay is enabled. */
    startTime: number;
    endTime: number;
    allDay: boolean;
    syncAcrossAllSchedules: boolean;
    conflictHighlight: boolean;
}

export interface CustomBlock extends Omit<CustomBlockDraft, 'syncAcrossAllSchedules'> {
    id: string;
    /** null applies to every schedule, including schedules created later. */
    scheduleId: string | null;
}
