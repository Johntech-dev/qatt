import { AttendanceRecord, Session } from './types';

export function exportAttendanceToCSV(
  records: AttendanceRecord[],
  fileName: string = 'attendance_report.csv',
  sessionInfo?: Session
) {
  if (!records || records.length === 0) {
    alert('No attendance records available to export.');
    return;
  }

  const headers = [
    'S/N',
    'Matric Number',
    'Student Name',
    'Course Code',
    'Course Title',
    'Topic / Session',
    'Date',
    'Time Marked',
    'Method',
    'Status',
  ];

  const rows = records.map((rec, index) => {
    const dateObj = new Date(rec.markedAt);
    const dateStr = dateObj.toLocaleDateString('en-GB');
    const timeStr = dateObj.toLocaleTimeString('en-US', { hour12: true });

    return [
      index + 1,
      `"${rec.matricNumber}"`,
      `"${rec.studentName}"`,
      `"${rec.courseCode}"`,
      `"${rec.courseTitle}"`,
      `"${sessionInfo?.topic || 'Regular Lecture'}"`,
      `"${dateStr}"`,
      `"${timeStr}"`,
      `"${rec.method === 'QR_SCAN' ? 'QR Camera Scan' : 'Manual Session Code'}"`,
      `"${rec.status}"`,
    ];
  });

  const csvContent =
    'data:text/csv;charset=utf-8,' +
    [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');

  const encodedUri = encodeURI(csvContent);
  const link = document.createElement('a');
  link.setAttribute('href', encodedUri);
  link.setAttribute('download', fileName);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
