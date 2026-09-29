export type Role = 'ADMIN' | 'LECTURER' | 'STUDENT';

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  matricNumber?: string;
  department: string;
  institution: string;
  avatarUrl?: string;
}

export interface Course {
  id: string;
  code: string;
  title: string;
  lecturerId: string;
  lecturerName: string;
  department: string;
  semester: string;
  units: number;
  requiresApproval: boolean;
  createdAt: string;
}

export type EnrollmentStatus = 'APPROVED' | 'PENDING' | 'REJECTED';

export interface Enrollment {
  id: string;
  courseId: string;
  studentId: string;
  studentName: string;
  matricNumber: string;
  status: EnrollmentStatus;
  enrolledAt: string;
}

export interface Session {
  id: string;
  courseId: string;
  courseCode: string;
  courseTitle: string;
  lecturerId: string;
  lecturerName: string;
  topic: string;
  token: string;
  qrPayload: string;
  createdAt: string;
  expiresAt: string;
  durationMinutes: number;
  isActive: boolean;
}

export interface AttendanceRecord {
  id: string;
  sessionId: string;
  courseId: string;
  courseCode: string;
  courseTitle: string;
  studentId: string;
  studentName: string;
  matricNumber: string;
  markedAt: string;
  method: 'QR_SCAN' | 'SESSION_CODE';
  status: 'PRESENT';
  deviceInfo?: string;
}

export interface ScanResult {
  success: boolean;
  message: string;
  record?: AttendanceRecord;
}
