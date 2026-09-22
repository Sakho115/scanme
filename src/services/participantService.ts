import { mockDatabase } from '../data/mockDatabase';
import { Participant } from '../types/participant';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

class ParticipantService {
  /**
   * Look up a participant by QR token.
   */
  async findByQrToken(qrToken: string): Promise<Participant | null> {
    if (isSupabaseConfigured()) {
      try {
        const clean = qrToken.trim();
        // Fast path: use secure RPC lookup
        const { data: rpcData, error: rpcErr } = await supabase.rpc('lookup_participant_by_qr_token', {
          p_qr_token: clean
        });

        if (!rpcErr && rpcData && rpcData.participant) {
          const p = rpcData.participant;
          return {
            id: p.id,
            internalId: p.internalId || p.id,
            passId: p.passId,
            qrToken: clean,
            name: p.name,
            email: p.email || '',
            phone: p.phone || '',
            college: p.college,
            department: p.department,
            year: p.year,
            registrationStatus: p.registrationStatus as any
          };
        }

        const { data, error } = await supabase
          .from('participants')
          .select('id, internal_id, pass_id, qr_token, name, email, phone, college, department, year, reference, registration_status')
          .or(`qr_token.ilike.${clean.toLowerCase()},pass_id.ilike.${clean}`)
          .maybeSingle();

        if (data && !error) {
          return {
            id: data.id,
            internalId: data.internal_id,
            passId: data.pass_id,
            qrToken: data.qr_token,
            name: data.name,
            email: data.email,
            phone: data.phone,
            college: data.college,
            department: data.department,
            year: data.year,
            reference: data.reference,
            registrationStatus: data.registration_status as any
          };
        }
      } catch (err) {
        console.error('Participant lookup failed:', err);
      }
    }

    const found = mockDatabase.findParticipantByQr(qrToken);
    return found ? { ...found } : null;
  }

  /**
   * Search and filter all participants.
   */
  async getParticipants(filters?: {
    search?: string;
    college?: string;
    department?: string;
    year?: string;
  }): Promise<Participant[]> {
    if (isSupabaseConfigured()) {
      try {
        let query = supabase.from('participants').select('*');

        if (filters?.college && filters.college !== 'ALL') {
          query = query.ilike('college', filters.college);
        }

        if (filters?.department && filters.department !== 'ALL') {
          query = query.ilike('department', filters.department);
        }

        if (filters?.year && filters.year !== 'ALL') {
          query = query.ilike('year', filters.year);
        }

        if (filters?.search && filters.search.trim()) {
          const q = filters.search.trim();
          query = query.or(`name.ilike.%${q}%,pass_id.ilike.%${q}%,qr_token.ilike.%${q}%,college.ilike.%${q}%,department.ilike.%${q}%`);
        }

        const { data, error } = await query.order('name', { ascending: true });

        if (!error && data) {
          return data.map((p: any) => ({
            id: p.id,
            internalId: p.internal_id,
            passId: p.pass_id,
            qrToken: p.qr_token,
            name: p.name,
            email: p.email,
            phone: p.phone,
            college: p.college,
            department: p.department,
            year: p.year,
            reference: p.reference,
            registrationStatus: p.registration_status as any
          }));
        }
      } catch (err) {
        console.error('Failed to fetch participants from Supabase:', err);
      }
    }

    let list = mockDatabase.getParticipants();

    if (filters?.search && filters.search.trim()) {
      const q = filters.search.toLowerCase().trim();
      list = list.filter(
        p =>
          p.name.toLowerCase().includes(q) ||
          (p.passId && p.passId.toLowerCase().includes(q)) ||
          p.qrToken.toLowerCase().includes(q) ||
          p.college.toLowerCase().includes(q) ||
          p.department.toLowerCase().includes(q)
      );
    }

    if (filters?.college && filters.college !== 'ALL') {
      list = list.filter(p => p.college.toLowerCase() === filters.college!.toLowerCase());
    }

    if (filters?.department && filters.department !== 'ALL') {
      list = list.filter(p => p.department.toLowerCase() === filters.department!.toLowerCase());
    }

    if (filters?.year && filters.year !== 'ALL') {
      list = list.filter(p => p.year.toLowerCase() === filters.year!.toLowerCase());
    }

    return list;
  }

  /**
   * Architecture for future CSV / XLSX participant bulk import.
   */
  async importParticipants(
    participantsToImport: Array<Omit<Participant, 'id'>>
  ): Promise<{ success: boolean; importedCount: number; errors?: string[] }> {
    // Extensible endpoint for admin bulk upload
    console.log(`Prepared import for ${participantsToImport.length} participants`);
    return {
      success: true,
      importedCount: participantsToImport.length
    };
  }
}

export const participantService = new ParticipantService();
