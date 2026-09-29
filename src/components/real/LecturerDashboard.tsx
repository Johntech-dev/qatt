'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { QrCode, Plus, Download, Check, XCircle, Play, X } from 'lucide-react';
import { QRProjectorModal } from '@/components/QRProjectorModal';
import { drawQRCodeWithLogo } from '@/lib/qrHelper';

interface Course {
  id: string;
  code: string;
  title: string;
  department: string;
  semester: string;
  units: number;
  requiresApproval: boolean;
  createdAt: string;
  lecturer: { id: string; name: string; department: string };
  _count: { enrollments: number };
}

interface Enrollment {
  id: string;
  status: string;
  enrolledAt: string;
  student: { id: string; name: string; matricNumber: string | null; level: string | null; department: string };
  course: { id: string; code: string; title: string };
}

interface Session {
  id: string;
  topic: string;
  token: string;
  qrPayload: string;
  isActive: boolean;
  expiresAt: string;
  createdAt: string;
  durationMinutes: number;
  courseId: string;
  lecturerId: string;
  course: { code: string; title: string };
  _count: { attendance: number };
  // For QRProjectorModal compat:
  courseCode: string;
  courseTitle: string;
  lecturerName: string;
}

export default function LecturerDashboard() {
  const { user } = useAuth();
  const [courses, setCourses] = useState<Course[]>([]);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [loadingCourses, setLoadingCourses] = useState(true);
  const [projectorSession, setProjectorSession] = useState<Session | null>(null);

  // Create course modal
  const [showCreate, setShowCreate] = useState(false);
  const [newCode, setNewCode] = useState('');
  const [newTitle, setNewTitle] = useState('');
  const [newDept, setNewDept] = useState(user?.department ?? 'Software & Web Development');
  const [newSemester, setNewSemester] = useState('1st Semester 2025/2026');
  const [newUnits, setNewUnits] = useState(3);
  const [newRequires, setNewRequires] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState('');

  // Session modal
  const [showSession, setShowSession] = useState(false);
  const [sessionTopic, setSessionTopic] = useState('');
  const [sessionDuration, setSessionDuration] = useState(15);
  const [startingSession, setStartingSession] = useState(false);

  const fetchCourses = useCallback(async () => {
    const res = await fetch('/api/courses?mine=true', { credentials: 'include' });
    if (res.ok) {
      const data = await res.json();
      setCourses(data.courses);
      if (data.courses.length > 0 && !selectedCourse) {
        setSelectedCourse(data.courses[0]);
      }
    }
    setLoadingCourses(false);
  }, [selectedCourse]);

  const fetchEnrollments = useCallback(async (courseId?: string) => {
    const url = courseId ? `/api/enrollments?courseId=${courseId}` : '/api/enrollments';
    const res = await fetch(url, { credentials: 'include' });
    if (res.ok) {
      const data = await res.json();
      setEnrollments(data.enrollments);
    }
  }, []);

  const fetchSessions = useCallback(async (courseId?: string) => {
    const url = courseId ? `/api/sessions?courseId=${courseId}` : '/api/sessions';
    const res = await fetch(url, { credentials: 'include' });
    if (res.ok) {
      const data = await res.json();
      // Normalize for modal compat
      setSessions(data.sessions.map((s: Session) => ({
        ...s,
        courseCode: s.course.code,
        courseTitle: s.course.title,
        lecturerName: user?.name ?? '',
      })));
    }
  }, [user]);

  useEffect(() => {
    fetchCourses();
  }, []);

  useEffect(() => {
    if (selectedCourse) {
      fetchEnrollments(selectedCourse.id);
      fetchSessions(selectedCourse.id);
    }
  }, [selectedCourse]);

  const handleCreateCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    setCreateError('');
    const res = await fetch('/api/courses', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        code: newCode,
        title: newTitle,
        department: newDept,
        semester: newSemester,
        units: newUnits,
        requiresApproval: newRequires,
      }),
    });
    const data = await res.json();
    if (!res.ok) { setCreateError(data.error); setCreating(false); return; }
    setShowCreate(false);
    setNewCode(''); setNewTitle('');
    await fetchCourses();
    setSelectedCourse(data.course);
    setCreating(false);
  };

  const handleStartSession = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCourse) return;
    setStartingSession(true);
    const res = await fetch('/api/sessions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        courseId: selectedCourse.id,
        topic: sessionTopic || `Lecture - ${selectedCourse.code}`,
        durationMinutes: sessionDuration,
      }),
    });
    const data = await res.json();
    setStartingSession(false);
    if (!res.ok) return;
    setShowSession(false);
    setSessionTopic('');
    const normalized = {
      ...data.session,
      courseCode: data.session.course.code,
      courseTitle: data.session.course.title,
      lecturerName: user?.name ?? '',
    };
    setProjectorSession(normalized);
    await fetchSessions(selectedCourse.id);
  };

  const handleUpdateEnrollment = async (enrollmentId: string, status: 'APPROVED' | 'REJECTED') => {
    await fetch('/api/enrollments', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ enrollmentId, status }),
    });
    if (selectedCourse) fetchEnrollments(selectedCourse.id);
  };

  const exportCSV = () => {
    if (enrollments.length === 0) return;
    const headers = ['Student Name', 'Matric Number', 'Level', 'Department', 'Status', 'Enrolled'];
    const rows = enrollments.map((e) => [
      e.student.name,
      e.student.matricNumber ?? '',
      e.student.level ?? '',
      e.student.department,
      e.status,
      new Date(e.enrolledAt).toLocaleDateString(),
    ]);
    const csv = [headers, ...rows].map((r) => r.join(',')).join('\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
    a.download = `${selectedCourse?.code}_Enrollment_Report.csv`;
    a.click();
  };

  const courseEnrollments = selectedCourse
    ? enrollments.filter((e) => e.course.id === selectedCourse.id)
    : enrollments;

  const courseSessions = selectedCourse
    ? sessions.filter((s) => s.courseId === selectedCourse.id)
    : sessions;

  const liveSession = courseSessions.find(
    (s) => s.isActive && new Date(s.expiresAt) > new Date()
  );

  const inputStyle: React.CSSProperties = {
    width: '100%',
    background: 'var(--bg)',
    border: '1px solid var(--border)',
    borderRadius: 8,
    padding: '9px 12px',
    fontSize: 12,
    color: 'var(--text-primary)',
    outline: 'none',
    fontFamily: 'inherit',
    boxSizing: 'border-box',
  };

  const labelStyle: React.CSSProperties = {
    display: 'block',
    fontSize: 11,
    fontWeight: 600,
    color: 'var(--text-secondary)',
    marginBottom: 5,
  };

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: '28px 24px', display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Header */}
      <div
        className="nex-card"
        style={{
          padding: '24px 28px',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 14,
        }}
      >
        <div>
          <p style={{ fontSize: 9, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--accent)', margin: 0 }}>
            Lecturer Control Center
          </p>
          <h2 style={{ fontSize: 22, fontWeight: 800, letterSpacing: '-0.4px', color: 'var(--text-primary)', margin: '4px 0 2px' }}>
            Welcome, {user?.name}
          </h2>
          <p style={{ fontSize: 12, color: 'var(--text-secondary)', margin: 0 }}>
            {user?.department} · Federal Polytechnic, Ado-Ekiti
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={() => setShowCreate(true)}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              padding: '8px 16px', borderRadius: 8,
              border: '1px solid var(--border)', background: 'transparent',
              color: 'var(--text-secondary)', fontSize: 12, fontWeight: 600,
              cursor: 'pointer', fontFamily: 'inherit',
            }}
          >
            <Plus style={{ width: 13, height: 13 }} /> Add Course
          </button>
          {liveSession ? (
            <button
              onClick={() => setProjectorSession(liveSession)}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                padding: '8px 16px', borderRadius: 8, border: 'none',
                background: '#16a34a', color: '#fff', fontSize: 12, fontWeight: 700,
                cursor: 'pointer', fontFamily: 'inherit',
              }}
            >
              <QrCode style={{ width: 13, height: 13 }} /> Open Live QR — {liveSession.courseCode}
            </button>
          ) : (
            <button
              onClick={() => setShowSession(true)}
              disabled={!selectedCourse}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                padding: '8px 16px', borderRadius: 8, border: 'none',
                background: 'var(--accent)', color: '#fff', fontSize: 12, fontWeight: 700,
                cursor: selectedCourse ? 'pointer' : 'not-allowed', fontFamily: 'inherit',
                opacity: selectedCourse ? 1 : 0.5,
              }}
            >
              <Play style={{ width: 13, height: 13 }} /> Start Session
            </button>
          )}
        </div>
      </div>

      {loadingCourses ? (
        <p style={{ fontSize: 13, color: 'var(--text-muted)', textAlign: 'center', padding: '40px 0' }}>
          Loading your courses…
        </p>
      ) : courses.length === 0 ? (
        <div className="nex-card" style={{ padding: 40, textAlign: 'center' }}>
          <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 12 }}>
            No courses yet. Create your first course to get started.
          </p>
          <button
            onClick={() => setShowCreate(true)}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              padding: '9px 20px', borderRadius: 8, border: 'none',
              background: 'var(--accent)', color: '#fff', fontSize: 12, fontWeight: 700,
              cursor: 'pointer', fontFamily: 'inherit',
            }}
          >
            <Plus style={{ width: 13, height: 13 }} /> Create First Course
          </button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', gap: 16 }}>
          {/* Course List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <p style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--text-muted)', marginBottom: 4 }}>
              My Courses ({courses.length})
            </p>
            {courses.map((c) => {
              const isSelected = selectedCourse?.id === c.id;
              const hasLive = sessions.some((s) => s.courseId === c.id && s.isActive && new Date(s.expiresAt) > new Date());
              return (
                <div
                  key={c.id}
                  onClick={() => setSelectedCourse(c)}
                  style={{
                    padding: '12px 14px', borderRadius: 10, cursor: 'pointer',
                    border: `1px solid ${isSelected ? 'var(--accent)' : 'var(--border)'}`,
                    background: isSelected ? 'var(--accent-subtle)' : 'var(--bg-card)',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                    <span style={{ fontSize: 11, fontWeight: 800, fontFamily: 'monospace', color: 'var(--accent)' }}>{c.code}</span>
                    {hasLive && <span className="badge badge-live">LIVE</span>}
                  </div>
                  <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.title}</p>
                  <p style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 2 }}>{c._count.enrollments} enrolled · {c.units} units</p>
                </div>
              );
            })}
          </div>

          {/* Course Workspace */}
          {selectedCourse && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {/* Course header */}
              <div className="nex-card" style={{ padding: '20px 22px' }}>
                <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, paddingBottom: 16, borderBottom: '1px solid var(--border)', marginBottom: 16 }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 11, fontWeight: 800, fontFamily: 'monospace', padding: '2px 8px', borderRadius: 6, border: '1px solid var(--accent-border)', color: 'var(--accent)', background: 'var(--accent-subtle)' }}>{selectedCourse.code}</span>
                      <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{selectedCourse.units} units · {selectedCourse.semester}</span>
                    </div>
                    <h3 style={{ fontSize: 17, fontWeight: 700, color: 'var(--text-primary)', margin: '6px 0 0' }}>{selectedCourse.title}</h3>
                  </div>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button
                      onClick={() => setShowSession(true)}
                      style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '6px 14px', borderRadius: 7, border: 'none', background: 'var(--accent)', color: '#fff', fontSize: 11, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}
                    >
                      <QrCode style={{ width: 12, height: 12 }} /> Start QR Session
                    </button>
                    <button
                      onClick={exportCSV}
                      style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '6px 14px', borderRadius: 7, border: 'none', background: '#16a34a', color: '#fff', fontSize: 11, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}
                    >
                      <Download style={{ width: 12, height: 12 }} /> Export CSV
                    </button>
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
                  {[
                    { label: 'Enrolled', value: courseEnrollments.filter((e) => e.status === 'APPROVED').length },
                    { label: 'Sessions', value: courseSessions.length },
                    { label: 'Pending Approval', value: courseEnrollments.filter((e) => e.status === 'PENDING').length },
                  ].map((s) => (
                    <div key={s.label}>
                      <p style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--text-muted)', margin: 0 }}>{s.label}</p>
                      <p style={{ fontSize: 26, fontWeight: 800, color: 'var(--text-primary)', margin: '3px 0 0', letterSpacing: '-0.5px' }}>{s.value}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Enrollment Roster */}
              <div className="nex-card" style={{ padding: '20px 22px' }}>
                <p style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--text-muted)', marginBottom: 14 }}>
                  Student Roster ({courseEnrollments.length})
                </p>
                {courseEnrollments.length === 0 ? (
                  <p style={{ fontSize: 12, color: 'var(--text-muted)', textAlign: 'center', padding: '20px 0' }}>No students enrolled yet.</p>
                ) : (
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                      <thead>
                        <tr>
                          {['Student', 'Matric', 'Level', 'Status', 'Actions'].map((h, i) => (
                            <th key={h} style={{ padding: '0 0 10px', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--text-muted)', textAlign: i === 4 ? 'right' : 'left', borderBottom: '1px solid var(--border)' }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {courseEnrollments.map((enr, i) => (
                          <tr key={enr.id} style={{ borderTop: i > 0 ? '1px solid var(--border)' : 'none' }}>
                            <td style={{ padding: '10px 0', fontWeight: 600, color: 'var(--text-primary)' }}>{enr.student.name}</td>
                            <td style={{ padding: '10px 0', fontFamily: 'monospace', color: 'var(--accent)', fontSize: 11 }}>{enr.student.matricNumber ?? '—'}</td>
                            <td style={{ padding: '10px 0', color: 'var(--text-muted)', fontSize: 11 }}>{enr.student.level ?? '—'}</td>
                            <td style={{ padding: '10px 0' }}>
                              <span className={enr.status === 'APPROVED' ? 'badge badge-green' : enr.status === 'PENDING' ? 'badge badge-yellow' : 'badge badge-red'}>{enr.status}</span>
                            </td>
                            <td style={{ padding: '10px 0', textAlign: 'right' }}>
                              {enr.status === 'PENDING' ? (
                                <div style={{ display: 'inline-flex', gap: 4 }}>
                                  <button onClick={() => handleUpdateEnrollment(enr.id, 'APPROVED')} style={{ padding: 5, borderRadius: 5, border: 'none', background: 'rgba(34,197,94,0.1)', color: '#22c55e', cursor: 'pointer' }}><Check style={{ width: 12, height: 12 }} /></button>
                                  <button onClick={() => handleUpdateEnrollment(enr.id, 'REJECTED')} style={{ padding: 5, borderRadius: 5, border: 'none', background: 'rgba(239,68,68,0.1)', color: '#ef4444', cursor: 'pointer' }}><XCircle style={{ width: 12, height: 12 }} /></button>
                                </div>
                              ) : enr.status === 'APPROVED' ? (
                                <button onClick={() => handleUpdateEnrollment(enr.id, 'REJECTED')} style={{ fontSize: 10, color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer' }}>Revoke</button>
                              ) : (
                                <button onClick={() => handleUpdateEnrollment(enr.id, 'APPROVED')} style={{ fontSize: 10, color: '#22c55e', background: 'none', border: 'none', cursor: 'pointer' }}>Re-approve</button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Sessions */}
              <div className="nex-card" style={{ padding: '20px 22px' }}>
                <p style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--text-muted)', marginBottom: 14 }}>
                  Lecture Sessions ({courseSessions.length})
                </p>
                {courseSessions.length === 0 ? (
                  <p style={{ fontSize: 12, color: 'var(--text-muted)', textAlign: 'center', padding: '20px 0' }}>No sessions yet. Start a QR session to begin.</p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {courseSessions.map((sess) => {
                      const isLive = sess.isActive && new Date(sess.expiresAt) > new Date();
                      return (
                        <div key={sess.id} style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 10, padding: '10px 12px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg)' }}>
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                              <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)' }}>{sess.topic}</span>
                              <span className={isLive ? 'badge badge-live' : 'badge'} style={isLive ? {} : { background: 'rgba(255,255,255,0.04)', color: 'var(--text-muted)', border: '1px solid var(--border)' }}>
                                {isLive ? 'Active' : 'Ended'}
                              </span>
                            </div>
                            <p style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 2, fontFamily: 'monospace' }}>
                              {new Date(sess.createdAt).toLocaleDateString()} · Token: <strong style={{ color: 'var(--accent)' }}>{sess.token}</strong> · {sess._count.attendance} present
                            </p>
                          </div>
                          <button
                            onClick={() => setProjectorSession(sess)}
                            style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '5px 12px', borderRadius: 6, border: 'none', background: 'var(--accent)', color: '#fff', fontSize: 11, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}
                          >
                            <QrCode style={{ width: 11, height: 11 }} /> Projector
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Create Course Modal */}
      {showCreate && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 100,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 16,
            background: 'rgba(0, 0, 0, 0.8)',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowCreate(false);
          }}
        >
          <div
            style={{
              width: '100%',
              maxWidth: 480,
              background: 'var(--bg-card)',
              border: '1px solid var(--border)',
              borderRadius: 16,
              boxShadow: '0 25px 60px rgba(0, 0, 0, 0.85), 0 0 1px 1px rgba(255, 255, 255, 0.05)',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div
              style={{
                padding: '16px 22px',
                borderBottom: '1px solid var(--border)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                background: 'var(--bg-card)',
              }}
            >
              <div>
                <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                  Add New Course
                </h3>
                <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: '2px 0 0' }}>
                  Create and register a new course for attendance tracking
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowCreate(false)}
                style={{
                  background: 'transparent',
                  border: '1px solid var(--border)',
                  borderRadius: 7,
                  width: 30,
                  height: 30,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--text-secondary)',
                  cursor: 'pointer',
                  padding: 0,
                }}
              >
                <X style={{ width: 15, height: 15 }} />
              </button>
            </div>

            {/* Modal Form Body */}
            <form onSubmit={handleCreateCourse} style={{ padding: '20px 22px', display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={labelStyle}>Course Code</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. CSC 301"
                  value={newCode}
                  onChange={(e) => setNewCode(e.target.value.toUpperCase())}
                  style={{ ...inputStyle, fontFamily: 'monospace', textTransform: 'uppercase' }}
                />
              </div>

              <div>
                <label style={labelStyle}>Course Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Web Development"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  style={inputStyle}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div>
                  <label style={labelStyle}>Credit Units</label>
                  <input
                    type="number"
                    min={1}
                    max={6}
                    value={newUnits}
                    onChange={(e) => setNewUnits(Number(e.target.value))}
                    style={inputStyle}
                  />
                </div>
                <div>
                  <label style={labelStyle}>Semester</label>
                  <select value={newSemester} onChange={(e) => setNewSemester(e.target.value)} style={inputStyle}>
                    <option value="1st Semester 2025/2026">1st Semester 2025/2026</option>
                    <option value="2nd Semester 2025/2026">2nd Semester 2025/2026</option>
                  </select>
                </div>
              </div>

              <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'var(--text-secondary)', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={newRequires}
                  onChange={(e) => setNewRequires(e.target.checked)}
                />
                Require lecturer approval before student marks attendance
              </label>

              {createError && (
                <div style={{ padding: '8px 12px', borderRadius: 6, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#f87171', fontSize: 12 }}>
                  {createError}
                </div>
              )}

              <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
                <button
                  type="button"
                  onClick={() => setShowCreate(false)}
                  style={{ flex: 1, ...inputStyle, cursor: 'pointer', fontWeight: 600, textAlign: 'center' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  style={{
                    flex: 1,
                    padding: '10px 0',
                    borderRadius: 8,
                    border: 'none',
                    background: 'var(--accent)',
                    color: '#fff',
                    fontSize: 12,
                    fontWeight: 700,
                    cursor: creating ? 'not-allowed' : 'pointer',
                    fontFamily: 'inherit',
                    opacity: creating ? 0.7 : 1,
                  }}
                >
                  {creating ? 'Creating…' : 'Create Course'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Start Session Modal */}
      {showSession && selectedCourse && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 100,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 16,
            background: 'rgba(0, 0, 0, 0.8)',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowSession(false);
          }}
        >
          <div
            style={{
              width: '100%',
              maxWidth: 440,
              background: 'var(--bg-card)',
              border: '1px solid var(--border)',
              borderRadius: 16,
              boxShadow: '0 25px 60px rgba(0, 0, 0, 0.85), 0 0 1px 1px rgba(255, 255, 255, 0.05)',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div
              style={{
                padding: '16px 22px',
                borderBottom: '1px solid var(--border)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                background: 'var(--bg-card)',
              }}
            >
              <div>
                <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                  Launch Attendance Session
                </h3>
                <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: '2px 0 0' }}>
                  Generate live QR for <strong style={{ color: 'var(--accent)' }}>{selectedCourse.code}</strong>
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowSession(false)}
                style={{
                  background: 'transparent',
                  border: '1px solid var(--border)',
                  borderRadius: 7,
                  width: 30,
                  height: 30,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--text-secondary)',
                  cursor: 'pointer',
                  padding: 0,
                }}
              >
                <X style={{ width: 15, height: 15 }} />
              </button>
            </div>

            {/* Modal Form Body */}
            <form onSubmit={handleStartSession} style={{ padding: '20px 22px', display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={labelStyle}>Lecture Topic</label>
                <input
                  type="text"
                  placeholder="e.g. Introduction to React Components"
                  value={sessionTopic}
                  onChange={(e) => setSessionTopic(e.target.value)}
                  style={inputStyle}
                />
              </div>

              <div>
                <label style={labelStyle}>QR Code Expiry Duration</label>
                <select value={sessionDuration} onChange={(e) => setSessionDuration(Number(e.target.value))} style={inputStyle}>
                  <option value={5}>5 Minutes (Quick Rollcall)</option>
                  <option value={10}>10 Minutes</option>
                  <option value={15}>15 Minutes</option>
                  <option value={30}>30 Minutes</option>
                  <option value={60}>60 Minutes (Full Lecture)</option>
                </select>
              </div>

              <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
                <button
                  type="button"
                  onClick={() => setShowSession(false)}
                  style={{ flex: 1, ...inputStyle, cursor: 'pointer', fontWeight: 600, textAlign: 'center' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={startingSession}
                  style={{
                    flex: 1,
                    padding: '10px 0',
                    borderRadius: 8,
                    border: 'none',
                    background: 'var(--accent)',
                    color: '#fff',
                    fontSize: 12,
                    fontWeight: 700,
                    cursor: startingSession ? 'not-allowed' : 'pointer',
                    fontFamily: 'inherit',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 6,
                    opacity: startingSession ? 0.7 : 1,
                  }}
                >
                  <QrCode style={{ width: 14, height: 14 }} /> {startingSession ? 'Generating…' : 'Generate QR'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* QR Projector Modal */}
      {projectorSession && (
        <QRProjectorModal
          session={projectorSession as never}
          onClose={() => { setProjectorSession(null); if (selectedCourse) fetchSessions(selectedCourse.id); }}
        />
      )}
    </div>
  );
}
