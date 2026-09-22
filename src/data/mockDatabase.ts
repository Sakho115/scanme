import { Participant } from '../types/participant';
import { VyugamEvent, VYUGAM_EVENTS, getEventById } from '../types/event';
import { Coordinator } from '../types/coordinator';
import {
  AttendanceRecord,
  AttendanceType,
  CheckinResult,
  OverallStats,
  EventStats,
  ClassificationFilters,
  ClassificationRow,
  CollegeBreakdownRow,
  DepartmentBreakdownRow,
  ParticipantEventSelection,
  SelectedEventInfo
} from '../types/attendance';
import { formatTime } from '../utils/formatting';


// ------------------------------------------------------------
// SEED PARTICIPANTS
// ------------------------------------------------------------
export const SEED_PARTICIPANTS: Participant[] = [
  {
    id: "899238a9-74ec-79e2-9d9f-6f5d0821a200",
    internalId: "899238a974ec79e29d9f6f5d0821a200",
    name: "test_ashok",
    passId: "VYG26-00045",
    qrToken: "4c2c6c2c8a709e24fd0d256e25a072e7c9009077e0c7343b778948bcfdb8ee5e",
    college: "pacet",
    department: "IT",
    year: "III Year",
    registrationStatus: "ACTIVE",
    email: "fitalfivisual@gmail.com",
    phone: "9874561230"
  }
];

// ------------------------------------------------------------
// SEED COORDINATORS
// ------------------------------------------------------------
export const SEED_COORDINATORS: Coordinator[] = [
  {
    id: 'c1000000-0000-0000-0000-000000000001',
    coordinatorCode: 'ADMIN-01',
    name: 'Sakho115 (Admin)',
    role: 'ADMIN',
    eventId: null,
    active: true
  },
  {
    id: 'c1000000-0000-0000-0000-000000000002',
    coordinatorCode: 'CR-OVERALL',
    name: 'Ashwin Kumar (Overall)',
    role: 'OVERALL_COORDINATOR',
    eventId: null,
    active: true
  },
  {
    id: 'c1000000-0000-0000-0000-000000000003',
    coordinatorCode: 'CR-CODE',
    name: 'Rajesh K (Code Crusade)',
    role: 'EVENT_COORDINATOR',
    eventId: 'e1000000-0000-0000-0000-000000000001',
    assignedEventCode: 'CODE_CRUSADE',
    assignedEventSlug: 'code-crusade',
    assignedEventName: 'Code Crusade',
    active: true
  },
  {
    id: 'c1000000-0000-0000-0000-000000000004',
    coordinatorCode: 'CR-LOGIC',
    name: 'Meera S (Logic Arena)',
    role: 'EVENT_COORDINATOR',
    eventId: 'e2000000-0000-0000-0000-000000000002',
    assignedEventCode: 'LOGIC_ARENA',
    assignedEventSlug: 'logic-arena',
    assignedEventName: 'Logic Arena',
    active: true
  },
  {
    id: 'c1000000-0000-0000-0000-000000000005',
    coordinatorCode: 'CR-UIUX',
    name: 'Divya Bharathi (UI/UX)',
    role: 'EVENT_COORDINATOR',
    eventId: 'e3000000-0000-0000-0000-000000000003',
    assignedEventCode: 'UIUX_STUDIO',
    assignedEventSlug: 'uiux-studio',
    assignedEventName: 'UI/UX Studio',
    active: true
  },
  {
    id: 'c1000000-0000-0000-0000-000000000006',
    coordinatorCode: 'CR-TECH',
    name: 'Kavitha M (Tech Tactics)',
    role: 'EVENT_COORDINATOR',
    eventId: 'e4000000-0000-0000-0000-000000000004',
    assignedEventCode: 'TECH_TACTICS',
    assignedEventSlug: 'tech-tactics',
    assignedEventName: 'Tech Tactics',
    active: true
  },
  {
    id: 'c1000000-0000-0000-0000-000000000007',
    coordinatorCode: 'CR-PIXEL',
    name: 'Arun Prasath (Pixel Pulse)',
    role: 'EVENT_COORDINATOR',
    eventId: 'e5000000-0000-0000-0000-000000000005',
    assignedEventCode: 'PIXEL_PULSE',
    assignedEventSlug: 'pixel-pulse',
    assignedEventName: 'Pixel Pulse',
    active: true
  }
];

const STORAGE_KEY_ATTENDANCE = 'vyugam_supabase_attendance_mock_v2';
const STORAGE_KEY_EVENT_SELECTIONS = 'vyugam_supabase_event_selections_mock_v2';

class MockRelationalDatabase {
  private participants: Participant[] = [];
  private events: VyugamEvent[] = [...VYUGAM_EVENTS];
  private coordinators: Coordinator[] = [...SEED_COORDINATORS];
  private attendance: AttendanceRecord[] = [];
  private eventSelections: ParticipantEventSelection[] = [];

  constructor() {
    this.load();
  }

  private load(): void {
    // Single source of truth is Supabase PostgreSQL.
    // Local state is in-memory only for offline tests/demo and never persists as authoritative cross-device state.
    this.participants = [...SEED_PARTICIPANTS];
    this.attendance = [];
    this.eventSelections = [];

    // Clean up any legacy localStorage keys that may cause stale device mismatches
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        localStorage.removeItem(STORAGE_KEY_ATTENDANCE);
        localStorage.removeItem(STORAGE_KEY_EVENT_SELECTIONS);
      } catch {}
    }
  }

  private save(): void {
    // Do NOT write attendance to localStorage. Supabase PostgreSQL is the single source of truth.
  }

  // ------------------------------------------------------------
  // QUERIES
  // ------------------------------------------------------------
  public getParticipants(): Participant[] {
    return this.participants;
  }

  public getEvents(): VyugamEvent[] {
    return this.events;
  }

  public getCoordinators(): Coordinator[] {
    return this.coordinators;
  }

  public findParticipantByQr(token: string): Participant | undefined {
    const clean = token.toLowerCase().trim();
    return this.participants.find(p => 
      p.qrToken.toLowerCase() === clean ||
      (p.passId && p.passId.toLowerCase() === clean) ||
      (p.internalId && p.internalId.toLowerCase() === clean) ||
      p.id.toLowerCase() === clean
    );
  }

  public findParticipantById(id: string): Participant | undefined {
    return this.participants.find(p => p.id === id || p.internalId === id);
  }

  public findCoordinatorByCode(code: string): Coordinator | undefined {
    const clean = code.toUpperCase().trim();
    return this.coordinators.find(c => c.coordinatorCode === clean);
  }

  // ------------------------------------------------------------
  // ATOMIC CHECK-IN RPC REPLICATION
  // ------------------------------------------------------------
  public verifyAndCheckin(params: {
    qrToken: string;
    attendanceType: AttendanceType;
    eventId?: string | null;
    coordinatorId?: string | null;
    eventIds?: string[] | null;
  }): CheckinResult {
    const { qrToken, attendanceType, eventId, coordinatorId, eventIds } = params;

    // 1. Validate attendance type
    if (attendanceType !== 'OVERALL' && attendanceType !== 'EVENT') {
      return {
        status: 'ERROR',
        success: false,
        error: 'Invalid attendance type. Must be OVERALL or EVENT.'
      };
    }

    // 2. Validate event if EVENT attendance
    let targetEvent: VyugamEvent | undefined;
    if (attendanceType === 'EVENT') {
      if (!eventId) {
        return {
          status: 'ERROR',
          success: false,
          error: 'Event is required for EVENT attendance.'
        };
      }
      targetEvent = getEventById(eventId) || this.events.find(e => e.slug === eventId || e.code === eventId);
      if (!targetEvent) {
        return {
          status: 'ERROR',
          success: false,
          error: 'Event not found.'
        };
      }
      if (targetEvent.status !== 'ACTIVE') {
        return {
          status: 'ERROR',
          success: false,
          error: 'This event is not currently active.'
        };
      }
    }

    // 3. Validate coordinator authorization
    let coordinator: Coordinator | undefined;
    if (coordinatorId) {
      coordinator = this.coordinators.find(c => c.id === coordinatorId || c.coordinatorCode === coordinatorId);
      if (!coordinator || !coordinator.active) {
        return {
          status: 'ERROR',
          success: false,
          error: 'Coordinator account is inactive or not found.'
        };
      }

      // Event coordinator boundary check
      if (coordinator.role === 'EVENT_COORDINATOR') {
        if (attendanceType === 'OVERALL' || (targetEvent && coordinator.eventId !== targetEvent.id)) {
          return {
            status: 'UNAUTHORIZED_EVENT',
            success: false,
            error: 'You are not authorized to record attendance for this section.'
          };
        }
      }
    }

    // 4. Find participant by QR token
    const participant = this.findParticipantByQr(qrToken);
    if (!participant) {
      return {
        status: 'INVALID_TOKEN',
        success: false,
        error: 'This QR code is not registered for this event.'
      };
    }

    if (participant.registrationStatus !== 'ACTIVE') {
      return {
        status: 'INACTIVE_PARTICIPANT',
        success: false,
        error: 'Participant registration is inactive or suspended.'
      };
    }

    // 5. Check duplicate attendance
    let existingAttendance: AttendanceRecord | undefined;
    if (attendanceType === 'OVERALL') {
      existingAttendance = this.attendance.find(
        a => a.participantId === participant.id && a.attendanceType === 'OVERALL'
      );
    } else {
      existingAttendance = this.attendance.find(
        a => a.participantId === participant.id && a.attendanceType === 'EVENT' && a.eventId === targetEvent!.id
      );
    }

    if (existingAttendance) {
      const prevCoord = this.coordinators.find(c => c.id === existingAttendance?.coordinatorId);
      const existingSelections = attendanceType === 'OVERALL'
        ? this.getParticipantEventSelections(participant.id)
        : undefined;

      return {
        status: 'ALREADY_CHECKED_IN',
        success: true,
        participant: {
          id: participant.id,
          participantId: participant.internalId,
          passId: participant.passId || 'UNISSUED',
          name: participant.name,
          college: participant.college,
          department: participant.department,
          year: participant.year
        },
        previousCheckin: {
          time: existingAttendance.checkinTime,
          coordinatorName: prevCoord ? prevCoord.name : 'Desk Coordinator',
          coordinatorId: existingAttendance.coordinatorId || undefined,
          checkinId: existingAttendance.id,
          passId: participant.passId || 'UNISSUED',
          eventName: targetEvent?.name
        },
        selectedEvents: existingSelections
      };
    }

    // 6. Validate selected events if OVERALL attendance
    if (attendanceType === 'OVERALL' && eventIds && eventIds.length > 0) {
      for (const eid of eventIds) {
        const ev = this.events.find(e => e.id === eid || e.slug === eid || e.code === eid);
        if (!ev) {
          return {
            status: 'ERROR',
            success: false,
            error: 'One or more selected events do not exist.'
          };
        }
        if (ev.status !== 'ACTIVE') {
          return {
            status: 'ERROR',
            success: false,
            error: `Event '${ev.name}' is not currently active.`
          };
        }
      }
    }

    // 7. Record new attendance
    const newRecord: AttendanceRecord = {
      id: `a${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      participantId: participant.id,
      attendanceType,
      eventId: targetEvent ? targetEvent.id : null,
      coordinatorId: coordinator ? coordinator.id : null,
      checkinTime: new Date().toISOString(),
      status: 'ENTERED'
    };

    this.attendance.unshift(newRecord);

    // 8. Record event selections if OVERALL attendance
    if (attendanceType === 'OVERALL' && eventIds && eventIds.length > 0) {
      for (const eid of eventIds) {
        const ev = this.events.find(e => e.id === eid || e.slug === eid || e.code === eid)!;
        if (!this.eventSelections.some(s => s.participantId === participant.id && s.eventId === ev.id)) {
          this.eventSelections.push({
            id: `pes-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
            participantId: participant.id,
            eventId: ev.id,
            selectedAt: new Date().toISOString(),
            selectedBy: coordinator ? coordinator.id : null,
            createdAt: new Date().toISOString()
          });
        }
      }
    }

    this.save();

    const selectedEvents = attendanceType === 'OVERALL'
      ? this.getParticipantEventSelections(participant.id)
      : undefined;

    return {
      status: 'SUCCESS',
      success: true,
      participant: {
        id: participant.id,
        participantId: participant.internalId,
        passId: participant.passId || 'UNISSUED',
        name: participant.name,
        college: participant.college,
        department: participant.department,
        year: participant.year
      },
      checkin: {
        id: newRecord.id,
        checkinTime: newRecord.checkinTime,
        status: newRecord.status,
        attendanceType: newRecord.attendanceType,
        eventId: newRecord.eventId
      },
      selectedEvents
    };
  }

  public getParticipantEventSelections(participantId: string): SelectedEventInfo[] {
    return this.eventSelections
      .filter(s => s.participantId === participantId)
      .map(s => {
        const ev = this.events.find(e => e.id === s.eventId);
        return {
          id: s.eventId,
          code: ev?.code || '',
          name: ev?.name || ''
        };
      });
  }

  public updateParticipantEventSelections(params: {
    participantId: string;
    eventIds: string[];
    coordinatorId?: string | null;
  }): { status: string; success: boolean; selectedEvents?: SelectedEventInfo[]; error?: string } {
    const { participantId, eventIds, coordinatorId } = params;

    if (coordinatorId) {
      const coord = this.coordinators.find(c => c.id === coordinatorId || c.coordinatorCode === coordinatorId);
      if (!coord || (coord.role !== 'ADMIN' && coord.role !== 'OVERALL_COORDINATOR')) {
        return {
          status: 'UNAUTHORIZED_COORDINATOR',
          success: false,
          error: 'Only Admins or Overall Coordinators can update event selections.'
        };
      }
    }

    for (const eid of eventIds) {
      const ev = this.events.find(e => e.id === eid || e.slug === eid || e.code === eid);
      if (!ev) {
        return { status: 'ERROR', success: false, error: 'One or more selected events do not exist.' };
      }
      if (ev.status !== 'ACTIVE') {
        return { status: 'ERROR', success: false, error: `Event '${ev.name}' is not currently active.` };
      }
    }

    // Atomic replace
    this.eventSelections = this.eventSelections.filter(s => s.participantId !== participantId);
    for (const eid of eventIds) {
      const ev = this.events.find(e => e.id === eid || e.slug === eid || e.code === eid)!;
      this.eventSelections.push({
        id: `pes-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        participantId,
        eventId: ev.id,
        selectedAt: new Date().toISOString(),
        selectedBy: coordinatorId || null,
        createdAt: new Date().toISOString()
      });
    }
    this.save();

    return {
      status: 'SUCCESS',
      success: true,
      selectedEvents: this.getParticipantEventSelections(participantId)
    };
  }

  // ------------------------------------------------------------
  // STATISTICS & AGGREGATIONS
  // ------------------------------------------------------------
  public getOverallStats(): OverallStats {
    const totalRegistered = this.participants.length;
    const overallRecords = this.attendance.filter(a => a.attendanceType === 'OVERALL');
    const overallCheckedIn = overallRecords.length;
    const remaining = Math.max(0, totalRegistered - overallCheckedIn);
    const attendancePercentage = totalRegistered > 0 ? Number(((overallCheckedIn / totalRegistered) * 100).toFixed(2)) : 0;

    const recent = overallRecords.slice(0, 10).map(a => this.enrichRecord(a));

    const codeCrusadeEv = this.events.find(e => e.code === 'CODE_CRUSADE');
    const logicArenaEv = this.events.find(e => e.code === 'LOGIC_ARENA');
    const uiuxStudioEv = this.events.find(e => e.code === 'UIUX_STUDIO');
    const techTacticsEv = this.events.find(e => e.code === 'TECH_TACTICS');
    const pixelPulseEv = this.events.find(e => e.code === 'PIXEL_PULSE');

    const eventSelections = {
      codeCrusade: codeCrusadeEv ? this.eventSelections.filter(s => s.eventId === codeCrusadeEv.id).length : 0,
      logicArena: logicArenaEv ? this.eventSelections.filter(s => s.eventId === logicArenaEv.id).length : 0,
      uiuxStudio: uiuxStudioEv ? this.eventSelections.filter(s => s.eventId === uiuxStudioEv.id).length : 0,
      techTactics: techTacticsEv ? this.eventSelections.filter(s => s.eventId === techTacticsEv.id).length : 0,
      pixelPulse: pixelPulseEv ? this.eventSelections.filter(s => s.eventId === pixelPulseEv.id).length : 0
    };

    return {
      totalRegistered,
      overallCheckedIn,
      remaining,
      attendancePercentage,
      todayCount: overallCheckedIn,
      recentCheckins: recent,
      eventSelections
    };
  }

  public getEventStats(eventIdOrSlug: string): EventStats | null {
    const event = getEventById(eventIdOrSlug) || this.events.find(e => e.slug === eventIdOrSlug || e.code === eventIdOrSlug);
    if (!event) return null;

    const totalRegistered = this.participants.length;
    const overallAttendees = this.attendance.filter(a => a.attendanceType === 'OVERALL').length;
    const eventRecords = this.attendance.filter(a => a.attendanceType === 'EVENT' && a.eventId === event.id);
    const eventCheckins = eventRecords.length;
    const remaining = Math.max(0, totalRegistered - eventCheckins);
    const attendancePercentage = totalRegistered > 0 ? Number(((eventCheckins / totalRegistered) * 100).toFixed(2)) : 0;
    const eventAttendanceRate = overallAttendees > 0 ? Number(((eventCheckins / overallAttendees) * 100).toFixed(2)) : 0;

    // Selection metrics
    const selectedParticipants = this.eventSelections.filter(s => s.eventId === event.id).length;
    const selectedNotCheckedIn = Math.max(0, selectedParticipants - eventCheckins);
    const attendancePercentageAmongSelected = selectedParticipants > 0
      ? Number(((eventCheckins / selectedParticipants) * 100).toFixed(2))
      : 0;

    const recent = eventRecords.slice(0, 10).map(a => this.enrichRecord(a));

    return {
      eventId: event.id,
      eventCode: event.code,
      eventSlug: event.slug,
      eventName: event.name,
      totalRegistered,
      overallAttendees,
      eventCheckins,
      selectedParticipants,
      selectedNotCheckedIn,
      remaining,
      attendancePercentage,
      attendancePercentageAmongSelected,
      eventAttendanceRate,
      recentCheckins: recent
    };
  }

  public getClassificationRows(filters: ClassificationFilters): ClassificationRow[] {
    let dataset = [...this.participants];

    // Filter by college
    if (filters.college && filters.college !== 'ALL') {
      dataset = dataset.filter(p => p.college.toLowerCase() === filters.college!.toLowerCase());
    }

    // Filter by department
    if (filters.department && filters.department !== 'ALL') {
      dataset = dataset.filter(p => p.department.toLowerCase() === filters.department!.toLowerCase());
    }

    // Filter by year
    if (filters.year && filters.year !== 'ALL') {
      dataset = dataset.filter(p => p.year.toLowerCase() === filters.year!.toLowerCase());
    }

    // Filter by search string
    if (filters.search && filters.search.trim()) {
      const q = filters.search.toLowerCase().trim();
      dataset = dataset.filter(
        p =>
          p.name.toLowerCase().includes(q) ||
          (p.passId && p.passId.toLowerCase().includes(q)) ||
          p.qrToken.toLowerCase().includes(q) ||
          p.college.toLowerCase().includes(q) ||
          p.department.toLowerCase().includes(q)
      );
    }

    // Filter by eventSelected if specified
    if (filters.eventSelected && filters.eventSelected !== 'ALL') {
      const targetEv = this.events.find(
        e => e.id === filters.eventSelected || e.slug === filters.eventSelected || e.code === filters.eventSelected
      );
      if (targetEv) {
        dataset = dataset.filter(p =>
          this.eventSelections.some(s => s.participantId === p.id && s.eventId === targetEv.id)
        );
      }
    }

    // Determine target attendance records
    let targetEventId: string | undefined;
    if (filters.eventSlug) {
      const e = this.events.find(ev => ev.slug === filters.eventSlug);
      if (e) targetEventId = e.id;
    } else if (filters.eventId) {
      targetEventId = filters.eventId;
    }

    const codeCrusadeEv = this.events.find(e => e.code === 'CODE_CRUSADE');
    const logicArenaEv = this.events.find(e => e.code === 'LOGIC_ARENA');
    const uiuxStudioEv = this.events.find(e => e.code === 'UIUX_STUDIO');
    const techTacticsEv = this.events.find(e => e.code === 'TECH_TACTICS');
    const pixelPulseEv = this.events.find(e => e.code === 'PIXEL_PULSE');

    const rows: ClassificationRow[] = [];

    dataset.forEach(p => {
      // Overall attendance: strictly attendanceType = 'OVERALL' AND status = 'ENTERED'
      const overallAtt = this.attendance.find(
        a => a.participantId === p.id && a.attendanceType === 'OVERALL' && a.status === 'ENTERED'
      );

      // Event attendance: strictly attendanceType = 'EVENT' AND eventId = targetEventId AND status = 'ENTERED'
      const targetEventAtt = targetEventId
        ? this.attendance.find(
            a => a.participantId === p.id && a.attendanceType === 'EVENT' && a.eventId === targetEventId && a.status === 'ENTERED'
          )
        : undefined;

      // Authoritative definition of ENTERED
      const isEntered = targetEventId
        ? Boolean(targetEventAtt)
        : Boolean(overallAtt);

      // Status filtering:
      // When user chooses "Entered Participants", only entered participants are included.
      if (filters.status === 'ENTERED' && !isEntered) return;
      if (filters.status === 'NOT_ENTERED' && isEntered) return;

      // Check coordinator filter
      const relevantAtt = targetEventId ? targetEventAtt : overallAtt;
      if (filters.coordinatorId && filters.coordinatorId !== 'ALL') {
        if (!relevantAtt || relevantAtt.coordinatorId !== filters.coordinatorId) return;
      }

      const coord = relevantAtt?.coordinatorId
        ? this.coordinators.find(c => c.id === relevantAtt.coordinatorId)
        : undefined;

      const ev = relevantAtt?.eventId
        ? this.events.find(e => e.id === relevantAtt.eventId)
        : undefined;

      // Selections
      const hasCC = codeCrusadeEv && this.eventSelections.some(s => s.participantId === p.id && s.eventId === codeCrusadeEv.id);
      const hasLA = logicArenaEv && this.eventSelections.some(s => s.participantId === p.id && s.eventId === logicArenaEv.id);
      const hasUI = uiuxStudioEv && this.eventSelections.some(s => s.participantId === p.id && s.eventId === uiuxStudioEv.id);
      const hasTT = techTacticsEv && this.eventSelections.some(s => s.participantId === p.id && s.eventId === techTacticsEv.id);
      const hasPP = pixelPulseEv && this.eventSelections.some(s => s.participantId === p.id && s.eventId === pixelPulseEv.id);

      // Event Check-ins
      const ccAtt = codeCrusadeEv ? this.attendance.find(a => a.participantId === p.id && a.attendanceType === 'EVENT' && a.eventId === codeCrusadeEv.id && a.status === 'ENTERED') : undefined;
      const laAtt = logicArenaEv ? this.attendance.find(a => a.participantId === p.id && a.attendanceType === 'EVENT' && a.eventId === logicArenaEv.id && a.status === 'ENTERED') : undefined;
      const uiAtt = uiuxStudioEv ? this.attendance.find(a => a.participantId === p.id && a.attendanceType === 'EVENT' && a.eventId === uiuxStudioEv.id && a.status === 'ENTERED') : undefined;
      const ttAtt = techTacticsEv ? this.attendance.find(a => a.participantId === p.id && a.attendanceType === 'EVENT' && a.eventId === techTacticsEv.id && a.status === 'ENTERED') : undefined;
      const ppAtt = pixelPulseEv ? this.attendance.find(a => a.participantId === p.id && a.attendanceType === 'EVENT' && a.eventId === pixelPulseEv.id && a.status === 'ENTERED') : undefined;

      rows.push({
        index: rows.length + 1,
        passId: p.passId || 'UNISSUED',
        name: p.name,
        email: p.email,
        phone: p.phone,
        college: p.college,
        department: p.department,
        year: p.year,
        checkinTime: relevantAtt?.checkinTime || '',
        formattedTime: relevantAtt?.checkinTime ? formatTime(relevantAtt.checkinTime) : 'Not Entered',
        coordinatorName: coord ? coord.name : relevantAtt ? 'Desk' : '-',
        status: isEntered ? 'ENTERED' : 'NOT ENTERED',
        eventName: ev ? ev.name : targetEventId ? 'Event Entry' : 'Overall Entry',
        attendanceType: relevantAtt?.attendanceType || (targetEventId ? 'EVENT' : 'OVERALL'),

        codeCrusadeSelected: hasCC ? 'YES' : 'NO',
        logicArenaSelected: hasLA ? 'YES' : 'NO',
        uiuxStudioSelected: hasUI ? 'YES' : 'NO',
        techTacticsSelected: hasTT ? 'YES' : 'NO',
        pixelPulseSelected: hasPP ? 'YES' : 'NO',

        codeCrusadeCheckin: ccAtt?.checkinTime ? formatTime(ccAtt.checkinTime) : 'NOT CHECKED IN',
        logicArenaCheckin: laAtt?.checkinTime ? formatTime(laAtt.checkinTime) : 'NOT CHECKED IN',
        uiuxStudioCheckin: uiAtt?.checkinTime ? formatTime(uiAtt.checkinTime) : 'NOT CHECKED IN',
        techTacticsCheckin: ttAtt?.checkinTime ? formatTime(ttAtt.checkinTime) : 'NOT CHECKED IN',
        pixelPulseCheckin: ppAtt?.checkinTime ? formatTime(ppAtt.checkinTime) : 'NOT CHECKED IN'
      });
    });

    return rows;
  }

  public getCollegeBreakdown(): CollegeBreakdownRow[] {
    const collegeMap = new Map<string, CollegeBreakdownRow>();

    // Initialize colleges
    this.participants.forEach(p => {
      if (!collegeMap.has(p.college)) {
        collegeMap.set(p.college, {
          college: p.college,
          totalParticipants: 0,
          overallAttendance: 0,
          codeCrusade: 0,
          logicArena: 0,
          uiuxStudio: 0,
          techTactics: 0,
          pixelPulse: 0
        });
      }
      collegeMap.get(p.college)!.totalParticipants++;
    });

    // Populate attendances
    this.attendance.forEach(a => {
      const p = this.findParticipantById(a.participantId);
      if (!p || !collegeMap.has(p.college)) return;
      const row = collegeMap.get(p.college)!;

      if (a.attendanceType === 'OVERALL') {
        row.overallAttendance++;
      } else if (a.attendanceType === 'EVENT' && a.eventId) {
        const ev = getEventById(a.eventId);
        if (ev?.code === 'CODE_CRUSADE') row.codeCrusade++;
        else if (ev?.code === 'LOGIC_ARENA') row.logicArena++;
        else if (ev?.code === 'UIUX_STUDIO') row.uiuxStudio++;
        else if (ev?.code === 'TECH_TACTICS') row.techTactics++;
        else if (ev?.code === 'PIXEL_PULSE') row.pixelPulse++;
      }
    });

    return Array.from(collegeMap.values()).sort((a, b) => b.totalParticipants - a.totalParticipants);
  }

  public getDepartmentBreakdown(): DepartmentBreakdownRow[] {
    const keyMap = new Map<string, DepartmentBreakdownRow>();

    this.participants.forEach(p => {
      const key = `${p.college}||${p.department}||${p.year}`;
      if (!keyMap.has(key)) {
        keyMap.set(key, {
          college: p.college,
          department: p.department,
          year: p.year,
          totalParticipants: 0,
          overallAttendance: 0,
          codeCrusade: 0,
          logicArena: 0,
          uiuxStudio: 0,
          techTactics: 0,
          pixelPulse: 0
        });
      }
      keyMap.get(key)!.totalParticipants++;
    });

    this.attendance.forEach(a => {
      const p = this.findParticipantById(a.participantId);
      if (!p) return;
      const key = `${p.college}||${p.department}||${p.year}`;
      const row = keyMap.get(key);
      if (!row) return;

      if (a.attendanceType === 'OVERALL') {
        row.overallAttendance++;
      } else if (a.attendanceType === 'EVENT' && a.eventId) {
        const ev = getEventById(a.eventId);
        if (ev?.code === 'CODE_CRUSADE') row.codeCrusade++;
        else if (ev?.code === 'LOGIC_ARENA') row.logicArena++;
        else if (ev?.code === 'UIUX_STUDIO') row.uiuxStudio++;
        else if (ev?.code === 'TECH_TACTICS') row.techTactics++;
        else if (ev?.code === 'PIXEL_PULSE') row.pixelPulse++;
      }
    });

    return Array.from(keyMap.values()).sort((a, b) => b.totalParticipants - a.totalParticipants);
  }

  public resetDemoData(): void {
    this.participants = [...SEED_PARTICIPANTS];
    this.attendance = [];
    this.eventSelections = [];
    this.save();
  }

  public resetScanData(): void {
    this.attendance = [];
    this.eventSelections = [];
    this.save();
  }

  public syncLiveState(participants?: Participant[], attendance?: AttendanceRecord[], eventSelections?: ParticipantEventSelection[]): void {
    if (participants && participants.length > 0) {
      this.participants = participants;
    }
    if (attendance !== undefined) {
      this.attendance = attendance;
    }
    if (eventSelections !== undefined) {
      this.eventSelections = eventSelections;
    }
    this.save();
  }

  private enrichRecord(record: AttendanceRecord): AttendanceRecord {
    const p = this.findParticipantById(record.participantId);
    const coord = record.coordinatorId ? this.coordinators.find(c => c.id === record.coordinatorId) : undefined;
    const ev = record.eventId ? this.events.find(e => e.id === record.eventId) : undefined;

    return {
      ...record,
      participantName: p?.name,
      passId: p?.passId,
      college: p?.college,
      department: p?.department,
      year: p?.year,
      coordinatorName: coord?.name,
      eventName: ev?.name,
      eventCode: ev?.code
    };
  }
}

export const mockDatabase = new MockRelationalDatabase();
