// Native Node.js Verification Test for VYUGAM Entry Scanner

// 1. QR Token Extraction implementation
function extractTokenFromQR(value) {
  if (!value || typeof value !== 'string') return null;
  const trimmed = value.trim();
  const hex64Regex = /^[0-9a-fA-F]{64}$/;
  if (hex64Regex.test(trimmed)) return trimmed.toLowerCase();

  try {
    const url = new URL(trimmed);
    const candidateParams = ['token', 't', 'qr', 'pass', 'id', 'token_id'];
    for (const param of candidateParams) {
      const paramVal = url.searchParams.get(param);
      if (paramVal && hex64Regex.test(paramVal.trim())) {
        return paramVal.trim().toLowerCase();
      }
    }
    const pathParts = url.pathname.split('/').filter(Boolean);
    for (const part of pathParts) {
      if (hex64Regex.test(part)) return part.toLowerCase();
    }
    if (url.hash) {
      const hashClean = url.hash.replace(/^#\/?/, '');
      if (hex64Regex.test(hashClean)) return hashClean.toLowerCase();
      const match = hashClean.match(/[0-9a-fA-F]{64}/);
      if (match) return match[0].toLowerCase();
    }
  } catch {}

  const match = trimmed.match(/[0-9a-fA-F]{64}/);
  if (match) return match[0].toLowerCase();
  return null;
}

// 2. Mock Participant Database
const MOCK_PARTICIPANTS = [
  {
    internalId: '899238a974ec79e29d9f6f5d0821a200',
    passId: 'VYG26-00045',
    qrToken: '4c2c6c2c8a709e24fd0d256e25a072e7c9009077e0c7343b778948bcfdb8ee5e',
    name: 'test_ashok',
    email: 'fitalfivisual@gmail.com',
    phone: '9874561230',
    college: 'P.A. College of Engineering and Technology',
    department: 'IT',
    year: 'III Year',
    reference: 'REG-2026-0045'
  },
  {
    internalId: '1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d',
    passId: 'VYG26-00012',
    qrToken: '1111222233334444555566667777888899990000aaaabbbbccccddddeeeeffff',
    name: 'Priya Sharma',
    college: 'PSG College of Technology',
    department: 'Computer Science and Engineering',
    year: 'IV Year'
  }
];

// 3. Isolated Check-in Datastore
const mockCheckins = [];

function scanParticipant(token, eventId = 'VYUGAM-2026') {
  const cleanToken = token.trim().toLowerCase();
  const participant = MOCK_PARTICIPANTS.find(p => p.qrToken.toLowerCase() === cleanToken);

  if (!participant) {
    return {
      success: false,
      checkinStatus: 'INVALID',
      error: 'This QR code is not registered for this event.'
    };
  }

  const existing = mockCheckins.find(c => c.participantId === participant.internalId && c.eventId === eventId);
  const sanitized = {
    participantId: participant.internalId,
    passId: participant.passId,
    name: participant.name,
    college: participant.college,
    department: participant.department,
    year: participant.year
  };

  if (existing) {
    return {
      success: true,
      participant: sanitized,
      checkinStatus: 'ALREADY_CHECKED_IN',
      previousCheckin: {
        time: existing.checkinTime,
        coordinatorId: existing.coordinatorId,
        passId: existing.passId
      }
    };
  }

  return {
    success: true,
    participant: sanitized,
    checkinStatus: 'NOT_CHECKED_IN'
  };
}

function checkInParticipant({ participantId, passId, eventId, coordinatorId, participantName, college }) {
  const duplicate = mockCheckins.find(c => c.participantId === participantId && c.eventId === eventId);
  if (duplicate) {
    return {
      success: false,
      error: 'Participant has already checked in',
      previousCheckin: {
        time: duplicate.checkinTime,
        coordinatorId: duplicate.coordinatorId
      }
    };
  }

  const checkin = {
    checkinId: `CHK-${String(mockCheckins.length + 1).padStart(6, '0')}`,
    participantId,
    passId,
    eventId,
    coordinatorId,
    checkinTime: new Date().toISOString(),
    status: 'ENTERED',
    participantName,
    college
  };

  mockCheckins.unshift(checkin);
  return { success: true, checkin };
}

// ----------------------------------------------------
// RUN VERIFICATION TESTS
// ----------------------------------------------------
console.log('=== VYUGAM ENTRY SCANNER VERIFICATION SUITE ===\n');
let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  ✓ PASS: ${message}`);
    passed++;
  } else {
    console.error(`  ✗ FAIL: ${message}`);
    failed++;
  }
}

// Test 1: QR Extraction
console.log('--- TEST 1: QR Token Extraction & Formats ---');
const rawToken = '4c2c6c2c8a709e24fd0d256e25a072e7c9009077e0c7343b778948bcfdb8ee5e';
assert(extractTokenFromQR(rawToken) === rawToken, 'Extracts raw 64-char hex token');
assert(extractTokenFromQR(`https://vyugam.in/entry?token=${rawToken}`) === rawToken, 'Extracts token from URL query string');
assert(extractTokenFromQR(`https://vyugam.in/pass/${rawToken}`) === rawToken, 'Extracts token from URL path');
assert(extractTokenFromQR(`PREFIX:${rawToken}:SUFFIX`) === rawToken, 'Extracts embedded 64-hex token');
assert(extractTokenFromQR('INVALID_TOKEN_999') === null, 'Rejects invalid QR values');

// Test 2: Participant Lookup
console.log('\n--- TEST 2: Participant Lookup (test_ashok) ---');
const res1 = scanParticipant(rawToken, 'VYUGAM-2026');
assert(res1.success === true, 'Lookup succeeded for valid test token');
assert(res1.participant.passId === 'VYG26-00045', 'Pass ID is VYG26-00045');
assert(res1.participant.name === 'test_ashok', 'Name is test_ashok');
assert(res1.participant.college === 'P.A. College of Engineering and Technology', 'College is PACET');
assert(res1.participant.department === 'IT', 'Department is IT');
assert(res1.participant.year === 'III Year', 'Year is III Year');
assert(res1.participant.email === undefined, 'Attendee email omitted for privacy');
assert(res1.participant.phone === undefined, 'Attendee phone omitted for privacy');
assert(res1.checkinStatus === 'NOT_CHECKED_IN', 'Status is NOT_CHECKED_IN before entry');

// Test 3: Check-in & Duplicate Prevention
console.log('\n--- TEST 3: Check-in Recording & Duplicate Prevention ---');
const checkinRes = checkInParticipant({
  participantId: res1.participant.participantId,
  passId: res1.participant.passId,
  eventId: 'VYUGAM-2026',
  coordinatorId: 'CR-01',
  participantName: res1.participant.name,
  college: res1.participant.college
});

assert(checkinRes.success === true, 'Recorded physical check-in');
assert(checkinRes.checkin.passId === 'VYG26-00045', 'Recorded checkin with passId VYG26-00045');
assert(checkinRes.checkin.coordinatorId === 'CR-01', 'Recorded coordinator CR-01');
assert(checkinRes.checkin.status === 'ENTERED', 'Recorded status ENTERED');

// Rescan to test duplicate detection
const rescan = scanParticipant(rawToken, 'VYUGAM-2026');
assert(rescan.checkinStatus === 'ALREADY_CHECKED_IN', 'Flags duplicate scan as ALREADY_CHECKED_IN');
assert(rescan.previousCheckin.coordinatorId === 'CR-01', 'Identifies previous coordinator CR-01');
assert(Boolean(rescan.previousCheckin.time), 'Identifies previous check-in timestamp');

// Attempt duplicate record
const dupRes = checkInParticipant({
  participantId: res1.participant.participantId,
  passId: res1.participant.passId,
  eventId: 'VYUGAM-2026',
  coordinatorId: 'CR-02'
});
assert(dupRes.success === false, 'Duplicate entry rejected');

// Test 4: Invalid pass
console.log('\n--- TEST 4: Invalid Pass Token ---');
const invalid = scanParticipant('ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff', 'VYUGAM-2026');
assert(invalid.success === false, 'Unregistered token returns success: false');
assert(invalid.checkinStatus === 'INVALID', 'Unregistered token returns status INVALID');

console.log('\n=============================================');
console.log(`TOTAL: ${passed + failed} | PASSED: ${passed} | FAILED: ${failed}`);
console.log('=============================================\n');

if (failed > 0) process.exit(1);
