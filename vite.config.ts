import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import type { IncomingMessage, ServerResponse } from 'http';

// Mock participants database for Vite dev server middleware
const DEV_PARTICIPANTS = [
  {
    internalId: '899238a974ec79e29d9f6f5d0821a200',
    passId: 'VYG26-00045',
    qrToken: '4c2c6c2c8a709e24fd0d256e25a072e7c9009077e0c7343b778948bcfdb8ee5e',
    name: 'test_ashok',
    college: 'P.A. College of Engineering and Technology',
    department: 'IT',
    year: 'III Year'
  },
  {
    internalId: '1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d',
    passId: 'VYG26-00012',
    qrToken: '1111222233334444555566667777888899990000aaaabbbbccccddddeeeeffff',
    name: 'Priya Sharma',
    college: 'PSG College of Technology',
    department: 'Computer Science and Engineering',
    year: 'IV Year'
  },
  {
    internalId: '2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e',
    passId: 'VYG26-00028',
    qrToken: 'aabbccddeeff00112233445566778899aabbccddeeff00112233445566778899',
    name: 'Karthik Raja',
    college: 'Coimbatore Institute of Technology',
    department: 'Electronics & Communication',
    year: 'III Year'
  }
];

// In-memory check-ins for Vite dev server
const devCheckins: Array<{
  checkinId: string;
  participantId: string;
  passId: string;
  eventId: string;
  coordinatorId: string;
  checkinTime: string;
  status: 'ENTERED';
  participantName?: string;
  college?: string;
}> = [
  {
    checkinId: 'CHK-000001',
    participantId: '1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d',
    passId: 'VYG26-00012',
    eventId: 'VYUGAM-2026',
    coordinatorId: 'CR-01',
    checkinTime: new Date(Date.now() - 35 * 60 * 1000).toISOString(),
    status: 'ENTERED',
    participantName: 'Priya Sharma',
    college: 'PSG College of Technology'
  }
];

function apiDevServerPlugin() {
  return {
    name: 'api-dev-server',
    configureServer(server: any) {
      server.middlewares.use((req: IncomingMessage, res: ServerResponse, next: () => void) => {
        const url = new URL(req.url || '', `http://${req.headers.host || 'localhost'}`);
        const pathname = url.pathname;

        if (!pathname.startsWith('/api/')) {
          return next();
        }

        res.setHeader('Content-Type', 'application/json');

        const readBody = (): Promise<any> => {
          return new Promise((resolve) => {
            let body = '';
            req.on('data', chunk => { body += chunk; });
            req.on('end', () => {
              try {
                resolve(body ? JSON.parse(body) : {});
              } catch {
                resolve({});
              }
            });
          });
        };

        if (pathname === '/api/auth/login' && req.method === 'POST') {
          readBody().then(body => {
            const { coordinatorId, pin } = body;
            const coordKey = String(coordinatorId || '').trim().toUpperCase();
            if ((coordKey === 'CR-01' || coordKey === 'CR-02') && String(pin).trim() === '1234') {
              res.writeHead(200);
              res.end(JSON.stringify({
                success: true,
                coordinator: {
                  coordinatorId: coordKey,
                  coordinatorName: coordKey === 'CR-01' ? 'Ashwin Kumar' : 'Divya Bharathi',
                  assignedEvent: 'VYUGAM 2026'
                },
                token: `dev_sess_${Date.now()}`
              }));
            } else {
              res.writeHead(401);
              res.end(JSON.stringify({ success: false, error: 'Invalid Coordinator ID or PIN' }));
            }
          });
          return;
        }

        if (pathname === '/api/scan' && req.method === 'POST') {
          readBody().then(body => {
            const { token, eventId = 'VYUGAM-2026' } = body;
            const cleanToken = String(token || '').trim().toLowerCase();

            const participant = DEV_PARTICIPANTS.find(p => p.qrToken.toLowerCase() === cleanToken);
            if (!participant) {
              res.writeHead(200);
              res.end(JSON.stringify({
                success: false,
                checkinStatus: 'INVALID',
                error: 'This QR code is not registered for this event.'
              }));
              return;
            }

            const existing = devCheckins.find(c => c.participantId === participant.internalId && c.eventId === eventId);
            if (existing) {
              res.writeHead(200);
              res.end(JSON.stringify({
                success: true,
                participant: {
                  participantId: participant.internalId,
                  passId: participant.passId,
                  name: participant.name,
                  college: participant.college,
                  department: participant.department,
                  year: participant.year
                },
                checkinStatus: 'ALREADY_CHECKED_IN',
                previousCheckin: {
                  time: existing.checkinTime,
                  coordinatorId: existing.coordinatorId,
                  passId: existing.passId
                }
              }));
              return;
            }

            res.writeHead(200);
            res.end(JSON.stringify({
              success: true,
              participant: {
                participantId: participant.internalId,
                passId: participant.passId,
                name: participant.name,
                college: participant.college,
                department: participant.department,
                year: participant.year
              },
              checkinStatus: 'NOT_CHECKED_IN'
            }));
          });
          return;
        }

        if (pathname === '/api/checkin' && req.method === 'POST') {
          readBody().then(body => {
            const { participantId, passId, eventId = 'VYUGAM-2026', coordinatorId, participantName, college } = body;
            const duplicate = devCheckins.find(c => c.participantId === participantId && c.eventId === eventId);
            if (duplicate) {
              res.writeHead(409);
              res.end(JSON.stringify({
                success: false,
                error: 'Participant has already checked in',
                previousCheckin: {
                  time: duplicate.checkinTime,
                  coordinatorId: duplicate.coordinatorId,
                  passId: duplicate.passId
                }
              }));
              return;
            }

            const checkin = {
              checkinId: `CHK-${String(devCheckins.length + 1).padStart(6, '0')}`,
              participantId,
              passId,
              eventId,
              coordinatorId,
              checkinTime: new Date().toISOString(),
              status: 'ENTERED' as const,
              participantName,
              college
            };
            devCheckins.unshift(checkin);

            res.writeHead(200);
            res.end(JSON.stringify({ success: true, checkin }));
          });
          return;
        }

        if (pathname === '/api/checkins/recent' && req.method === 'GET') {
          const recent = devCheckins.slice(0, 15).map(c => ({
            checkinId: c.checkinId,
            passId: c.passId,
            name: c.participantName || 'Registered Attendee',
            college: c.college || '',
            checkinTime: c.checkinTime,
            coordinatorId: c.coordinatorId
          }));
          res.writeHead(200);
          res.end(JSON.stringify(recent));
          return;
        }

        if (pathname === '/api/checkins/stats' && req.method === 'GET') {
          const eventId = url.searchParams.get('eventId') || 'VYUGAM-2026';
          const coordinatorId = url.searchParams.get('coordinatorId') || 'CR-01';
          const eventEntries = devCheckins.filter(c => c.eventId === eventId);
          res.writeHead(200);
          res.end(JSON.stringify({
            eventId,
            totalEntries: eventEntries.length,
            myEntries: eventEntries.filter(c => c.coordinatorId === coordinatorId).length,
            recentCount: Math.min(eventEntries.length, 5)
          }));
          return;
        }

        next();
      });
    }
  };
}

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), apiDevServerPlugin()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom'],
          scanner: ['@zxing/browser', '@zxing/library'],
          spreadsheet: ['xlsx'],
          pdf: ['jspdf'],
          icons: ['lucide-react'],
          supabase: ['@supabase/supabase-js'],
        }
      }
    }
  },
  server: {
    port: 5173,
    host: true,
  },
  preview: {
    port: 4173,
    host: true,
  }
});
