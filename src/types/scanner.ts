import { ParticipantPassInfo } from './participant';
import { PreviousCheckinInfo, AttendanceType, SelectedEventInfo } from './attendance';

export type ScannerState =
  | 'idle'
  | 'scanning'
  | 'loading'
  | 'valid'
  | 'invalid'
  | 'duplicate'
  | 'confirming'
  | 'approved'
  | 'unauthorized'
  | 'network_error'
  | 'camera_error';

export interface ScanResultData {
  token: string;
  attendanceType: AttendanceType;
  eventId?: string | null;
  eventName?: string;
  participant?: ParticipantPassInfo;
  participantId?: string;
  previousCheckin?: PreviousCheckinInfo;
  selectedEvents?: SelectedEventInfo[];
  errorMessage?: string;
  approvedTime?: string;
}
