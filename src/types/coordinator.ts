import { EventCode, EventSlug, VYUGAM_EVENTS } from './event';

export type CoordinatorRole = 'ADMIN' | 'OVERALL_COORDINATOR' | 'EVENT_COORDINATOR';

export interface Coordinator {
  id: string; // UUID primary key
  userId?: string;
  coordinatorCode: string; // e.g. 'ADMIN-01', 'CR-OVERALL', 'CR-CODE'
  name: string;
  role: CoordinatorRole;
  eventId?: string | null; // references events.id (NULL for Admin & Overall)
  active: boolean;
  assignedEventCode?: EventCode | null;
  assignedEventSlug?: EventSlug | null;
  assignedEventName?: string | null;
}

export interface CoordinatorSession extends Coordinator {
  sessionToken: string;
  loginTime: string;
}

export interface LoginResponse {
  success: boolean;
  coordinator?: Coordinator;
  token?: string;
  error?: string;
}

/**
 * Checks whether a coordinator has permission to scan or modify a specific section/event.
 */
export function canAccessSection(
  coordinator: Coordinator | null | undefined,
  targetType: 'OVERALL' | 'EVENT',
  targetEventSlugOrCode?: string
): boolean {
  if (!coordinator) return false;
  if (coordinator.role === 'ADMIN') return true;

  if (targetType === 'OVERALL') {
    return coordinator.role === 'OVERALL_COORDINATOR';
  }

  if (targetType === 'EVENT') {
    if (coordinator.role !== 'EVENT_COORDINATOR') return false;
    if (!targetEventSlugOrCode) return false;

    const clean = targetEventSlugOrCode.toLowerCase().trim();
    if (coordinator.assignedEventSlug && coordinator.assignedEventSlug.toLowerCase() === clean) {
      return true;
    }
    if (coordinator.assignedEventCode && coordinator.assignedEventCode.toLowerCase() === clean) {
      return true;
    }

    const matchedEvent = VYUGAM_EVENTS.find(
      e => e.slug.toLowerCase() === clean || e.code.toLowerCase() === clean || e.id === targetEventSlugOrCode
    );
    return matchedEvent?.id === coordinator.eventId;
  }

  return false;
}
