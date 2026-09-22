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
        const { data, error } = await supabase
          .from('participants')
          .select('*')
          .eq('qr_token', qrToken.trim().toLowerCase())
          .single();

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
