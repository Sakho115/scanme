import { ParticipantPassInfo } from './participant';
import { EventCode, EventSlug } from './event';

export type AttendanceType = 'OVERALL' | 'EVENT';

export interface AttendanceRecord {
  id: string; // UUID primary key
  participantId: string;
  attendanceType: AttendanceType;
  eventId?: string | null;
  coordinatorId?: string | null;
  checkinTime: string; // ISO 8601
  status: 'ENTERED' | 'CANCELLED';
  createdAt?: string;

  // Joined metadata for fast display and export
  participantName?: string;
  passId?: string;
  college?: string;
  department?: string;
  year?: string;
  coordinatorName?: string;
  eventName?: string;
  eventCode?: EventCode;
}

export type CheckinResultStatus =
  | 'SUCCESS'
  | 'ALREADY_CHECKED_IN'
  | 'INVALID_TOKEN'
  | 'UNAUTHORIZED_EVENT'
  | 'INACTIVE_PARTICIPANT'
  | 'ERROR';

export interface PreviousCheckinInfo {
  time: string;
  coordinatorName?: string;
  coordinatorId?: string;
  checkinId?: string;
  passId?: string;
  eventName?: string;
}

export interface ParticipantEventSelection {
  id: string;
  participantId: string;
  eventId: string;
  selectedAt: string;
  selectedBy?: string | null;
  createdAt?: string;
}

export interface SelectedEventInfo {
  id: string;
  code: string;
  name: string;
}

export interface CheckinResult {
  status: CheckinResultStatus;
  success: boolean;
  participant?: ParticipantPassInfo;
  previousCheckin?: PreviousCheckinInfo;
  checkin?: {
    id: string;
    checkinTime: string;
    status: string;
    attendanceType: AttendanceType;
    eventId?: string | null;
  };
  selectedEvents?: SelectedEventInfo[];
  error?: string;
}

export interface OverallStats {
  totalRegistered: number;
  overallCheckedIn: number;
  remaining: number;
  attendancePercentage: number;
  todayCount: number;
  recentCheckins: AttendanceRecord[];
  eventSelections?: {
    codeCrusade: number;
    logicArena: number;
    uiuxStudio: number;
    techTactics: number;
    pixelPulse: number;
  };
}

export interface EventStats {
  eventId: string;
  eventCode: EventCode;
  eventSlug: EventSlug;
  eventName: string;
  totalRegistered: number;
  overallAttendees: number;
  eventCheckins: number;
  selectedParticipants: number;
  selectedNotCheckedIn: number;
  remaining: number;
  attendancePercentage: number; // eventCheckins / totalRegistered * 100
  attendancePercentageAmongSelected: number; // eventCheckins / selectedParticipants * 100
  eventAttendanceRate: number; // eventCheckins / overallAttendees * 100
  recentCheckins: AttendanceRecord[];
}

export interface ClassificationFilters {
  college?: string;
  department?: string;
  year?: string;
  eventId?: string;
  eventSlug?: string;
  eventSelected?: string;
  attendanceType?: AttendanceType;
  status?: 'ENTERED' | 'NOT_ENTERED' | 'ALL';
  coordinatorId?: string;
  search?: string;
  startDate?: string;
  endDate?: string;
}

export interface ClassificationRow {
  index: number;
  passId: string;
  name: string;
  email?: string;
  phone?: string;
  college: string;
  department: string;
  year: string;
  checkinTime: string;
  formattedTime: string;
  coordinatorName: string;
  status: string;
  eventName?: string;
  attendanceType?: AttendanceType;

  // Event Selections (YES / NO)
  codeCrusadeSelected?: 'YES' | 'NO';
  logicArenaSelected?: 'YES' | 'NO';
  uiuxStudioSelected?: 'YES' | 'NO';
  techTacticsSelected?: 'YES' | 'NO';
  pixelPulseSelected?: 'YES' | 'NO';

  // Event Check-in Timestamps (timestamp / NOT CHECKED IN)
  codeCrusadeCheckin?: string;
  logicArenaCheckin?: string;
  uiuxStudioCheckin?: string;
  techTacticsCheckin?: string;
  pixelPulseCheckin?: string;

  selectedEvents?: string[];
}

export interface CollegeBreakdownRow {
  college: string;
  totalParticipants: number;
  overallAttendance: number;
  codeCrusade: number;
  logicArena: number;
  uiuxStudio: number;
  techTactics: number;
  pixelPulse: number;
}

export interface DepartmentBreakdownRow {
  college: string;
  department: string;
  year: string;
  totalParticipants: number;
  overallAttendance: number;
  codeCrusade: number;
  logicArena: number;
  uiuxStudio: number;
  techTactics: number;
  pixelPulse: number;
}

