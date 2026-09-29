'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { drawQRCodeWithLogo } from '@/lib/qrHelper';
import { exportAttendanceToCSV } from '@/lib/exportUtils';
import {
  X,
  Maximize2,
  Minimize2,
  Clock,
  Users,
  CheckCircle2,
  Download,
  AlertCircle,
  PlusCircle,
  StopCircle,
  Sparkles,
} from 'lucide-react';

interface ProjectorSession {
  id: string;
  topic: string;
  token: string;
  qrPayload: string;
  isActive: boolean;
  expiresAt: string;
  createdAt: string;
  durationMinutes: number;
  courseId: string;
  lecturerId?: string;
  courseCode?: string;
  courseTitle?: string;
  lecturerName?: string;
  course?: { code: string; title: string };
}

interface RealAttendanceRecord {
  id: string;
  markedAt: string;
  method: 'QR_SCAN' | 'SESSION_CODE';
  student: {
    id: string;
    name: string;
    matricNumber: string | null;
    level: string | null;
  };
  session: {
    id: string;
    topic: string;
    token: string;
    course: { code: string; title: string };
  };
}

interface QRProjectorModalProps {
  session: ProjectorSession;
  onClose: () => void;
}

export const QRProjectorModal: React.FC<QRProjectorModalProps> = ({ session: initialSession, onClose }) => {
  const [currentSession, setCurrentSession] = useState<ProjectorSession>(initialSession);
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [attendees, setAttendees] = useState<RealAttendanceRecord[]>([]);
  const [totalEnrolled, setTotalEnrolled] = useState<number>(0);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const modalContainerRef = useRef<HTMLDivElement | null>(null);

  const courseCode = currentSession.courseCode || currentSession.course?.code || 'COURSE';
  const courseTitle = currentSession.courseTitle || currentSession.course?.title || '';

  // Fetch real attendance records for this session
  const fetchSessionAttendees = useCallback(async () => {
    try {
      const res = await fetch(`/api/attendance/mark?sessionId=${currentSession.id}`, { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setAttendees(data.records || []);
      }
    } catch (err) {
      console.error('Error fetching session attendees:', err);
    }
  }, [currentSession.id]);

  // Fetch total enrollments count for this course
  const fetchEnrollmentCount = useCallback(async () => {
    try {
      const res = await fetch(`/api/enrollments?courseId=${currentSession.courseId}`, { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        const approved = (data.enrollments || []).filter((e: { status: string }) => e.status === 'APPROVED');
        setTotalEnrolled(approved.length);
      }
    } catch (err) {
      console.error('Error fetching enrollments:', err);
    }
  }, [currentSession.courseId]);

  useEffect(() => {
    fetchSessionAttendees();
    fetchEnrollmentCount();
    // Poll every 3 seconds for live student check-ins
    const interval = setInterval(fetchSessionAttendees, 3000);
    return () => clearInterval(interval);
  }, [fetchSessionAttendees, fetchEnrollmentCount]);

  // Render QR Code onto canvas with centered FPA logo (QR Code Monkey standard)
  useEffect(() => {
    if (canvasRef.current && currentSession.qrPayload) {
      drawQRCodeWithLogo(canvasRef.current, currentSession.qrPayload, {
        width: 340,
        margin: 2,
        darkColor: '#2b0948',
        lightColor: '#ffffff',
        logoSrc: '/fpa-logo.png',
        logoSizeRatio: 0.22,
      }).catch((err) => console.error('QR rendering error:', err));
    }
  }, [currentSession.qrPayload]);

  // Real API call to close session
  const endSession = async () => {
    try {
      const res = await fetch('/api/sessions', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ sessionId: currentSession.id, action: 'close' }),
      });
      if (res.ok) {
        setCurrentSession((prev) => ({ ...prev, isActive: false }));
      }
    } catch (err) {
      console.error('Error closing session:', err);
    }
  };

  // Real API call to extend session by additional minutes
  const extendSession = async (additionalMinutes: number = 5) => {
    try {
      const res = await fetch('/api/sessions', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          sessionId: currentSession.id,
          action: 'extend',
          additionalMinutes,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.session) {
          setCurrentSession((prev) => ({
            ...prev,
            expiresAt: data.session.expiresAt,
            isActive: true,
          }));
        }
      }
    } catch (err) {
      console.error('Error extending session:', err);
    }
  };

  // Ticking countdown timer
  useEffect(() => {
    const updateCountdown = () => {
      const remainingSeconds = Math.max(
        0,
        Math.floor((new Date(currentSession.expiresAt).getTime() - Date.now()) / 1000)
      );
      setTimeLeft(remainingSeconds);

      if (remainingSeconds <= 0 && currentSession.isActive) {
        endSession();
      }
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [currentSession.expiresAt, currentSession.isActive]);

  const formatTime = (secs: number) => {
    const minutes = Math.floor(secs / 60);
    const seconds = secs % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  const toggleFullScreen = () => {
    if (!document.fullscreenElement) {
      modalContainerRef.current?.requestFullscreen?.().catch((err) => {
        console.warn('Fullscreen error:', err);
      });
      setIsFullScreen(true);
    } else {
      document.exitFullscreen?.().catch((err) => {
        console.warn('Exit fullscreen error:', err);
      });
      setIsFullScreen(false);
    }
  };

  const handleExportCSV = () => {
    const formatted = attendees.map((rec) => ({
      id: rec.id,
      sessionId: rec.session.id,
      courseId: currentSession.courseId,
      studentId: rec.student.id,
      studentName: rec.student.name,
      matricNumber: rec.student.matricNumber || 'N/A',
      courseCode: rec.session.course.code,
      courseTitle: rec.session.course.title,
      markedAt: rec.markedAt,
      method: rec.method,
      status: 'PRESENT' as const,
    }));

    exportAttendanceToCSV(
      formatted,
      `${courseCode}_${currentSession.token}_Attendance.csv`,
      {
        id: currentSession.id,
        courseId: currentSession.courseId,
        courseCode,
        courseTitle,
        topic: currentSession.topic,
        token: currentSession.token,
        qrPayload: currentSession.qrPayload,
        durationMinutes: currentSession.durationMinutes,
        expiresAt: currentSession.expiresAt,
        isActive: currentSession.isActive,
        createdAt: currentSession.createdAt,
        lecturerName: currentSession.lecturerName || '',
      }
    );
  };

  const isExpired = timeLeft <= 0 || !currentSession.isActive;

  return (
    <div
      ref={modalContainerRef}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 100,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        background: isFullScreen ? '#05020a' : 'rgba(0, 0, 0, 0.85)',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        overflowY: 'auto',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 920,
          background: 'var(--bg-card)',
          border: '1px solid var(--border)',
          borderRadius: 20,
          boxShadow: '0 25px 60px rgba(0, 0, 0, 0.85), 0 0 1px 1px rgba(255, 255, 255, 0.06)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          margin: 'auto',
        }}
      >
        {/* Header Bar */}
        <div
          style={{
            padding: '16px 24px',
            borderBottom: '1px solid var(--border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'var(--bg-card)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div
              style={{
                width: 34,
                height: 34,
                borderRadius: 9,
                background: 'var(--accent)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
              }}
            >
              <Sparkles style={{ width: 18, height: 18 }} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-primary)' }}>
                  {courseCode} Projector Screen
                </span>
                {isExpired ? (
                  <span
                    style={{
                      fontSize: 10,
                      fontWeight: 700,
                      padding: '2px 8px',
                      borderRadius: 4,
                      background: 'rgba(239, 68, 68, 0.15)',
                      color: '#f87171',
                      border: '1px solid rgba(239, 68, 68, 0.3)',
                    }}
                  >
                    Session Expired
                  </span>
                ) : (
                  <span
                    style={{
                      fontSize: 10,
                      fontWeight: 700,
                      padding: '2px 8px',
                      borderRadius: 4,
                      background: 'rgba(34, 197, 94, 0.15)',
                      color: '#4ade80',
                      border: '1px solid rgba(34, 197, 94, 0.3)',
                    }}
                  >
                    ● LIVE NOW
                  </span>
                )}
              </div>
              <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '2px 0 0' }}>
                {currentSession.topic} {courseTitle ? `· ${courseTitle}` : ''}
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button
              onClick={toggleFullScreen}
              style={{
                padding: 7,
                borderRadius: 8,
                border: '1px solid var(--border)',
                background: 'transparent',
                color: 'var(--text-secondary)',
                cursor: 'pointer',
              }}
              title={isFullScreen ? 'Exit Full Screen' : 'Projector Full Screen'}
            >
              {isFullScreen ? <Minimize2 style={{ width: 16, height: 16 }} /> : <Maximize2 style={{ width: 16, height: 16 }} />}
            </button>
            <button
              onClick={onClose}
              style={{
                padding: 7,
                borderRadius: 8,
                border: '1px solid var(--border)',
                background: 'transparent',
                color: 'var(--text-secondary)',
                cursor: 'pointer',
              }}
              title="Close View"
            >
              <X style={{ width: 16, height: 16 }} />
            </button>
          </div>
        </div>

        {/* Main Projector Body */}
        <div
          style={{
            padding: '28px',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: 24,
            alignItems: 'center',
          }}
        >
          {/* Left Column: Big QR Code Box */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
            <div
              style={{
                position: 'relative',
                padding: 16,
                borderRadius: 20,
                background: '#ffffff',
                boxShadow: '0 20px 50px rgba(0, 0, 0, 0.5)',
                border: '4px solid rgba(168, 85, 247, 0.4)',
              }}
            >
              <canvas ref={canvasRef} style={{ display: 'block', maxWidth: '100%', height: 'auto', borderRadius: 14 }} />

              {/* Expired Overlay if session timed out */}
              {isExpired && (
                <div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    background: 'rgba(0, 0, 0, 0.9)',
                    backdropFilter: 'blur(4px)',
                    borderRadius: 16,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: 20,
                    color: '#ffffff',
                  }}
                >
                  <AlertCircle style={{ width: 44, height: 44, color: '#f87171', marginBottom: 8 }} />
                  <p style={{ fontWeight: 800, fontSize: 18, margin: '0 0 6px' }}>Session Closed</p>
                  <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: 0 }}>
                    This QR code is no longer accepting new attendance records.
                  </p>
                </div>
              )}
            </div>

            {/* Session Token Code Callout */}
            <div style={{ marginTop: 16, display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 600, color: 'var(--text-muted)' }}>
                Manual Session Code:
              </span>
              <span
                style={{
                  fontFamily: 'monospace',
                  fontSize: 16,
                  fontWeight: 800,
                  letterSpacing: '1px',
                  padding: '4px 12px',
                  borderRadius: 6,
                  background: 'rgba(124, 58, 237, 0.15)',
                  color: '#c4b5fd',
                  border: '1px solid rgba(124, 58, 237, 0.3)',
                }}
              >
                {currentSession.token}
              </span>
            </div>

            <p style={{ marginTop: 8, fontSize: 11, color: 'var(--text-muted)', maxWidth: 300, lineHeight: 1.4 }}>
              Students point smartphone camera at this screen or enter the code above into their student portal.
            </p>
          </div>

          {/* Right Column: Live Attendees & Controls */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 18, height: '100%' }}>
            {/* Countdown Box */}
            <div
              style={{
                padding: 18,
                borderRadius: 14,
                background: 'var(--bg)',
                border: '1px solid var(--border)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                <span style={{ fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Clock style={{ width: 15, height: 15, color: 'var(--accent)' }} /> Time Remaining
                </span>
                <span style={{ fontFamily: 'monospace', fontSize: 24, fontWeight: 900, color: isExpired ? '#f87171' : 'var(--text-primary)' }}>
                  {formatTime(timeLeft)}
                </span>
              </div>

              {/* Progress bar */}
              <div style={{ width: '100%', background: 'var(--border)', height: 6, borderRadius: 999, overflow: 'hidden' }}>
                <div
                  style={{
                    height: '100%',
                    background: isExpired ? '#f87171' : 'var(--accent)',
                    width: `${Math.min(100, (timeLeft / (currentSession.durationMinutes * 60)) * 100)}%`,
                    transition: 'width 1s linear',
                  }}
                />
              </div>

              {/* Quick Session Controls */}
              <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
                <button
                  onClick={() => extendSession(5)}
                  style={{
                    flex: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 6,
                    padding: '8px 12px',
                    borderRadius: 8,
                    fontSize: 12,
                    fontWeight: 600,
                    background: 'var(--accent)',
                    color: '#ffffff',
                    border: 'none',
                    cursor: 'pointer',
                  }}
                >
                  <PlusCircle style={{ width: 14, height: 14 }} /> +5 Mins
                </button>
                {currentSession.isActive && !isExpired && (
                  <button
                    onClick={endSession}
                    style={{
                      padding: '8px 14px',
                      borderRadius: 8,
                      fontSize: 12,
                      fontWeight: 600,
                      background: 'rgba(239, 68, 68, 0.15)',
                      color: '#f87171',
                      border: '1px solid rgba(239, 68, 68, 0.3)',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                    }}
                  >
                    <StopCircle style={{ width: 14, height: 14 }} /> End Now
                  </button>
                )}
              </div>
            </div>

            {/* Live Attendance Counter */}
            <div
              style={{
                padding: 18,
                borderRadius: 14,
                background: 'var(--bg)',
                border: '1px solid var(--border)',
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Users style={{ width: 16, height: 16, color: '#4ade80' }} />
                  <span style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--text-primary)' }}>
                    Live Check-Ins
                  </span>
                </div>
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    padding: '2px 8px',
                    borderRadius: 4,
                    background: 'rgba(34, 197, 94, 0.12)',
                    color: '#4ade80',
                    border: '1px solid rgba(34, 197, 94, 0.25)',
                  }}
                >
                  {attendees.length} {totalEnrolled > 0 ? `/ ${totalEnrolled}` : ''} Recorded
                </span>
              </div>

              {/* Real-time attendee list */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 180, overflowY: 'auto' }}>
                {attendees.length === 0 ? (
                  <p style={{ fontSize: 12, color: 'var(--text-muted)', textAlign: 'center', padding: '24px 0' }}>
                    Waiting for students to scan…
                  </p>
                ) : (
                  attendees.map((rec) => (
                    <div
                      key={rec.id}
                      style={{
                        padding: '8px 12px',
                        borderRadius: 8,
                        background: 'var(--bg-card)',
                        border: '1px solid var(--border)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        fontSize: 12,
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <CheckCircle2 style={{ width: 14, height: 14, color: '#4ade80' }} />
                        <div>
                          <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{rec.student.name}</span>
                          <span style={{ fontSize: 11, color: 'var(--text-muted)', marginLeft: 6, fontFamily: 'monospace' }}>
                            {rec.student.matricNumber || '—'}
                          </span>
                        </div>
                      </div>
                      <span style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'monospace' }}>
                        {new Date(rec.markedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                      </span>
                    </div>
                  ))
                )}
              </div>

              {/* Export Button */}
              {attendees.length > 0 && (
                <button
                  onClick={handleExportCSV}
                  style={{
                    marginTop: 14,
                    width: '100%',
                    padding: '8px',
                    borderRadius: 8,
                    background: 'transparent',
                    border: '1px solid var(--border)',
                    color: 'var(--text-primary)',
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 6,
                  }}
                >
                  <Download style={{ width: 14, height: 14 }} /> Download Session CSV ({attendees.length})
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
