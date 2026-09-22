import { jsPDF } from 'jspdf';
import * as XLSX from 'xlsx';
import { ClassificationRow } from '../types/attendance';

export interface ExportMetadata {
  title: string;
  subtitle?: string;
  filters?: Record<string, string | undefined>;
  generatedAt?: string;
  scope?: 'OVERALL' | 'EVENT' | 'ALL';
  eventSlug?: string;
  eventName?: string;
}

export function getInterestedEvents(r: ClassificationRow): string {
  const events: string[] = [];
  if (r.codeCrusadeSelected === 'YES') events.push('Code Crusade');
  if (r.logicArenaSelected === 'YES') events.push('Logic Arena');
  if (r.uiuxStudioSelected === 'YES') events.push('UI/UX Studio');
  if (r.techTacticsSelected === 'YES') events.push('Tech Tactics');
  if (r.pixelPulseSelected === 'YES') events.push('Pixel Pulse');
  return events.length > 0 ? events.join(', ') : 'None';
}

export function resolveExportEvent(metadata?: ExportMetadata): {
  slug: string;
  name: string;
  selectedKey: keyof ClassificationRow;
  checkinKey: keyof ClassificationRow;
} | null {
  if (!metadata) return null;
  const probe = `${metadata.eventSlug || ''} ${metadata.eventName || ''} ${metadata.title || ''} ${metadata.subtitle || ''} ${metadata.filters?.Section || ''}`.toLowerCase();
  
  if (probe.includes('code-crusade') || probe.includes('code crusade')) {
    return { slug: 'code-crusade', name: 'Code Crusade', selectedKey: 'codeCrusadeSelected', checkinKey: 'codeCrusadeCheckin' };
  }
  if (probe.includes('logic-arena') || probe.includes('logic arena')) {
    return { slug: 'logic-arena', name: 'Logic Arena', selectedKey: 'logicArenaSelected', checkinKey: 'logicArenaCheckin' };
  }
  if (probe.includes('uiux-studio') || probe.includes('ui/ux') || probe.includes('uiux studio') || probe.includes('ui/ux studio')) {
    return { slug: 'uiux-studio', name: 'UI/UX Studio', selectedKey: 'uiuxStudioSelected', checkinKey: 'uiuxStudioCheckin' };
  }
  if (probe.includes('tech-tactics') || probe.includes('tech tactics')) {
    return { slug: 'tech-tactics', name: 'Tech Tactics', selectedKey: 'techTacticsSelected', checkinKey: 'techTacticsCheckin' };
  }
  if (probe.includes('pixel-pulse') || probe.includes('pixel pulse')) {
    return { slug: 'pixel-pulse', name: 'Pixel Pulse', selectedKey: 'pixelPulseSelected', checkinKey: 'pixelPulseCheckin' };
  }
  return null;
}

/**
 * Clean CSV export with RFC 4180 escaping and UTF-8 BOM.
 * Overall Attendance includes all interested event selections.
 * Individual Event Scanners produce focused sheets without other events' clutter.
 */
export function exportToCSV(
  rows: ClassificationRow[],
  filename = 'vyugam_attendance.csv',
  metadata?: ExportMetadata
): void {
  const eventInfo = resolveExportEvent(metadata);

  let headers: string[];
  if (eventInfo) {
    // Individual Event Scanner Sheet: Clean & focused strictly on this event
    headers = [
      '#',
      'Pass ID',
      'Participant Name',
      'College',
      'Department',
      'Year',
      'Email',
      'Phone',
      'Event Attendance Status',
      'Event Check-in Time',
      'Gate Entry Status',
      'Gate Entry Time',
      'Coordinator'
    ];
  } else {
    // Overall Attendance / Global Sheet: Clearly includes participant info, gate status & event selections
    headers = [
      '#',
      'Pass ID',
      'Participant Name',
      'College',
      'Department',
      'Year',
      'Email',
      'Phone',
      'Gate Entry Status',
      'Gate Entry Time',
      'Selected Events',
      'Code Crusade',
      'Logic Arena',
      'UI/UX Studio',
      'Tech Tactics',
      'Pixel Pulse',
      'Code Crusade Check-in Time',
      'Logic Arena Check-in Time',
      'UI/UX Studio Check-in Time',
      'Tech Tactics Check-in Time',
      'Pixel Pulse Check-in Time',
      'Gate Coordinator'
    ];
  }

  const targetRows = (eventInfo && metadata?.scope !== 'EVENT')
    ? rows.filter(r => r[eventInfo.selectedKey] === 'YES')
    : rows;

  const csvRows: string[] = [];
  csvRows.push(headers.map(h => `"${h.replace(/"/g, '""')}"`).join(','));

  targetRows.forEach((r, idx) => {
    let values: any[];
    if (eventInfo) {
      const isCheckedIn = r[eventInfo.checkinKey] && r[eventInfo.checkinKey] !== 'NOT CHECKED IN';
      values = [
        String(idx + 1),
        r.passId,
        r.name,
        r.college,
        r.department,
        r.year,
        r.email || '',
        r.phone || '',
        isCheckedIn ? 'CHECKED IN' : 'PENDING CHECK-IN',
        r[eventInfo.checkinKey] || 'NOT CHECKED IN',
        r.status,
        r.formattedTime,
        r.coordinatorName
      ];
    } else {
      values = [
        String(idx + 1),
        r.passId,
        r.name,
        r.college,
        r.department,
        r.year,
        r.email || '',
        r.phone || '',
        r.status,
        r.formattedTime,
        getInterestedEvents(r),
        r.codeCrusadeSelected === 'YES' ? 'SELECTED' : 'NO',
        r.logicArenaSelected === 'YES' ? 'SELECTED' : 'NO',
        r.uiuxStudioSelected === 'YES' ? 'SELECTED' : 'NO',
        r.techTacticsSelected === 'YES' ? 'SELECTED' : 'NO',
        r.pixelPulseSelected === 'YES' ? 'SELECTED' : 'NO',
        r.codeCrusadeCheckin || 'NOT CHECKED IN',
        r.logicArenaCheckin || 'NOT CHECKED IN',
        r.uiuxStudioCheckin || 'NOT CHECKED IN',
        r.techTacticsCheckin || 'NOT CHECKED IN',
        r.pixelPulseCheckin || 'NOT CHECKED IN',
        r.coordinatorName
      ];
    }
    csvRows.push(values.map(v => `"${String(v).replace(/"/g, '""')}"`).join(','));
  });

  const csvContent = '\uFEFF' + csvRows.join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  triggerDownload(blob, filename.endsWith('.csv') ? filename : `${filename}.csv`);
}

/**
 * Professional Excel Spreadsheet (.xlsx) export
 */
export function exportToExcel(
  rows: ClassificationRow[],
  filename = 'vyugam_attendance.xlsx',
  metadata?: ExportMetadata
): void {
  const eventInfo = resolveExportEvent(metadata);

  // Case 1: Specific Event Export (e.g. from Event Dashboard)
  if (eventInfo) {
    const targetRows = metadata?.scope === 'EVENT'
      ? rows
      : rows.filter(r => r[eventInfo.selectedKey] === 'YES');

    const dataRows = targetRows.map((r, idx) => {
      const isCheckedIn = Boolean(r[eventInfo.checkinKey] && r[eventInfo.checkinKey] !== 'NOT CHECKED IN');
      return {
        '#': idx + 1,
        'Pass ID': r.passId,
        'Participant Name': r.name,
        'College': r.college,
        'Department': r.department,
        'Year': r.year,
        'Phone': r.phone || '',
        'Email': r.email || '',
        'Event Attendance Status': isCheckedIn ? 'CHECKED IN' : 'PENDING CHECK-IN',
        'Event Check-in Time': r[eventInfo.checkinKey] || 'NOT CHECKED IN',
        'Gate Entry Status': r.status,
        'Gate Entry Time': r.formattedTime,
        'Coordinator': r.coordinatorName
      };
    });

    const ws = XLSX.utils.json_to_sheet(dataRows);
    ws['!cols'] = [
      { wch: 6 },
      { wch: 16 },
      { wch: 26 },
      { wch: 34 },
      { wch: 22 },
      { wch: 10 },
      { wch: 16 },
      { wch: 28 },
      { wch: 24 },
      { wch: 22 },
      { wch: 18 },
      { wch: 20 },
      { wch: 20 }
    ];

    const wb = XLSX.utils.book_new();
    const sheetName = eventInfo.name.substring(0, 31);
    XLSX.utils.book_append_sheet(wb, ws, sheetName);

    const cleanFilename = filename.endsWith('.xlsx') ? filename : `${filename}.xlsx`;
    XLSX.writeFile(wb, cleanFilename);
    return;
  }

  // Case 2: Overall Attendance Multi-Sheet Workbook
  // Generates Sheet 1 (Overall Venue Attendance) + Dedicated Sheets for each event
  // If a participant chose 2-3 events, they appear in all chosen event sheets!
  const wb = XLSX.utils.book_new();

  // Helper for event status string in Overall Sheet
  const getEventOverallStatus = (isSelected?: string, checkinVal?: string) => {
    if (checkinVal && checkinVal !== 'NOT CHECKED IN') {
      return `CHECKED IN (${checkinVal})`;
    }
    if (isSelected === 'YES') {
      return 'SELECTED (Awaiting Entry)';
    }
    return 'NOT SELECTED';
  };

  // 1. Overall Venue Attendance Sheet
  const overallDataRows = rows.map((r, idx) => ({
    '#': idx + 1,
    'Pass ID': r.passId,
    'Participant Name': r.name,
    'College': r.college,
    'Department': r.department,
    'Year': r.year,
    'Phone': r.phone || '',
    'Email': r.email || '',
    'Gate Entry Status': r.status,
    'Gate Entry Time': r.formattedTime,
    'Selected Events': getInterestedEvents(r),
    'Code Crusade': getEventOverallStatus(r.codeCrusadeSelected, r.codeCrusadeCheckin),
    'Logic Arena': getEventOverallStatus(r.logicArenaSelected, r.logicArenaCheckin),
    'UI/UX Studio': getEventOverallStatus(r.uiuxStudioSelected, r.uiuxStudioCheckin),
    'Tech Tactics': getEventOverallStatus(r.techTacticsSelected, r.techTacticsCheckin),
    'Pixel Pulse': getEventOverallStatus(r.pixelPulseSelected, r.pixelPulseCheckin),
    'Gate Coordinator': r.coordinatorName
  }));

  const wsOverall = XLSX.utils.json_to_sheet(overallDataRows);
  wsOverall['!cols'] = [
    { wch: 6 },
    { wch: 16 },
    { wch: 26 },
    { wch: 34 },
    { wch: 22 },
    { wch: 10 },
    { wch: 16 },
    { wch: 28 },
    { wch: 18 },
    { wch: 20 },
    { wch: 36 },
    { wch: 26 },
    { wch: 26 },
    { wch: 26 },
    { wch: 26 },
    { wch: 26 },
    { wch: 20 }
  ];
  XLSX.utils.book_append_sheet(wb, wsOverall, 'Overall Venue Attendance');

  // 2. Individual Event Sheets (Each attendee who chose the event is included)
  const eventDefinitions = [
    { name: 'Code Crusade', key: 'codeCrusadeSelected' as const, checkinKey: 'codeCrusadeCheckin' as const },
    { name: 'Logic Arena', key: 'logicArenaSelected' as const, checkinKey: 'logicArenaCheckin' as const },
    { name: 'UI-UX Studio', key: 'uiuxStudioSelected' as const, checkinKey: 'uiuxStudioCheckin' as const },
    { name: 'Tech Tactics', key: 'techTacticsSelected' as const, checkinKey: 'techTacticsCheckin' as const },
    { name: 'Pixel Pulse', key: 'pixelPulseSelected' as const, checkinKey: 'pixelPulseCheckin' as const },
  ];

  eventDefinitions.forEach(evDef => {
    const eventParticipants = rows.filter(r => r[evDef.key] === 'YES');
    const eventSheetData = eventParticipants.map((r, idx) => {
      const isCheckedIn = Boolean(r[evDef.checkinKey] && r[evDef.checkinKey] !== 'NOT CHECKED IN');
      return {
        '#': idx + 1,
        'Pass ID': r.passId,
        'Participant Name': r.name,
        'College': r.college,
        'Department': r.department,
        'Year': r.year,
        'Phone': r.phone || '',
        'Email': r.email || '',
        'Event Attendance Status': isCheckedIn ? 'CHECKED IN' : 'PENDING CHECK-IN',
        'Event Check-in Time': r[evDef.checkinKey] || 'NOT CHECKED IN',
        'Gate Entry Status': r.status,
        'Gate Entry Time': r.formattedTime,
        'Coordinator': r.coordinatorName
      };
    });

    const wsEvent = XLSX.utils.json_to_sheet(eventSheetData);
    wsEvent['!cols'] = [
      { wch: 6 },
      { wch: 16 },
      { wch: 26 },
      { wch: 34 },
      { wch: 22 },
      { wch: 10 },
      { wch: 16 },
      { wch: 28 },
      { wch: 24 },
      { wch: 22 },
      { wch: 18 },
      { wch: 20 },
      { wch: 20 }
    ];
    XLSX.utils.book_append_sheet(wb, wsEvent, evDef.name.substring(0, 31));
  });

  const cleanFilename = filename.endsWith('.xlsx') ? filename : `${filename}.xlsx`;
  XLSX.writeFile(wb, cleanFilename);
}

/**
 * Print-ready landscape A4 PDF export using jsPDF
 */
export function exportToPDF(
  rows: ClassificationRow[],
  filename = 'vyugam_attendance.pdf',
  metadata?: ExportMetadata
): void {
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const title = metadata?.title || 'VYUGAM 2.0 ATTENDANCE REPORT';
  const subtitle = metadata?.subtitle || '';
  const now = new Date().toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  let filterSummary = '';
  if (metadata?.filters) {
    const filterPairs = Object.entries(metadata.filters)
      .filter(([_, v]) => Boolean(v) && v !== 'ALL')
      .map(([k, v]) => `${k}: ${v}`);
    if (filterPairs.length > 0) {
      filterSummary = `Filters: ${filterPairs.join(' | ')}`;
    }
  }

  // Title Header
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(30, 58, 138); // Navy blue
  doc.text(`VYUGAM 2.0 — ${title}`, 14, 15);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(100, 116, 139);
  const subtext = `${subtitle ? `${subtitle} | ` : ''}Generated: ${now}${filterSummary ? ` | ${filterSummary}` : ''} | Total Records: ${rows.length}`;
  doc.text(subtext, 14, 21);

  const eventInfo = resolveExportEvent(metadata);

  // Table setup
  const headers = eventInfo
    ? ['#', 'Pass ID', 'Name', 'College', 'Department', 'Year', 'Time', 'Selected', 'Status']
    : ['#', 'Pass ID', 'Name', 'College', 'Department', 'Year', 'Venue Time', 'Interested Events', 'Status'];
  const colWidths = eventInfo
    ? [10, 26, 45, 60, 48, 20, 26, 20, 24] // Sum = 279mm
    : [10, 24, 40, 52, 40, 18, 25, 42, 22]; // Sum = 273mm
  let startY = 27;
  const rowHeight = 7;
  let pageNum = 1;

  function renderTableHeader(y: number) {
    doc.setFillColor(37, 99, 235); // Blue 600
    doc.rect(14, y, 269, rowHeight, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(255, 255, 255);

    let curX = 14;
    headers.forEach((h, i) => {
      doc.text(h, curX + 2, y + 4.8);
      curX += colWidths[i];
    });
  }

  function renderPageFooter(currPage: number) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    doc.text(`VYUGAM 2.0 Official Attendance Log — Page ${currPage}`, pageWidth / 2, pageHeight - 8, {
      align: 'center'
    });
  }

  renderTableHeader(startY);
  startY += rowHeight;

  rows.forEach((r, idx) => {
    // Check if we need a new page
    if (startY + rowHeight > pageHeight - 15) {
      renderPageFooter(pageNum);
      doc.addPage();
      pageNum++;
      startY = 15;
      renderTableHeader(startY);
      startY += rowHeight;
    }

    // Row zebra background
    if (idx % 2 === 0) {
      doc.setFillColor(248, 250, 252);
      doc.rect(14, startY, 269, rowHeight, 'F');
    }

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(15, 23, 42);

    const isEntered = eventInfo
      ? Boolean(r[eventInfo.checkinKey] && r[eventInfo.checkinKey] !== 'NOT CHECKED IN')
      : r.status === 'ENTERED';

    const values = eventInfo
      ? [
          String(idx + 1),
          r.passId,
          truncateText(r.name, 24),
          truncateText(r.college, 32),
          truncateText(r.department, 26),
          r.year,
          String(r[eventInfo.checkinKey] || 'NOT CHECKED IN'),
          String(r[eventInfo.selectedKey] || 'NO'),
          isEntered ? 'ENTERED' : 'NOT ENTERED'
        ]
      : [
          String(idx + 1),
          r.passId,
          truncateText(r.name, 22),
          truncateText(r.college, 28),
          truncateText(r.department, 22),
          r.year,
          r.formattedTime,
          truncateText(getInterestedEvents(r), 24),
          r.status
        ];

    let curX = 14;
    values.forEach((v, i) => {
      if (i === 8) {
        // Status color
        if (v === 'ENTERED') {
          doc.setTextColor(5, 150, 105);
          doc.setFont('helvetica', 'bold');
        } else {
          doc.setTextColor(220, 38, 38);
          doc.setFont('helvetica', 'normal');
        }
      } else {
        doc.setTextColor(15, 23, 42);
        doc.setFont('helvetica', 'normal');
      }
      doc.text(v, curX + 2, startY + 4.8);
      curX += colWidths[i];
    });

    startY += rowHeight;
  });

  renderPageFooter(pageNum);

  doc.save(filename.endsWith('.pdf') ? filename : `${filename}.pdf`);
}

/**
 * Triggers clean browser print dialog with A4 landscape styles
 */
export function printReport(): void {
  if (typeof window !== 'undefined') {
    window.print();
  }
}

// Helpers
function triggerDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function truncateText(text: string, maxLen: number): string {
  if (!text) return '';
  return text.length > maxLen ? `${text.slice(0, maxLen - 2)}..` : text;
}
