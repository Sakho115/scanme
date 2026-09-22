import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { mockDatabase } from '../data/mockDatabase';
import {
  AttendanceType,
  CheckinResult,
  OverallStats,
  EventStats,
  ClassificationFilters,
  ClassificationRow,
  CollegeBreakdownRow,
  DepartmentBreakdownRow,
  SelectedEventInfo,
  PreviousCheckinInfo
} from '../types/attendance';
import { ParticipantPassInfo } from '../types/participant';


class AttendanceService {
  /**
   * Atomic verification and check-in operation.
   * Calls Supabase PostgreSQL RPC function `verify_and_checkin`.
   * Never fakes checkin locally if Supabase write fails.
   */
  async verifyAndCheckin(params: {
    qrToken: string;
    attendanceType: AttendanceType;
    eventId?: string | null;
    coordinatorId?: string | null;
    eventIds?: string[] | null;
  }): Promise<CheckinResult> {
    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase.rpc('verify_and_checkin', {
          p_qr_token: params.qrToken,
          p_attendance_type: params.attendanceType,
          p_event_id: params.eventId || null,
          p_coordinator_id: params.coordinatorId || null,
          p_event_ids: params.eventIds || null
        });

        if (error) {
          console.error('Supabase RPC error:', error);
          return {
            status: 'ERROR',
            success: false,
            error: error.message || 'Database transaction error'
          };
        }

        return data as CheckinResult;
      } catch (err: any) {
        console.error('Attendance RPC call failed:', err);
        return {
          status: 'ERROR',
          success: false,
          error: 'Unable to record attendance. Please check the connection and try again.'
        };
      }
    }

    // Fallback to local relational mock database ONLY for offline/testing/demo mode
    return mockDatabase.verifyAndCheckin(params);
  }

  /**
   * Explicitly update participant event selections post-overall checkin.
   */
  async updateEventSelections(params: {
    participantId: string;
    eventIds: string[];
    coordinatorId?: string | null;
  }): Promise<{ status: string; success: boolean; selectedEvents?: any[]; error?: string }> {
    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase.rpc('update_participant_event_selections', {
          p_participant_id: params.participantId,
          p_event_ids: params.eventIds,
          p_coordinator_id: params.coordinatorId || null
        });

        if (error) {
          console.error('Supabase update selections RPC error:', error);
          return {
            status: 'ERROR',
            success: false,
            error: error.message || 'Failed to update selections'
          };
        }

        return data;
      } catch (err: any) {
        console.error('Update event selections failed:', err);
        return {
          status: 'ERROR',
          success: false,
          error: 'Unable to update event selections. Please check the connection and try again.'
        };
      }
    }

    return mockDatabase.updateParticipantEventSelections(params);
  }

  /**
   * Fetch Overall Attendance statistics from Supabase (Single Source of Truth).
   */
  async getOverallStats(): Promise<OverallStats> {
    if (isSupabaseConfigured()) {
      try {
        const [
          { count: totalRegistered },
          { count: overallCheckedIn },
          { data: recent },
          { data: eventsData },
          { data: selectionsData }
        ] = await Promise.all([
          supabase.from('participants').select('*', { count: 'exact', head: true }),
          supabase
            .from('attendance')
            .select('*', { count: 'exact', head: true })
            .eq('attendance_type', 'OVERALL')
            .eq('status', 'ENTERED'),
          supabase
            .from('attendance')
            .select(`
              id, participant_id, attendance_type, event_id, coordinator_id, checkin_time, status,
              participants (name, pass_id, college, department, year),
              coordinators (name)
            `)
            .eq('attendance_type', 'OVERALL')
            .eq('status', 'ENTERED')
            .order('checkin_time', { ascending: false })
            .limit(10),
          supabase.from('events').select('id, code'),
          supabase.from('participant_event_selections').select('event_id')
        ]);

        const total = totalRegistered || 0;
        const checked = overallCheckedIn || 0;
        const remaining = Math.max(0, total - checked);
        const percentage = total > 0 ? Number(((checked / total) * 100).toFixed(2)) : 0;

        const enrichedRecent = (recent || []).map((r: any) => ({
          id: r.id,
          participantId: r.participant_id,
          attendanceType: r.attendance_type,
          eventId: r.event_id,
          coordinatorId: r.coordinator_id,
          checkinTime: r.checkin_time,
          status: r.status,
          participantName: r.participants?.name,
          passId: r.participants?.pass_id,
          college: r.participants?.college,
          department: r.participants?.department,
          year: r.participants?.year,
          coordinatorName: r.coordinators?.name
        }));

        // Compute event selections by event code
        const eventMap = new Map((eventsData || []).map((e: any) => [e.id, e.code]));
        const eventSelections = {
          codeCrusade: 0,
          logicArena: 0,
          uiuxStudio: 0,
          techTactics: 0,
          pixelPulse: 0
        };

        (selectionsData || []).forEach((s: any) => {
          const code = eventMap.get(s.event_id);
          if (code === 'CODE_CRUSADE') eventSelections.codeCrusade++;
          else if (code === 'LOGIC_ARENA') eventSelections.logicArena++;
          else if (code === 'UIUX_STUDIO') eventSelections.uiuxStudio++;
          else if (code === 'TECH_TACTICS') eventSelections.techTactics++;
          else if (code === 'PIXEL_PULSE') eventSelections.pixelPulse++;
        });

        return {
          totalRegistered: total,
          overallCheckedIn: checked,
          remaining,
          attendancePercentage: percentage,
          todayCount: checked,
          recentCheckins: enrichedRecent,
          eventSelections
        };
      } catch (err) {
        console.error('Failed to fetch overall stats from Supabase:', err);
      }
    }

    return mockDatabase.getOverallStats();
  }

  /**
   * Fetch Event Attendance statistics for one of the 5 events from Supabase.
   */
  async getEventStats(eventSlugOrId: string): Promise<EventStats | null> {
    if (isSupabaseConfigured()) {
      try {
        // Resolve event
        const { data: eventData } = await supabase
          .from('events')
          .select('*')
          .or(`id.eq.${eventSlugOrId},code.ilike.${eventSlugOrId.replace('-', '_')}`)
          .single();

        if (eventData) {
          const [
            { count: totalRegistered },
            { count: overallAttendees },
            { count: eventCheckins },
            { count: selectedCount },
            { data: recent }
          ] = await Promise.all([
            supabase.from('participants').select('*', { count: 'exact', head: true }),
            supabase
              .from('attendance')
              .select('*', { count: 'exact', head: true })
              .eq('attendance_type', 'OVERALL')
              .eq('status', 'ENTERED'),
            supabase
              .from('attendance')
              .select('*', { count: 'exact', head: true })
              .eq('attendance_type', 'EVENT')
              .eq('event_id', eventData.id)
              .eq('status', 'ENTERED'),
            supabase
              .from('participant_event_selections')
              .select('*', { count: 'exact', head: true })
              .eq('event_id', eventData.id),
            supabase
              .from('attendance')
              .select(`
                id, participant_id, attendance_type, event_id, coordinator_id, checkin_time, status,
                participants (name, pass_id, college, department, year),
                coordinators (name)
              `)
              .eq('attendance_type', 'EVENT')
              .eq('event_id', eventData.id)
              .eq('status', 'ENTERED')
              .order('checkin_time', { ascending: false })
              .limit(10)
          ]);

          const total = totalRegistered || 0;
          const overall = overallAttendees || 0;
          const eventCount = eventCheckins || 0;
          const selected = selectedCount || 0;
          const remaining = Math.max(0, total - eventCount);
          const attPct = total > 0 ? Number(((eventCount / total) * 100).toFixed(2)) : 0;
          const rate = overall > 0 ? Number(((eventCount / overall) * 100).toFixed(2)) : 0;
          const selectedNotCheckedIn = Math.max(0, selected - eventCount);
          const attAmongSelected = selected > 0 ? Number(((eventCount / selected) * 100).toFixed(2)) : 0;

          const enrichedRecent = (recent || []).map((r: any) => ({
            id: r.id,
            participantId: r.participant_id,
            attendanceType: r.attendance_type,
            eventId: r.event_id,
            coordinatorId: r.coordinator_id,
            checkinTime: r.checkin_time,
            status: r.status,
            participantName: r.participants?.name,
            passId: r.participants?.pass_id,
            college: r.participants?.college,
            department: r.participants?.department,
            year: r.participants?.year,
            coordinatorName: r.coordinators?.name
          }));

          return {
            eventId: eventData.id,
            eventCode: eventData.code,
            eventSlug: eventData.code.toLowerCase().replace('_', '-') as any,
            eventName: eventData.name,
            totalRegistered: total,
            overallAttendees: overall,
            eventCheckins: eventCount,
            selectedParticipants: selected,
            selectedNotCheckedIn,
            remaining,
            attendancePercentage: attPct,
            attendancePercentageAmongSelected: attAmongSelected,
            eventAttendanceRate: rate,
            recentCheckins: enrichedRecent
          };
        }
      } catch (err) {
        console.error('Failed to fetch event stats from Supabase:', err);
      }
    }

    return mockDatabase.getEventStats(eventSlugOrId);
  }

  /**
   * Single Canonical Filtered Dataset for Dashboards, Reports, and all Exporters.
   * All export formats (Excel, CSV, PDF, Print) consume this exact dataset.
   */
  async getFilteredParticipants(filters: ClassificationFilters): Promise<ClassificationRow[]> {
    if (isSupabaseConfigured()) {
      try {
        let query = supabase.from('participants').select('*');
        if (filters.college && filters.college !== 'ALL') {
          query = query.ilike('college', filters.college);
        }
        if (filters.department && filters.department !== 'ALL') {
          query = query.ilike('department', filters.department);
        }
        if (filters.year && filters.year !== 'ALL') {
          query = query.ilike('year', filters.year);
        }
        if (filters.search && filters.search.trim()) {
          const q = filters.search.trim();
          query = query.or(`name.ilike.%${q}%,pass_id.ilike.%${q}%,qr_token.ilike.%${q}%,college.ilike.%${q}%,department.ilike.%${q}%`);
        }

        const [
          { data: parts, error: partsErr },
          { data: atts },
          { data: sels },
          { data: evs },
          { data: coords }
        ] = await Promise.all([
          query,
          supabase.from('attendance').select('*').eq('status', 'ENTERED'),
          supabase.from('participant_event_selections').select('*'),
          supabase.from('events').select('id, code, name, slug'),
          supabase.from('coordinators').select('id, name, coordinator_code')
        ]);

        if (!partsErr && parts) {
          return this.buildCanonicalRows(
            parts,
            atts || [],
            sels || [],
            evs || [],
            coords || [],
            filters
          );
        }
      } catch (err) {
        console.error('getFilteredParticipants from Supabase failed:', err);
      }
    }

    return mockDatabase.getClassificationRows(filters);
  }

  private buildCanonicalRows(
    parts: any[],
    atts: any[],
    sels: any[],
    evs: any[],
    coords: any[],
    filters: ClassificationFilters
  ): ClassificationRow[] {
    const codeCrusadeEv = evs.find(e => e.code === 'CODE_CRUSADE');
    const logicArenaEv = evs.find(e => e.code === 'LOGIC_ARENA');
    const uiuxStudioEv = evs.find(e => e.code === 'UIUX_STUDIO');
    const techTacticsEv = evs.find(e => e.code === 'TECH_TACTICS');
    const pixelPulseEv = evs.find(e => e.code === 'PIXEL_PULSE');

    let targetEventId: string | undefined;
    if (filters.eventSlug) {
      const e = evs.find(ev => ev.slug === filters.eventSlug);
      if (e) targetEventId = e.id;
    } else if (filters.eventId) {
      targetEventId = filters.eventId;
    }

    const rows: ClassificationRow[] = [];

    parts.forEach(p => {
      // Overall attendance: strictly attendance_type = 'OVERALL' AND status = 'ENTERED'
      const overallAtt = atts.find(
        a => a.participant_id === p.id && a.attendance_type === 'OVERALL' && a.status === 'ENTERED'
      );

      // Event attendance: strictly attendance_type = 'EVENT' AND event_id = targetEventId AND status = 'ENTERED'
      const targetEventAtt = targetEventId
        ? atts.find(
            a => a.participant_id === p.id && a.attendance_type === 'EVENT' && a.event_id === targetEventId && a.status === 'ENTERED'
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

      // Event selections
      const hasCC = codeCrusadeEv && sels.some(s => s.participant_id === p.id && s.event_id === codeCrusadeEv.id);
      const hasLA = logicArenaEv && sels.some(s => s.participant_id === p.id && s.event_id === logicArenaEv.id);
      const hasUI = uiuxStudioEv && sels.some(s => s.participant_id === p.id && s.event_id === uiuxStudioEv.id);
      const hasTT = techTacticsEv && sels.some(s => s.participant_id === p.id && s.event_id === techTacticsEv.id);
      const hasPP = pixelPulseEv && sels.some(s => s.participant_id === p.id && s.event_id === pixelPulseEv.id);

      // Filter by eventSelected if specified
      if (filters.eventSelected && filters.eventSelected !== 'ALL') {
        const targetEv = evs.find(
          e => e.id === filters.eventSelected || e.slug === filters.eventSelected || e.code === filters.eventSelected
        );
        if (targetEv) {
          const hasSelected = sels.some(s => s.participant_id === p.id && s.event_id === targetEv.id);
          if (!hasSelected) return;
        }
      }

      // Filter by coordinatorId if specified
      const relevantAtt = targetEventId ? targetEventAtt : overallAtt;
      if (filters.coordinatorId && filters.coordinatorId !== 'ALL') {
        if (!relevantAtt || relevantAtt.coordinator_id !== filters.coordinatorId) return;
      }

      const coord = relevantAtt?.coordinator_id
        ? coords.find(c => c.id === relevantAtt.coordinator_id)
        : undefined;

      // Event Check-ins
      const ccAtt = codeCrusadeEv ? atts.find(a => a.participant_id === p.id && a.attendance_type === 'EVENT' && a.event_id === codeCrusadeEv.id && a.status === 'ENTERED') : undefined;
      const laAtt = logicArenaEv ? atts.find(a => a.participant_id === p.id && a.attendance_type === 'EVENT' && a.event_id === logicArenaEv.id && a.status === 'ENTERED') : undefined;
      const uiAtt = uiuxStudioEv ? atts.find(a => a.participant_id === p.id && a.attendance_type === 'EVENT' && a.event_id === uiuxStudioEv.id && a.status === 'ENTERED') : undefined;
      const ttAtt = techTacticsEv ? atts.find(a => a.participant_id === p.id && a.attendance_type === 'EVENT' && a.event_id === techTacticsEv.id && a.status === 'ENTERED') : undefined;
      const ppAtt = pixelPulseEv ? atts.find(a => a.participant_id === p.id && a.attendance_type === 'EVENT' && a.event_id === pixelPulseEv.id && a.status === 'ENTERED') : undefined;

      const formatTime = (iso: string) => {
        try {
          const d = new Date(iso);
          return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
        } catch {
          return iso;
        }
      };

      rows.push({
        index: rows.length + 1,
        passId: p.pass_id || 'UNISSUED',
        name: p.name,
        email: p.email,
        phone: p.phone,
        college: p.college,
        department: p.department,
        year: p.year,
        checkinTime: relevantAtt?.checkin_time || '',
        formattedTime: relevantAtt?.checkin_time ? formatTime(relevantAtt.checkin_time) : 'Not Entered',
        coordinatorName: coord ? coord.name : relevantAtt ? 'Desk' : '-',
        status: isEntered ? 'ENTERED' : 'NOT ENTERED',
        eventName: targetEventId ? (evs.find(e => e.id === targetEventId)?.name || 'Event') : 'Overall Entry',
        attendanceType: relevantAtt?.attendance_type || (targetEventId ? 'EVENT' : 'OVERALL'),

        codeCrusadeSelected: hasCC ? 'YES' : 'NO',
        logicArenaSelected: hasLA ? 'YES' : 'NO',
        uiuxStudioSelected: hasUI ? 'YES' : 'NO',
        techTacticsSelected: hasTT ? 'YES' : 'NO',
        pixelPulseSelected: hasPP ? 'YES' : 'NO',

        codeCrusadeCheckin: ccAtt?.checkin_time ? formatTime(ccAtt.checkin_time) : 'NOT CHECKED IN',
        logicArenaCheckin: laAtt?.checkin_time ? formatTime(laAtt.checkin_time) : 'NOT CHECKED IN',
        uiuxStudioCheckin: uiAtt?.checkin_time ? formatTime(uiAtt.checkin_time) : 'NOT CHECKED IN',
        techTacticsCheckin: ttAtt?.checkin_time ? formatTime(ttAtt.checkin_time) : 'NOT CHECKED IN',
        pixelPulseCheckin: ppAtt?.checkin_time ? formatTime(ppAtt.checkin_time) : 'NOT CHECKED IN'
      });
    });

    return rows;
  }

  /**
   * Fetch classified participant attendance rows matching multi-dimensional filters.
   * Uses canonical getFilteredParticipants for 100% consistency across all views.
   */
  async getClassificationRows(filters: ClassificationFilters): Promise<ClassificationRow[]> {
    return this.getFilteredParticipants(filters);
  }

  /**
   * Fetch College-wise attendance breakdown matrix.
   */
  async getCollegeBreakdown(): Promise<CollegeBreakdownRow[]> {
    const rows = await this.getFilteredParticipants({ status: 'ALL' });
    const collegeMap = new Map<string, CollegeBreakdownRow>();

    rows.forEach(r => {
      if (!collegeMap.has(r.college)) {
        collegeMap.set(r.college, {
          college: r.college,
          totalParticipants: 0,
          overallAttendance: 0,
          codeCrusade: 0,
          logicArena: 0,
          uiuxStudio: 0,
          techTactics: 0,
          pixelPulse: 0
        });
      }

      const entry = collegeMap.get(r.college)!;
      entry.totalParticipants++;
      if (r.status === 'ENTERED') entry.overallAttendance++;
      if (r.codeCrusadeCheckin !== 'NOT CHECKED IN') entry.codeCrusade++;
      if (r.logicArenaCheckin !== 'NOT CHECKED IN') entry.logicArena++;
      if (r.uiuxStudioCheckin !== 'NOT CHECKED IN') entry.uiuxStudio++;
      if (r.techTacticsCheckin !== 'NOT CHECKED IN') entry.techTactics++;
      if (r.pixelPulseCheckin !== 'NOT CHECKED IN') entry.pixelPulse++;
    });

    return Array.from(collegeMap.values()).sort((a, b) => b.overallAttendance - a.overallAttendance);
  }

  /**
   * Fetch Department-wise attendance breakdown matrix.
   */
  async getDepartmentBreakdown(): Promise<DepartmentBreakdownRow[]> {
    const rows = await this.getFilteredParticipants({ status: 'ALL' });
    const deptMap = new Map<string, DepartmentBreakdownRow>();

    rows.forEach(r => {
      const key = `${r.college}||${r.department}||${r.year}`;
      if (!deptMap.has(key)) {
        deptMap.set(key, {
          college: r.college,
          department: r.department,
          year: r.year,
          totalParticipants: 0,
          overallAttendance: 0,
          codeCrusade: 0,
          logicArena: 0,
          uiuxStudio: 0,
          techTactics: 0,
          pixelPulse: 0
        });
      }

      const entry = deptMap.get(key)!;
      entry.totalParticipants++;
      if (r.status === 'ENTERED') entry.overallAttendance++;
      if (r.codeCrusadeCheckin !== 'NOT CHECKED IN') entry.codeCrusade++;
      if (r.logicArenaCheckin !== 'NOT CHECKED IN') entry.logicArena++;
      if (r.uiuxStudioCheckin !== 'NOT CHECKED IN') entry.uiuxStudio++;
      if (r.techTacticsCheckin !== 'NOT CHECKED IN') entry.techTactics++;
      if (r.pixelPulseCheckin !== 'NOT CHECKED IN') entry.pixelPulse++;
    });

    return Array.from(deptMap.values()).sort((a, b) => b.overallAttendance - a.overallAttendance);
  }

  /**
   * Subscribe to Supabase Realtime attendance changes.
   * Returns an unsubscribe function to clean up when components unmount.
   */
  subscribeToAttendanceUpdates(onUpdate: () => void): () => void {
    if (!isSupabaseConfigured()) {
      return () => {};
    }

    try {
      const channel = supabase
        .channel(`attendance-sync-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`)
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'attendance' },
          () => {
            onUpdate();
          }
        )
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'participant_event_selections' },
          () => {
            onUpdate();
          }
        )
        .subscribe();

      return () => {
        try {
          supabase.removeChannel(channel);
        } catch {}
      };
    } catch (err) {
      console.warn('Realtime subscription error:', err);
      return () => {};
    }
  }

  /**
   * Validate a participant QR pass prior to overall check-in.
   * Returns participant details and existing attendance/selection state.
   */
  async validateParticipantPass(qrToken: string): Promise<{
    status: 'VALID' | 'ALREADY_CHECKED_IN' | 'INVALID_TOKEN' | 'INACTIVE_PARTICIPANT' | 'ERROR';
    participant?: ParticipantPassInfo;
    participantId?: string;
    previousCheckin?: PreviousCheckinInfo;
    selectedEvents?: SelectedEventInfo[];
    error?: string;
  }> {
    const cleanToken = qrToken.trim().toLowerCase();

    if (isSupabaseConfigured()) {
      try {
        const { data: pData, error: pError } = await supabase
          .from('participants')
          .select('*')
          .or(`qr_token.ilike.${cleanToken},pass_id.ilike.${cleanToken},internal_id.ilike.${cleanToken}`)
          .limit(1)
          .maybeSingle();

        if (pError || !pData) {
          return { status: 'INVALID_TOKEN', error: 'Pass not registered for this event.' };
        }

        if (pData.registration_status !== 'ACTIVE') {
          return { status: 'INACTIVE_PARTICIPANT', error: 'Participant registration is inactive or suspended.' };
        }

        const participant: ParticipantPassInfo = {
          id: pData.id,
          participantId: pData.internal_id,
          passId: pData.pass_id || 'UNISSUED',
          name: pData.name,
          college: pData.college,
          department: pData.department,
          year: pData.year
        };

        // Check if overall attendance already exists
        const { data: attData } = await supabase
          .from('attendance')
          .select('id, checkin_time, coordinator_id, coordinators(name)')
          .eq('participant_id', pData.id)
          .eq('attendance_type', 'OVERALL')
          .eq('status', 'ENTERED')
          .maybeSingle();

        if (attData) {
          // Fetch existing selections
          const { data: selData } = await supabase
            .from('participant_event_selections')
            .select('event_id, events(id, code, name)')
            .eq('participant_id', pData.id);

          const selectedEvents: SelectedEventInfo[] = (selData || []).map((s: any) => ({
            id: s.events?.id || s.event_id,
            code: s.events?.code || '',
            name: s.events?.name || ''
          }));

          return {
            status: 'ALREADY_CHECKED_IN',
            participant,
            participantId: pData.id,
            previousCheckin: {
              time: attData.checkin_time,
              coordinatorName: (attData.coordinators as any)?.name || 'Desk Coordinator',
              coordinatorId: attData.coordinator_id,
              checkinId: attData.id,
              passId: pData.pass_id
            },
            selectedEvents
          };
        }

        return {
          status: 'VALID',
          participant,
          participantId: pData.id
        };
      } catch (err: any) {
        console.error('validateParticipantPass error:', err);
        return {
          status: 'ERROR',
          error: 'Unable to connect to database. Please check your connection and try again.'
        };
      }
    }

    // Fallback to mockDatabase ONLY when Supabase is not configured
    const p = mockDatabase.findParticipantByQr(cleanToken);
    if (!p) {
      return { status: 'INVALID_TOKEN', error: 'Pass not registered for this event.' };
    }
    if (p.registrationStatus !== 'ACTIVE') {
      return { status: 'INACTIVE_PARTICIPANT', error: 'Participant registration is inactive or suspended.' };
    }

    const participant: ParticipantPassInfo = {
      id: p.id,
      participantId: p.internalId,
      passId: p.passId || 'UNISSUED',
      name: p.name,
      college: p.college,
      department: p.department,
      year: p.year
    };

    const overallAtt = (mockDatabase as any).attendance?.find(
      (a: any) => a.participantId === p.id && a.attendanceType === 'OVERALL' && a.status === 'ENTERED'
    );

    if (overallAtt) {
      const coord = (mockDatabase as any).coordinators?.find((c: any) => c.id === overallAtt.coordinatorId);
      const selectedEvents = mockDatabase.getParticipantEventSelections(p.id);

      return {
        status: 'ALREADY_CHECKED_IN',
        participant,
        participantId: p.id,
        previousCheckin: {
          time: overallAtt.checkinTime,
          coordinatorName: coord?.name || 'Desk Coordinator',
          coordinatorId: overallAtt.coordinatorId,
          checkinId: overallAtt.id,
          passId: p.passId
        },
        selectedEvents
      };
    }

    return {
      status: 'VALID',
      participant,
      participantId: p.id
    };
  }

  /**
   * Helper to retrieve distinct filter options.
   */
  getFilterOptions(): { colleges: string[]; departments: string[]; years: string[] } {
    const participants = mockDatabase.getParticipants();
    const colleges = Array.from(new Set(participants.map(p => p.college))).sort();
    const departments = Array.from(new Set(participants.map(p => p.department))).sort();
    const years = Array.from(new Set(participants.map(p => p.year))).sort();
    return { colleges, departments, years };
  }

  /**
   * Reset scanned attendance and event selections ONLY.
   * Keeps all participants, events, and coordinator records intact.
   */
  async resetScanData(coordinatorId?: string): Promise<{ success: boolean; error?: string }> {
    // 1. Reset local mock database
    mockDatabase.resetScanData();
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.removeItem('vyugam_supabase_attendance_mock_v2');
      localStorage.removeItem('vyugam_supabase_event_selections_mock_v2');
      try {
        window.dispatchEvent(new Event('storage'));
      } catch {}
    }

    if (isSupabaseConfigured()) {
      try {
        let rpcSuccess = false;
        try {
          const { data, error: rpcErr } = await supabase.rpc('reset_scanned_attendance', {
            p_coordinator_id: coordinatorId || null
          });
          if (!rpcErr && data && (data.success === true || (data as any).status === 'SUCCESS')) {
            rpcSuccess = true;
          }
        } catch {
          // RPC may not exist, will fall back to direct deletes
        }

        if (!rpcSuccess) {
          // Direct fallback deletes
          await supabase
            .from('participant_event_selections')
            .delete()
            .neq('id', '00000000-0000-0000-0000-000000000000');
          await supabase
            .from('attendance')
            .delete()
            .neq('id', '00000000-0000-0000-0000-000000000000');
        }

        return { success: true };
      } catch (err: any) {
        console.error('Reset scan data failed in Supabase:', err);
        return { success: false, error: err.message };
      }
    }

    return { success: true };
  }
}

export const attendanceService = new AttendanceService();
