'use client';

import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { 
  QrCode, 
  Search, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  BookOpen, 
  Camera, 
  X, 
  Check, 
  GraduationCap, 
  RotateCcw
} from 'lucide-react';

interface Course {
  id: string;
  code: string;
  title: string;
  department: string;
  semester: string;
  units: number;
  requiresApproval: boolean;
  lecturer: { id: string; name: string; department: string };
  _count: { enrollments: number };
}

interface Enrollment {
  id: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  enrolledAt: string;
  course: Course;
}

interface AttendanceRecord {
  id: string;
  markedAt: string;
  method: 'QR_SCAN' | 'SESSION_CODE';
  session: {
    id: string;
    topic: string;
    token: string;
    createdAt: string;
    course: { code: string; title: string };
  };
}

export default function StudentDashboard() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'attendance' | 'my-courses' | 'browse' | 'history'>('attendance');

  // Enrolled courses & attendance history
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [attendanceHistory, setAttendanceHistory] = useState<AttendanceRecord[]>([]);

  // Search & Catalog
  const [catalog, setCatalog] = useState<Course[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loadingCatalog, setLoadingCatalog] = useState(false);
  const [enrollingCourseId, setEnrollingCourseId] = useState<string | null>(null);
  const [enrollMsg, setEnrollMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Mark attendance state
  const [sessionTokenInput, setSessionTokenInput] = useState('');
  const [submittingToken, setSubmittingToken] = useState(false);
  const [markStatus, setMarkStatus] = useState<{
    type: 'success' | 'error' | 'already';
    message: string;
    courseCode?: string;
    courseTitle?: string;
  } | null>(null);

  // Camera QR Scanner state
  const [scannerOpen, setScannerOpen] = useState(false);
  const [scannerError, setScannerError] = useState<string | null>(null);
  const scannerRef = useRef<unknown>(null);

  const fetchEnrollments = useCallback(async () => {
    try {
      const res = await fetch('/api/enrollments', { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setEnrollments(data.enrollments || []);
      }
    } catch (e) {
      console.error(e);
    }
  }, []);

  const fetchAttendanceHistory = useCallback(async () => {
    try {
      const res = await fetch('/api/attendance/mark', { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setAttendanceHistory(data.records || []);
      }
    } catch (e) {
      console.error(e);
    }
  }, []);

  const searchCourses = useCallback(async (query: string) => {
    setLoadingCatalog(true);
    try {
      const res = await fetch(`/api/courses?search=${encodeURIComponent(query)}`, { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setCatalog(data.courses || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingCatalog(false);
    }
  }, []);

  useEffect(() => {
    fetchEnrollments();
    fetchAttendanceHistory();
    searchCourses('');
  }, [fetchEnrollments, fetchAttendanceHistory, searchCourses]);

  // Handle enrollment
  const handleEnroll = async (courseId: string) => {
    setEnrollingCourseId(courseId);
    setEnrollMsg(null);
    try {
      const res = await fetch(`/api/courses/${courseId}/enroll`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      });
      const data = await res.json();
      if (res.ok) {
        setEnrollMsg({ text: data.message || 'Enrolled successfully!', type: 'success' });
        await fetchEnrollments();
      } else {
        setEnrollMsg({ text: data.error || 'Failed to enroll.', type: 'error' });
      }
    } catch (e) {
      console.error(e);
      setEnrollMsg({ text: 'Network error. Please try again.', type: 'error' });
    } finally {
      setEnrollingCourseId(null);
    }
  };

  // Submit manual session code or payload
  const handleMarkAttendance = async (tokenOrPayload: string, isPayload = false) => {
    const trimmed = tokenOrPayload.trim();
    if (!trimmed) return;
    setSubmittingToken(true);
    setMarkStatus(null);

    try {
      const body = isPayload ? { qrPayload: trimmed, method: 'QR_SCAN' } : { token: trimmed, method: 'SESSION_CODE' };

      const res = await fetch('/api/attendance/mark', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (res.ok) {
        if (data.alreadyMarked) {
          setMarkStatus({
            type: 'already',
            message: 'You have already checked in for this session.',
          });
        } else {
          setMarkStatus({
            type: 'success',
            message: data.message || 'Attendance verified successfully!',
            courseCode: data.record?.courseCode,
            courseTitle: data.record?.courseTitle,
          });
          setSessionTokenInput('');
          await fetchAttendanceHistory();
        }
      } else {
        setMarkStatus({
          type: 'error',
          message: data.error || 'Failed to record attendance. Please verify the code.',
        });
      }
    } catch {
      setMarkStatus({
        type: 'error',
        message: 'Network error. Please try again.',
      });
    } finally {
      setSubmittingToken(false);
    }
  };

  // Camera QR scanner integration using html5-qrcode
  const startScanner = async () => {
    setScannerOpen(true);
    setScannerError(null);
    try {
      const { Html5Qrcode } = await import('html5-qrcode');
      setTimeout(async () => {
        try {
          const scanner = new Html5Qrcode('qr-reader-container');
          scannerRef.current = scanner;
          await scanner.start(
            { facingMode: 'environment' },
            {
              fps: 10,
              qrbox: { width: 250, height: 250 },
            },
            async (decodedText) => {
              await stopScanner();
              handleMarkAttendance(decodedText, true);
            },
            () => {}
          );
        } catch (err: unknown) {
          console.error(err);
          setScannerError('Could not access camera. Please check camera permissions or use the Session Code input.');
        }
      }, 300);
    } catch (e) {
      console.error(e);
      setScannerError('Failed to load scanner module.');
    }
  };

  const stopScanner = async () => {
    if (scannerRef.current) {
      try {
        const scanner = scannerRef.current as { isScanning: boolean; stop: () => Promise<void>; clear: () => void };
        if (scanner.isScanning) {
          await scanner.stop();
        }
        scanner.clear();
      } catch (err) {
        console.error('Error stopping scanner', err);
      }
      scannerRef.current = null;
    }
    setScannerOpen(false);
  };

  const isEnrolled = (courseId: string) => {
    return enrollments.find((e) => e.course.id === courseId);
  };

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: '24px 20px', display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Top Banner / Student Profile */}
      <div
        style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border)',
          borderRadius: 14,
          padding: '24px 28px',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 16,
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <span
              style={{
                fontSize: 10,
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.6px',
                padding: '3px 8px',
                borderRadius: 4,
                background: 'rgba(124,58,237,0.12)',
                color: '#a78bfa',
                border: '1px solid rgba(124,58,237,0.25)',
              }}
            >
              Student Portal
            </span>
            <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
              Federal Polytechnic, Ado-Ekiti
            </span>
          </div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 6px' }}>
            {user?.name}
          </h1>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, fontSize: 12, color: 'var(--text-secondary)' }}>
            <span>Matric: <strong style={{ color: 'var(--text-primary)' }}>{user?.matricNumber || 'N/A'}</strong></span>
            <span>·</span>
            <span>Level: <strong style={{ color: 'var(--text-primary)' }}>{user?.level || 'ND I'}</strong></span>
            <span>·</span>
            <span>Dept: <strong style={{ color: 'var(--text-primary)' }}>{user?.department}</strong></span>
          </div>
        </div>

        {/* Quick Stats */}
        <div style={{ display: 'flex', gap: 12 }}>
          <div
            style={{
              padding: '12px 18px',
              borderRadius: 10,
              background: 'var(--bg)',
              border: '1px solid var(--border)',
              textAlign: 'center',
            }}
          >
            <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--text-primary)' }}>
              {enrollments.filter((e) => e.status === 'APPROVED').length}
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>Registered Courses</div>
          </div>
          <div
            style={{
              padding: '12px 18px',
              borderRadius: 10,
              background: 'var(--bg)',
              border: '1px solid var(--border)',
              textAlign: 'center',
            }}
          >
            <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--accent)' }}>
              {attendanceHistory.length}
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>Sessions Attended</div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div
        style={{
          display: 'flex',
          gap: 6,
          borderBottom: '1px solid var(--border)',
          paddingBottom: 4,
        }}
      >
        <button
          onClick={() => setActiveTab('attendance')}
          style={{
            padding: '9px 16px',
            borderRadius: 8,
            fontSize: 13,
            fontWeight: 600,
            cursor: 'pointer',
            border: 'none',
            background: activeTab === 'attendance' ? 'var(--accent)' : 'transparent',
            color: activeTab === 'attendance' ? '#ffffff' : 'var(--text-secondary)',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            transition: 'all 0.15s ease',
          }}
        >
          <QrCode style={{ width: 15, height: 15 }} />
          Mark Attendance
        </button>

        <button
          onClick={() => setActiveTab('my-courses')}
          style={{
            padding: '9px 16px',
            borderRadius: 8,
            fontSize: 13,
            fontWeight: 600,
            cursor: 'pointer',
            border: 'none',
            background: activeTab === 'my-courses' ? 'var(--accent)' : 'transparent',
            color: activeTab === 'my-courses' ? '#ffffff' : 'var(--text-secondary)',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            transition: 'all 0.15s ease',
          }}
        >
          <BookOpen style={{ width: 15, height: 15 }} />
          My Courses ({enrollments.length})
        </button>

        <button
          onClick={() => setActiveTab('browse')}
          style={{
            padding: '9px 16px',
            borderRadius: 8,
            fontSize: 13,
            fontWeight: 600,
            cursor: 'pointer',
            border: 'none',
            background: activeTab === 'browse' ? 'var(--accent)' : 'transparent',
            color: activeTab === 'browse' ? '#ffffff' : 'var(--text-secondary)',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            transition: 'all 0.15s ease',
          }}
        >
          <Search style={{ width: 15, height: 15 }} />
          Register Courses
        </button>

        <button
          onClick={() => setActiveTab('history')}
          style={{
            padding: '9px 16px',
            borderRadius: 8,
            fontSize: 13,
            fontWeight: 600,
            cursor: 'pointer',
            border: 'none',
            background: activeTab === 'history' ? 'var(--accent)' : 'transparent',
            color: activeTab === 'history' ? '#ffffff' : 'var(--text-secondary)',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            transition: 'all 0.15s ease',
          }}
        >
          <Clock style={{ width: 15, height: 15 }} />
          Attendance Log
        </button>
      </div>

      {/* TAB 1: MARK ATTENDANCE */}
      {activeTab === 'attendance' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 20 }}>
          {/* Card 1: Check in by QR or Session Code */}
          <div
            style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border)',
              borderRadius: 12,
              padding: 24,
              display: 'flex',
              flexDirection: 'column',
              gap: 18,
            }}
          >
            <div>
              <h2 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 6px' }}>
                Instant Check-in
              </h2>
              <p style={{ fontSize: 12, color: 'var(--text-secondary)', margin: 0 }}>
                Scan the QR code displayed by your lecturer, or enter the 8-character session token.
              </p>
            </div>

            {/* Status alerts */}
            {markStatus && (
              <div
                style={{
                  padding: '12px 16px',
                  borderRadius: 8,
                  fontSize: 12,
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 10,
                  background:
                    markStatus.type === 'success'
                      ? 'rgba(34,197,94,0.1)'
                      : markStatus.type === 'already'
                      ? 'rgba(234,179,8,0.1)'
                      : 'rgba(239,68,68,0.1)',
                  border: `1px solid ${
                    markStatus.type === 'success'
                      ? 'rgba(34,197,94,0.3)'
                      : markStatus.type === 'already'
                      ? 'rgba(234,179,8,0.3)'
                      : 'rgba(239,68,68,0.3)'
                  }`,
                  color:
                    markStatus.type === 'success'
                      ? '#4ade80'
                      : markStatus.type === 'already'
                      ? '#facc15'
                      : '#f87171',
                }}
              >
                {markStatus.type === 'success' ? (
                  <CheckCircle2 style={{ width: 16, height: 16, flexShrink: 0, marginTop: 1 }} />
                ) : (
                  <AlertCircle style={{ width: 16, height: 16, flexShrink: 0, marginTop: 1 }} />
                )}
                <div>
                  <div style={{ fontWeight: 600 }}>{markStatus.message}</div>
                  {markStatus.courseCode && (
                    <div style={{ fontSize: 11, marginTop: 4, opacity: 0.9 }}>
                      Course: {markStatus.courseCode} · {markStatus.courseTitle}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* QR Scanner trigger */}
            <button
              onClick={startScanner}
              style={{
                width: '100%',
                padding: '13px',
                borderRadius: 8,
                background: 'var(--accent)',
                color: '#ffffff',
                border: 'none',
                fontWeight: 600,
                fontSize: 13,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                transition: 'opacity 0.15s ease',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.9')}
              onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
            >
              <Camera style={{ width: 16, height: 16 }} />
              Open Camera Scanner
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '4px 0' }}>
              <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
              <span style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                or enter token code
              </span>
              <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
            </div>

            {/* Manual token input */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleMarkAttendance(sessionTokenInput);
              }}
              style={{ display: 'flex', flexDirection: 'column', gap: 12 }}
            >
              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>
                  Session Token (e.g. 4A8B9C1E)
                </label>
                <div style={{ display: 'flex', gap: 8 }}>
                  <input
                    type="text"
                    placeholder="Enter code..."
                    value={sessionTokenInput}
                    onChange={(e) => setSessionTokenInput(e.target.value.toUpperCase())}
                    style={{
                      flex: 1,
                      background: 'var(--bg)',
                      border: '1px solid var(--border)',
                      borderRadius: 8,
                      padding: '10px 12px',
                      fontSize: 14,
                      fontFamily: 'monospace',
                      letterSpacing: '1px',
                      color: 'var(--text-primary)',
                      outline: 'none',
                    }}
                  />
                  <button
                    type="submit"
                    disabled={submittingToken || !sessionTokenInput.trim()}
                    style={{
                      padding: '0 18px',
                      borderRadius: 8,
                      background: 'var(--accent)',
                      color: '#ffffff',
                      border: 'none',
                      fontWeight: 600,
                      fontSize: 12,
                      cursor: submittingToken || !sessionTokenInput.trim() ? 'not-allowed' : 'pointer',
                      opacity: submittingToken || !sessionTokenInput.trim() ? 0.6 : 1,
                    }}
                  >
                    {submittingToken ? 'Checking…' : 'Submit'}
                  </button>
                </div>
              </div>
            </form>
          </div>

          {/* Quick instructions / guidelines */}
          <div
            style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border)',
              borderRadius: 12,
              padding: 24,
              display: 'flex',
              flexDirection: 'column',
              gap: 16,
            }}
          >
            <h2 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
              Attendance Rules & Guidelines
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14, fontSize: 12, color: 'var(--text-secondary)' }}>
              <div style={{ display: 'flex', gap: 12 }}>
                <div style={{ width: 22, height: 22, borderRadius: 6, background: 'rgba(124,58,237,0.15)', color: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontWeight: 700 }}>
                  1
                </div>
                <div>
                  <strong style={{ color: 'var(--text-primary)' }}>Register before scanning:</strong> You must be enrolled in the course to record attendance. Check the "Register Courses" tab if you haven't yet.
                </div>
              </div>
              <div style={{ display: 'flex', gap: 12 }}>
                <div style={{ width: 22, height: 22, borderRadius: 6, background: 'rgba(124,58,237,0.15)', color: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontWeight: 700 }}>
                  2
                </div>
                <div>
                  <strong style={{ color: 'var(--text-primary)' }}>Live sessions only:</strong> Each QR code generated by the lecturer is valid for a limited window (10–30 mins). Expired tokens cannot be submitted.
                </div>
              </div>
              <div style={{ display: 'flex', gap: 12 }}>
                <div style={{ width: 22, height: 22, borderRadius: 6, background: 'rgba(124,58,237,0.15)', color: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontWeight: 700 }}>
                  3
                </div>
                <div>
                  <strong style={{ color: 'var(--text-primary)' }}>No proxy attendance:</strong> Every scan is bound to your account and matriculation number with instant duplicate detection.
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: MY COURSES */}
      {activeTab === 'my-courses' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
              Enrolled Courses ({enrollments.length})
            </h2>
            <button
              onClick={() => setActiveTab('browse')}
              style={{
                fontSize: 12,
                color: 'var(--accent)',
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: 4,
              }}
            >
              + Register New Course
            </button>
          </div>

          {enrollments.length === 0 ? (
            <div
              style={{
                background: 'var(--bg-card)',
                border: '1px solid var(--border)',
                borderRadius: 12,
                padding: '48px 24px',
                textAlign: 'center',
              }}
            >
              <GraduationCap style={{ width: 36, height: 36, color: 'var(--text-muted)', margin: '0 auto 12px' }} />
              <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', margin: '0 0 6px' }}>
                You have not registered for any courses yet.
              </p>
              <p style={{ fontSize: 12, color: 'var(--text-secondary)', margin: '0 0 16px' }}>
                Search for your departmental courses and enroll with one click.
              </p>
              <button
                onClick={() => setActiveTab('browse')}
                style={{
                  padding: '9px 18px',
                  borderRadius: 8,
                  background: 'var(--accent)',
                  color: '#ffffff',
                  border: 'none',
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Browse Course Catalog
              </button>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
              {enrollments.map((enr) => {
                const countAttended = attendanceHistory.filter((a) => a.session?.course?.code === enr.course.code).length;
                return (
                  <div
                    key={enr.id}
                    style={{
                      background: 'var(--bg-card)',
                      border: '1px solid var(--border)',
                      borderRadius: 12,
                      padding: 18,
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      gap: 14,
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                        <span
                          style={{
                            fontSize: 13,
                            fontWeight: 800,
                            fontFamily: 'monospace',
                            color: 'var(--text-primary)',
                            padding: '3px 8px',
                            background: 'var(--bg)',
                            border: '1px solid var(--border)',
                            borderRadius: 6,
                          }}
                        >
                          {enr.course.code}
                        </span>
                        <span
                          style={{
                            fontSize: 10,
                            fontWeight: 700,
                            padding: '3px 7px',
                            borderRadius: 4,
                            background:
                              enr.status === 'APPROVED'
                                ? 'rgba(34,197,94,0.1)'
                                : enr.status === 'PENDING'
                                ? 'rgba(234,179,8,0.1)'
                                : 'rgba(239,68,68,0.1)',
                            color:
                              enr.status === 'APPROVED'
                                ? '#4ade80'
                                : enr.status === 'PENDING'
                                ? '#facc15'
                                : '#f87171',
                            border: `1px solid ${
                              enr.status === 'APPROVED'
                                ? 'rgba(34,197,94,0.3)'
                                : enr.status === 'PENDING'
                                ? 'rgba(234,179,8,0.3)'
                                : 'rgba(239,68,68,0.3)'
                            }`,
                          }}
                        >
                          {enr.status}
                        </span>
                      </div>
                      <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 6px' }}>
                        {enr.course.title}
                      </h3>
                      <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
                        Lecturer: {enr.course.lecturer?.name || 'Assigned Lecturer'}
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                        {enr.course.department} · {enr.course.units} Units
                      </div>
                    </div>

                    <div
                      style={{
                        paddingTop: 12,
                        borderTop: '1px solid var(--border)',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        fontSize: 11,
                      }}
                    >
                      <span style={{ color: 'var(--text-muted)' }}>Sessions Recorded:</span>
                      <span style={{ fontWeight: 700, color: 'var(--accent)' }}>{countAttended}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: REGISTER COURSES (CATALOG SEARCH & 1-CLICK REGISTRATION) */}
      {activeTab === 'browse' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
            <div>
              <h2 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 4px' }}>
                Course Registration Portal
              </h2>
              <p style={{ fontSize: 12, color: 'var(--text-secondary)', margin: 0 }}>
                Search for your semester courses by course code or title and enroll with one click.
              </p>
            </div>

            {/* Search Input */}
            <div style={{ position: 'relative', width: 280 }}>
              <Search
                style={{
                  position: 'absolute',
                  left: 10,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  width: 14,
                  height: 14,
                  color: 'var(--text-muted)',
                }}
              />
              <input
                type="text"
                placeholder="Search e.g. SWD 211, COM..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  searchCourses(e.target.value);
                }}
                style={{
                  width: '100%',
                  padding: '8px 12px 8px 32px',
                  borderRadius: 8,
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border)',
                  fontSize: 12,
                  color: 'var(--text-primary)',
                  outline: 'none',
                }}
              />
            </div>
          </div>

          {enrollMsg && (
            <div
              style={{
                padding: '10px 14px',
                borderRadius: 8,
                fontSize: 12,
                background: enrollMsg.type === 'success' ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)',
                border: `1px solid ${enrollMsg.type === 'success' ? 'rgba(34,197,94,0.3)' : 'rgba(239,68,68,0.3)'}`,
                color: enrollMsg.type === 'success' ? '#4ade80' : '#f87171',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
              }}
            >
              {enrollMsg.type === 'success' ? <Check style={{ width: 14, height: 14 }} /> : <AlertCircle style={{ width: 14, height: 14 }} />}
              <span>{enrollMsg.text}</span>
            </div>
          )}

          {loadingCatalog ? (
            <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)', fontSize: 13 }}>
              Loading courses…
            </div>
          ) : catalog.length === 0 ? (
            <div
              style={{
                background: 'var(--bg-card)',
                border: '1px solid var(--border)',
                borderRadius: 12,
                padding: '40px 24px',
                textAlign: 'center',
              }}
            >
              <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: 0 }}>
                {searchQuery ? `No courses found matching "${searchQuery}".` : 'No courses created yet by lecturers.'}
              </p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
              {catalog.map((course) => {
                const existingEnrollment = isEnrolled(course.id);
                return (
                  <div
                    key={course.id}
                    style={{
                      background: 'var(--bg-card)',
                      border: '1px solid var(--border)',
                      borderRadius: 12,
                      padding: 18,
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      gap: 14,
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                        <span
                          style={{
                            fontSize: 13,
                            fontWeight: 800,
                            fontFamily: 'monospace',
                            color: 'var(--text-primary)',
                            padding: '3px 8px',
                            background: 'var(--bg)',
                            border: '1px solid var(--border)',
                            borderRadius: 6,
                          }}
                        >
                          {course.code}
                        </span>
                        <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                          {course.units} Units
                        </span>
                      </div>
                      <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 6px' }}>
                        {course.title}
                      </h3>
                      <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
                        Lecturer: {course.lecturer?.name || 'Department Lecturer'}
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                        {course.department}
                      </div>
                      {course.requiresApproval && (
                        <div style={{ marginTop: 8, fontSize: 10, color: '#facc15' }}>
                          * Requires lecturer approval after registration
                        </div>
                      )}
                    </div>

                    <div style={{ paddingTop: 12, borderTop: '1px solid var(--border)', display: 'flex', gap: 8 }}>
                      {existingEnrollment ? (
                        <div
                          style={{
                            flex: 1,
                            padding: '8px 12px',
                            borderRadius: 6,
                            textAlign: 'center',
                            fontSize: 12,
                            fontWeight: 600,
                            background:
                              existingEnrollment.status === 'APPROVED'
                                ? 'rgba(34,197,94,0.1)'
                                : 'rgba(234,179,8,0.1)',
                            color:
                              existingEnrollment.status === 'APPROVED'
                                ? '#4ade80'
                                : '#facc15',
                            border: `1px solid ${
                              existingEnrollment.status === 'APPROVED'
                                ? 'rgba(34,197,94,0.3)'
                                : 'rgba(234,179,8,0.3)'
                            }`,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: 6,
                          }}
                        >
                          <Check style={{ width: 14, height: 14 }} />
                          {existingEnrollment.status === 'APPROVED' ? 'Enrolled' : 'Pending Approval'}
                        </div>
                      ) : (
                        <button
                          onClick={() => handleEnroll(course.id)}
                          disabled={enrollingCourseId === course.id}
                          style={{
                            flex: 1,
                            padding: '8px 12px',
                            borderRadius: 6,
                            background: 'var(--accent)',
                            color: '#ffffff',
                            border: 'none',
                            fontSize: 12,
                            fontWeight: 600,
                            cursor: enrollingCourseId === course.id ? 'not-allowed' : 'pointer',
                            opacity: enrollingCourseId === course.id ? 0.7 : 1,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: 6,
                          }}
                        >
                          {enrollingCourseId === course.id ? 'Registering…' : 'Register in 1-Click'}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 4: ATTENDANCE HISTORY */}
      {activeTab === 'history' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
              Attendance Records ({attendanceHistory.length})
            </h2>
            <button
              onClick={fetchAttendanceHistory}
              style={{
                fontSize: 12,
                color: 'var(--text-secondary)',
                background: 'transparent',
                border: '1px solid var(--border)',
                borderRadius: 6,
                padding: '5px 10px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              <RotateCcw style={{ width: 12, height: 12 }} />
              Refresh
            </button>
          </div>

          {attendanceHistory.length === 0 ? (
            <div
              style={{
                background: 'var(--bg-card)',
                border: '1px solid var(--border)',
                borderRadius: 12,
                padding: '40px 24px',
                textAlign: 'center',
                color: 'var(--text-muted)',
                fontSize: 13,
              }}
            >
              No attendance records recorded yet. Check in using a session QR code or token code!
            </div>
          ) : (
            <div
              style={{
                background: 'var(--bg-card)',
                border: '1px solid var(--border)',
                borderRadius: 12,
                overflow: 'hidden',
              }}
            >
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <thead>
                  <tr style={{ background: 'var(--bg)', borderBottom: '1px solid var(--border)', textAlign: 'left' }}>
                    <th style={{ padding: '12px 16px', color: 'var(--text-secondary)', fontWeight: 600 }}>Course</th>
                    <th style={{ padding: '12px 16px', color: 'var(--text-secondary)', fontWeight: 600 }}>Topic</th>
                    <th style={{ padding: '12px 16px', color: 'var(--text-secondary)', fontWeight: 600 }}>Method</th>
                    <th style={{ padding: '12px 16px', color: 'var(--text-secondary)', fontWeight: 600 }}>Time Marked</th>
                    <th style={{ padding: '12px 16px', color: 'var(--text-secondary)', fontWeight: 600 }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {attendanceHistory.map((rec) => (
                    <tr key={rec.id} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td style={{ padding: '12px 16px', color: 'var(--text-primary)', fontWeight: 600 }}>
                        {rec.session?.course?.code || '—'}
                      </td>
                      <td style={{ padding: '12px 16px', color: 'var(--text-secondary)' }}>
                        {rec.session?.topic || 'Lecture'}
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <span
                          style={{
                            fontSize: 10,
                            padding: '2px 6px',
                            borderRadius: 4,
                            background: 'var(--bg)',
                            border: '1px solid var(--border)',
                            color: 'var(--text-muted)',
                          }}
                        >
                          {rec.method === 'QR_SCAN' ? 'QR Code' : 'Session Code'}
                        </span>
                      </td>
                      <td style={{ padding: '12px 16px', color: 'var(--text-muted)' }}>
                        {new Date(rec.markedAt).toLocaleString()}
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <span
                          style={{
                            fontSize: 11,
                            fontWeight: 600,
                            color: '#4ade80',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 4,
                          }}
                        >
                          <CheckCircle2 style={{ width: 13, height: 13 }} />
                          Present
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Camera QR Scanner Modal */}
      {scannerOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 100,
            background: 'rgba(0,0,0,0.85)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 20,
          }}
        >
          <div
            style={{
              width: '100%',
              maxWidth: 420,
              background: 'var(--bg-card)',
              border: '1px solid var(--border)',
              borderRadius: 14,
              overflow: 'hidden',
              boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)',
            }}
          >
            <div
              style={{
                padding: '14px 18px',
                borderBottom: '1px solid var(--border)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Camera style={{ width: 16, height: 16, color: 'var(--accent)' }} />
                <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>
                  Scan Attendance QR Code
                </span>
              </div>
              <button
                onClick={stopScanner}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  padding: 4,
                }}
              >
                <X style={{ width: 18, height: 18 }} />
              </button>
            </div>

            <div style={{ padding: 18 }}>
              {scannerError ? (
                <div style={{ textAlign: 'center', padding: '24px 12px' }}>
                  <AlertCircle style={{ width: 28, height: 28, color: '#f87171', margin: '0 auto 10px' }} />
                  <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 16 }}>{scannerError}</p>
                  <button
                    onClick={stopScanner}
                    style={{
                      padding: '8px 16px',
                      borderRadius: 6,
                      background: 'var(--accent)',
                      color: '#ffffff',
                      border: 'none',
                      fontSize: 12,
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    Close & Enter Code Manually
                  </button>
                </div>
              ) : (
                <>
                  <div
                    id="qr-reader-container"
                    style={{
                      width: '100%',
                      borderRadius: 10,
                      overflow: 'hidden',
                      border: '1px solid var(--border)',
                    }}
                  />
                  <p style={{ fontSize: 11, color: 'var(--text-muted)', textAlign: 'center', marginTop: 12, margin: '12px 0 0' }}>
                    Point your camera directly at the lecturer's projector screen.
                  </p>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
