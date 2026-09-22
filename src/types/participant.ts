/**
 * Participant Master Record
 * Stored in Supabase PostgreSQL `participants` table.
 * The scanner application does not modify participant records during attendance scanning.
 */
export interface Participant {
  id: string; // UUID primary key
  internalId: string;
  passId?: string;
  qrToken: string;
  name: string;
  email?: string;
  phone?: string;
  college: string;
  department: string;
  year: string;
  reference?: string;
  registrationStatus?: 'ACTIVE' | 'INACTIVE' | 'CANCELLED' | 'PENDING' | 'REJECTED';
  createdAt?: string;
  updatedAt?: string;
}

/**
 * Raw database record mapping (snake_case) from Supabase
 */
export interface ParticipantDbRow {
  id: string;
  internal_id: string;
  pass_id: string;
  qr_token: string;
  name: string;
  email?: string;
  phone?: string;
  college: string;
  department: string;
  year: string;
  reference?: string;
  registration_status?: string;
  created_at?: string;
  updated_at?: string;
}

/**
 * Sanitized Participant Pass Info
 * Displayed to the desk coordinator for gate verification.
 * Private contact details (email, phone, reference) are strictly omitted.
 */
export interface ParticipantPassInfo {
  id: string;
  participantId?: string; // alias for id / internalId
  passId?: string;
  name: string;
  college: string;
  department: string;
  year: string;
}

export function mapDbParticipant(row: ParticipantDbRow): Participant {
  return {
    id: row.id,
    internalId: row.internal_id,
    passId: row.pass_id,
    qrToken: row.qr_token,
    name: row.name,
    email: row.email,
    phone: row.phone,
    college: row.college,
    department: row.department,
    year: row.year,
    reference: row.reference,
    registrationStatus: (row.registration_status as any) || 'ACTIVE',
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

export function sanitizeParticipant(p: Participant): ParticipantPassInfo {
  return {
    id: p.id,
    participantId: p.internalId || p.id,
    passId: p.passId || 'UNISSUED',
    name: p.name,
    college: p.college,
    department: p.department,
    year: p.year
  };
}
