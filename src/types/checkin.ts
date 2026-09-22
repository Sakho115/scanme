/**
 * Check-in Record
 * Stored separately from the participant master sheet.
 * Records physical entry events at the desks.
 */
export interface Checkin {
  checkinId: string;
  participantId: string;
  passId: string;
  eventId: string;
  coordinatorId: string;
  checkinTime: string; // ISO 8601 string
  status: 'ENTERED';
  participantName?: string; // Cache for lightweight dashboard display
  college?: string;
}

export type CheckinStatus = 'NOT_CHECKED_IN' | 'ALREADY_CHECKED_IN' | 'INVALID';

export interface PreviousCheckinInfo {
  time: string;
  coordinatorId: string;
  passId?: string;
  checkinId?: string;
}

export interface CheckinStats {
  eventId: string;
  totalEntries: number;
  myEntries: number;
  recentCount: number;
}

export interface RecentCheckinItem {
  checkinId: string;
  passId: string;
  name: string;
  college: string;
  checkinTime: string;
  coordinatorId: string;
}
