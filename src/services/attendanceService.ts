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
   * Calls Supabase PostgreSQL RPC function `verify_and_checkin` or falls back to mockDatabase.
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

        // Trigger background sync to keep in-memory / local storage cache fresh
        this.syncLiveStateFromSupabase().catch(() => {});

        return data as CheckinResult;
      } catch (err) {
        console.error('Attendance RPC call failed:', err);
      }
    }

    // Fallback to local relational mock database
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
          error: err.message || 'Network error'
        };
      }
    }

    return mockDatabase.updateParticipantEventSelections(params);
  }

  /**
   * Fetch Overall Attendance statistics.
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
          supabase.from('attendance').select('*', { count: 'exact', head: true }).eq('attendance_type', 'OVERALL'),
          supabase
            .from('attendance')
            .select(`
              id, participant_id, attendance_type, event_id, coordinator_id, checkin_time, status,
              participants (name, pass_id, college, department, year),
              coordinators (name)
            `)
            .eq('attendance_type', 'OVERALL')
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
   * Fetch Event Attendance statistics for one of the 5 events.
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
            supabase.from('attendance').select('*', { count: 'exact', head: true }).eq('attendance_type', 'OVERALL'),
            supabase
              .from('attendance')
              .select('*', { count: 'exact', head: true })
              .eq('attendance_type', 'EVENT')
              .eq('event_id', eventData.id),
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
   * Synchronize live state from Supabase into the relational cache.
   */
  async syncLiveStateFromSupabase(): Promise<void> {
    if (!isSupabaseConfigured()) return;
    try {
      const [
        { data: parts },
        { data: atts },
        { data: sels }
      ] = await Promise.all([
        supabase.from('participants').select('*'),
        supabase.from('attendance').select('*'),
        supabase.from('participant_event_selections').select('*')
      ]);

      const mappedParticipants = (parts && parts.length > 0)
        ? parts.map((p: any) => ({
            id: p.id,
            internalId: p.internal_id,
            name: p.name,
            qrToken: p.qr_token,
            college: p.college,
            department: p.department,
            year: p.year,
            registrationStatus: p.registration_status,
            passId: p.pass_id,
            email: p.email,
            phone: p.phone,
            reference: p.reference
          }))
        : undefined;

      const mappedAttendance = (atts || []).map((a: any) => ({
        id: a.id,
        participantId: a.participant_id,
        attendanceType: a.attendance_type,
        eventId: a.event_id,
        coordinatorId: a.coordinator_id,
        checkinTime: a.checkin_time,
        status: a.status
      }));

      const mappedSelections = (sels || []).map((s: any) => ({
        id: s.id,
        participantId: s.participant_id,
        eventId: s.event_id,
        selectedAt: s.selected_at,
        selectedBy: s.selected_by
      }));

      mockDatabase.syncLiveState(mappedParticipants, mappedAttendance, mappedSelections);
    } catch (err) {
      console.warn('Live state sync from Supabase encountered error:', err);
    }
  }

  /**
   * Fetch classified participant attendance rows matching multi-dimensional filters.
   */
  async getClassificationRows(filters: ClassificationFilters): Promise<ClassificationRow[]> {
    if (isSupabaseConfigured()) {
      await this.syncLiveStateFromSupabase();
    }
    return mockDatabase.getClassificationRows(filters);
  }

  /**
   * Fetch College-wise attendance breakdown matrix.
   */
  async getCollegeBreakdown(): Promise<CollegeBreakdownRow[]> {
    if (isSupabaseConfigured()) {
      await this.syncLiveStateFromSupabase();
    }
    return mockDatabase.getCollegeBreakdown();
  }

  /**
   * Fetch Department-wise attendance breakdown matrix.
   */
  async getDepartmentBreakdown(): Promise<DepartmentBreakdownRow[]> {
    if (isSupabaseConfigured()) {
      await this.syncLiveStateFromSupabase();
    }
    return mockDatabase.getDepartmentBreakdown();
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
      }
    }

    // Fallback to mockDatabase
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
      (a: any) => a.participantId === p.id && a.attendanceType === 'OVERALL'
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
    // 1. Always reset local mock database and localStorage
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

        // Re-sync local state from Supabase to guarantee synchronized 0 state
        await this.syncLiveStateFromSupabase();
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
