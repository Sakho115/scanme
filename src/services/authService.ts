import { Coordinator, CoordinatorSession, LoginResponse } from '../types/coordinator';
import { SEED_COORDINATORS } from '../data/mockDatabase';

const SESSION_STORAGE_KEY = 'vyugam_coordinator_session_v2';

/**
 * DEVELOPMENT ONLY MOCK COORDINATOR CREDENTIALS
 */
const MOCK_CREDENTIALS: Record<string, { pin: string; coordinator: Coordinator }> = {
  'ADMIN-01': {
    pin: '1234',
    coordinator: SEED_COORDINATORS[0]
  },
  'CR-OVERALL': {
    pin: '1234',
    coordinator: SEED_COORDINATORS[1]
  },
  'CR-CODE': {
    pin: '1234',
    coordinator: SEED_COORDINATORS[2]
  },
  'CR-LOGIC': {
    pin: '1234',
    coordinator: SEED_COORDINATORS[3]
  },
  'CR-UIUX': {
    pin: '1234',
    coordinator: SEED_COORDINATORS[4]
  },
  'CR-TECH': {
    pin: '1234',
    coordinator: SEED_COORDINATORS[5]
  },
  'CR-PIXEL': {
    pin: '1234',
    coordinator: SEED_COORDINATORS[6]
  },
  // Backward compatibility aliases
  'CR-01': {
    pin: '1234',
    coordinator: SEED_COORDINATORS[1] // defaults to overall coordinator
  },
  'CR-02': {
    pin: '1234',
    coordinator: SEED_COORDINATORS[2] // defaults to code crusade coordinator
  }
};

class AuthService {
  private currentSession: CoordinatorSession | null = null;

  constructor() {
    this.restoreSession();
  }

  private restoreSession(): void {
    if (typeof window === 'undefined') return;
    try {
      const stored = localStorage.getItem(SESSION_STORAGE_KEY);
      if (stored) {
        this.currentSession = JSON.parse(stored);
      }
    } catch {
      this.currentSession = null;
    }
  }

  /**
   * Authenticate a coordinator by code and PIN.
   */
  async login(coordinatorCodeInput: string, pinInput: string): Promise<LoginResponse> {
    const code = coordinatorCodeInput.trim().toUpperCase();
    const pin = pinInput.trim();

    const account = MOCK_CREDENTIALS[code];
    if (!account || account.pin !== pin) {
      return {
        success: false,
        error: 'Invalid Coordinator ID or PIN. Use ADMIN-01 or CR-OVERALL / 1234.'
      };
    }

    const coordinator = account.coordinator;
    const session: CoordinatorSession = {
      ...coordinator,
      sessionToken: `sess_${Date.now()}_${coordinator.coordinatorCode}`,
      loginTime: new Date().toISOString()
    };

    this.setSession(session);
    return { success: true, coordinator, token: session.sessionToken };
  }

  public setSession(session: CoordinatorSession): void {
    this.currentSession = session;
    if (typeof window !== 'undefined') {
      localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
    }
  }

  public getSession(): CoordinatorSession | null {
    if (!this.currentSession) {
      this.restoreSession();
    }
    return this.currentSession;
  }

  public isAuthenticated(): boolean {
    return !!this.getSession();
  }

  public logout(): void {
    this.currentSession = null;
    if (typeof window !== 'undefined') {
      localStorage.removeItem(SESSION_STORAGE_KEY);
    }
  }
}

export const authService = new AuthService();
