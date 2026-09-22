import { Checkin, CheckinStats, RecentCheckinItem } from '../types/checkin';

/**
 * SEPARATE CHECK-IN REPOSITORY (MOCK)
 * 
 * In production, this maps to a separate Google Sheet (e.g. VYUGAM_2026_CHECKINS).
 * It is completely isolated from the participant master sheet.
 */

const STORAGE_KEY = 'vyugam_scanner_checkins_v1';

// Seed demo check-ins with realistic earlier timestamps for event day
const INITIAL_MOCK_CHECKINS: Checkin[] = [
  {
    checkinId: 'CHK-000001',
    participantId: '1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d',
    passId: 'VYG26-00012',
    eventId: 'VYUGAM-2026',
    coordinatorId: 'CR-01',
    checkinTime: new Date(Date.now() - 42 * 60 * 1000).toISOString(),
    status: 'ENTERED',
    participantName: 'Priya Sharma',
    college: 'PSG College of Technology'
  },
  {
    checkinId: 'CHK-000002',
    participantId: '2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e',
    passId: 'VYG26-00028',
    eventId: 'VYUGAM-2026',
    coordinatorId: 'CR-02',
    checkinTime: new Date(Date.now() - 25 * 60 * 1000).toISOString(),
    status: 'ENTERED',
    participantName: 'Karthik Raja',
    college: 'Coimbatore Institute of Technology'
  }
];

class MockCheckinStore {
  private checkins: Checkin[] = [];

  constructor() {
    this.load();
  }

  private load(): void {
    if (typeof window !== 'undefined' && window.localStorage) {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        try {
          this.checkins = JSON.parse(stored);
          return;
        } catch {
          // fall through
        }
      }
    }
    this.checkins = [...INITIAL_MOCK_CHECKINS];
  }

  private save(): void {
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.checkins));
    }
  }

  public getAll(eventId = 'VYUGAM-2026'): Checkin[] {
    return this.checkins.filter(c => c.eventId === eventId);
  }

  public findByParticipantId(participantId: string, eventId = 'VYUGAM-2026'): Checkin | undefined {
    return this.checkins.find(c => c.participantId === participantId && c.eventId === eventId);
  }

  public findByPassId(passId: string, eventId = 'VYUGAM-2026'): Checkin | undefined {
    return this.checkins.find(c => c.passId === passId && c.eventId === eventId);
  }

  public record(params: {
    participantId: string;
    passId: string;
    eventId: string;
    coordinatorId: string;
    participantName?: string;
    college?: string;
  }): Checkin {
    const existing = this.findByParticipantId(params.participantId, params.eventId);
    if (existing) {
      throw new Error(`Participant ${params.passId} has already checked in.`);
    }

    const nextNumber = this.checkins.length + 1;
    const checkinId = `CHK-${String(nextNumber).padStart(6, '0')}`;
    const checkin: Checkin = {
      checkinId,
      participantId: params.participantId,
      passId: params.passId,
      eventId: params.eventId,
      coordinatorId: params.coordinatorId,
      checkinTime: new Date().toISOString(),
      status: 'ENTERED',
      participantName: params.participantName,
      college: params.college
    };

    // Prepend for recent order
    this.checkins.unshift(checkin);
    this.save();
    return checkin;
  }

  public getRecent(eventId = 'VYUGAM-2026', limit = 15): RecentCheckinItem[] {
    return this.checkins
      .filter(c => c.eventId === eventId)
      .slice(0, limit)
      .map(c => ({
        checkinId: c.checkinId,
        passId: c.passId,
        name: c.participantName || 'Registered Participant',
        college: c.college || '',
        checkinTime: c.checkinTime,
        coordinatorId: c.coordinatorId
      }));
  }

  public getStats(eventId = 'VYUGAM-2026', coordinatorId?: string): CheckinStats {
    const eventCheckins = this.checkins.filter(c => c.eventId === eventId);
    return {
      eventId,
      totalEntries: eventCheckins.length,
      myEntries: coordinatorId ? eventCheckins.filter(c => c.coordinatorId === coordinatorId).length : 0,
      recentCount: Math.min(eventCheckins.length, 5)
    };
  }

  public reset(keepInitial = true): void {
    this.checkins = keepInitial ? [...INITIAL_MOCK_CHECKINS] : [];
    this.save();
  }
}

export const mockCheckinStore = new MockCheckinStore();
