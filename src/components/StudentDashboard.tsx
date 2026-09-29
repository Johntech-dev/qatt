'use client';

import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { Camera, Check, Clock, PlusCircle } from 'lucide-react';

interface StudentDashboardProps {
  onOpenScanner: () => void;
}

export const StudentDashboard: React.FC<StudentDashboardProps> = ({ onOpenScanner }) => {
  const { currentUser, courses, enrollments, sessions, attendance, enrollCourse } = useApp();
  const [activeTab, setActiveTab] = useState<'courses' | 'catalog' | 'history'>('courses');
  const [notification, setNotification] = useState<string | null>(null);

  const student = currentUser?.role === 'STUDENT' ? currentUser : null;

  const myEnrollments = enrollments.filter((e) => e.studentId === student?.id);
  const myApprovedCourses = courses.filter((c) =>
    myEnrollments.some((e) => e.courseId === c.id && e.status === 'APPROVED')
  );
  const myAttendance = attendance.filter((a) => a.studentId === student?.id);

  const totalRelevantSessions = sessions.filter((s) =>
    myApprovedCourses.some((c) => c.id === s.courseId)
  ).length;

  const attendancePercentage =
    totalRelevantSessions > 0
      ? Math.round((myAttendance.length / totalRelevantSessions) * 100)
      : 100;

  const isExamEligible = attendancePercentage >= 75;

  const handleEnroll = (courseId: string) => {
    const res = enrollCourse(courseId, student?.id);
    setNotification(res.message);
    setTimeout(() => setNotification(null), 4000);
  };

  const liveSessions = sessions.filter(
    (s) =>
      s.isActive &&
      new Date(s.expiresAt) > new Date() &&
      myApprovedCourses.some((c) => c.id === s.courseId)
  );

  const tabs: { key: 'courses' | 'catalog' | 'history'; label: string }[] = [
    { key: 'courses', label: `My Courses (${myApprovedCourses.length})` },
    { key: 'catalog', label: 'Course Catalog' },
    { key: 'history', label: `Scan History (${myAttendance.length})` },
  ];

  return (
    <div
      style={{
        maxWidth: 1200,
        margin: '0 auto',
        padding: '32px 24px',
        display: 'flex',
        flexDirection: 'column',
        gap: 24,
      }}
    >
      {/* Student Header Banner */}
      <div className="nex-card" style={{ padding: '28px 32px' }}>
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 16,
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <p style={{ fontSize: 9, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#22c55e', margin: 0 }}>
                Student Portal
              </p>
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  fontFamily: 'monospace',
                  padding: '2px 8px',
                  borderRadius: 99,
                  border: '1px solid var(--accent-border)',
                  background: 'var(--accent-subtle)',
                  color: 'var(--accent)',
                }}
              >
                {student?.matricNumber || 'FPA/CS/24/03-0108'}
              </span>
            </div>
            <h2 style={{ fontSize: 24, fontWeight: 800, letterSpacing: '-0.5px', color: 'var(--text-primary)', margin: 0 }}>
              {student?.name || 'Sanya Ololade Timileyin'}
            </h2>
            <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 4 }}>
              Dept. of {student?.department || 'Software & Web Development'} · Federal Polytechnic, Ado-Ekiti
            </p>
          </div>

          <button
            onClick={onOpenScanner}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              padding: '10px 22px',
              borderRadius: 8,
              border: 'none',
              background: 'var(--accent)',
              color: '#fff',
              fontSize: 13,
              fontWeight: 700,
              cursor: 'pointer',
              fontFamily: 'inherit',
              boxShadow: '0 0 20px rgba(168,85,247,0.25)',
            }}
          >
            <Camera style={{ width: 14, height: 14 }} />
            Scan QR Code
          </button>
        </div>

        {/* Live Class Alert */}
        {liveSessions.length > 0 && (
          <div
            style={{
              marginTop: 20,
              padding: '12px 16px',
              borderRadius: 8,
              border: '1px solid rgba(34,197,94,0.3)',
              background: 'rgba(34,197,94,0.06)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 12,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  background: '#22c55e',
                  flexShrink: 0,
                  animation: 'pulse 1.5s ease-in-out infinite',
                }}
              />
              <div>
                <p style={{ fontSize: 12, fontWeight: 700, color: '#22c55e', margin: 0 }}>
                  Class in Session: {liveSessions.map((s) => `${s.courseCode}`).join(', ')}
                </p>
                <p style={{ fontSize: 11, color: '#86efac', margin: '2px 0 0' }}>
                  QR code is active on the lecture hall screen. Scan before it expires!
                </p>
              </div>
            </div>
            <button
              onClick={onOpenScanner}
              style={{
                padding: '6px 14px',
                borderRadius: 6,
                border: 'none',
                background: '#16a34a',
                color: '#fff',
                fontSize: 11,
                fontWeight: 700,
                cursor: 'pointer',
                fontFamily: 'inherit',
                flexShrink: 0,
              }}
            >
              Scan Now
            </button>
          </div>
        )}
      </div>

      {/* Stat Cards — NO ICONS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14 }}>
        {/* Registered Courses */}
        <div className="nex-card" style={{ padding: '20px 22px' }}>
          <p style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--text-muted)', margin: 0 }}>
            Registered Courses
          </p>
          <p style={{ fontSize: 32, fontWeight: 800, letterSpacing: '-1px', color: 'var(--text-primary)', margin: '6px 0 0', lineHeight: 1.1 }}>
            {myApprovedCourses.length}
          </p>
          <p style={{ fontSize: 11, color: 'var(--accent)', marginTop: 5, fontWeight: 500 }}>
            {myEnrollments.filter((e) => e.status === 'PENDING').length} pending approval
          </p>
        </div>

        {/* Attendance */}
        <div className="nex-card" style={{ padding: '20px 22px' }}>
          <p style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--text-muted)', margin: 0 }}>
            Overall Attendance
          </p>
          <p style={{ fontSize: 32, fontWeight: 800, letterSpacing: '-1px', color: 'var(--text-primary)', margin: '6px 0 0', lineHeight: 1.1 }}>
            {attendancePercentage}%
          </p>
          <div style={{ marginTop: 8, background: 'var(--border)', borderRadius: 99, height: 3, overflow: 'hidden' }}>
            <div
              style={{
                height: '100%',
                borderRadius: 99,
                background: attendancePercentage >= 75 ? '#22c55e' : '#eab308',
                width: `${Math.min(100, attendancePercentage)}%`,
                transition: 'width 0.4s ease',
              }}
            />
          </div>
        </div>

        {/* Exam Eligibility */}
        <div className="nex-card" style={{ padding: '20px 22px' }}>
          <p style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--text-muted)', margin: 0 }}>
            Exam Eligibility
          </p>
          <div style={{ marginTop: 10 }}>
            <span
              className={isExamEligible ? 'badge badge-green' : 'badge badge-red'}
              style={{ fontSize: 11, padding: '5px 12px' }}
            >
              {isExamEligible ? 'Qualified for Exams' : 'Attendance Deficit'}
            </span>
          </div>
          <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 8 }}>
            Min. 75% required by FPA policy
          </p>
        </div>
      </div>

      {/* Notification */}
      {notification && (
        <div
          style={{
            padding: '12px 16px',
            borderRadius: 8,
            background: 'var(--accent)',
            color: '#fff',
            fontSize: 12,
            fontWeight: 600,
          }}
        >
          {notification}
        </div>
      )}

      {/* Tabs */}
      <div
        style={{
          display: 'inline-flex',
          padding: 4,
          borderRadius: 10,
          border: '1px solid var(--border)',
          background: 'var(--bg-card)',
          gap: 2,
          alignSelf: 'flex-start',
        }}
      >
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            style={{
              padding: '6px 16px',
              borderRadius: 7,
              border: 'none',
              background: activeTab === tab.key ? 'var(--accent)' : 'transparent',
              color: activeTab === tab.key ? '#fff' : 'var(--text-muted)',
              fontSize: 11,
              fontWeight: 700,
              cursor: 'pointer',
              fontFamily: 'inherit',
              transition: 'background 0.15s, color 0.15s',
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab: My Courses */}
      {activeTab === 'courses' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 14 }}>
          {myApprovedCourses.map((c) => {
            const courseSessions = sessions.filter((s) => s.courseId === c.id);
            const attendedCount = myAttendance.filter((a) => a.courseId === c.id).length;
            const rate = courseSessions.length > 0 ? Math.round((attendedCount / courseSessions.length) * 100) : 100;
            const isLive = sessions.some(
              (s) => s.courseId === c.id && s.isActive && new Date(s.expiresAt) > new Date()
            );

            return (
              <div key={c.id} className="nex-card" style={{ padding: '20px 22px', display: 'flex', flexDirection: 'column', gap: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 800,
                      fontFamily: 'monospace',
                      padding: '2px 8px',
                      borderRadius: 6,
                      border: '1px solid var(--accent-border)',
                      color: 'var(--accent)',
                      background: 'var(--accent-subtle)',
                    }}
                  >
                    {c.code}
                  </span>
                  {isLive && <span className="badge badge-live">Live Now</span>}
                </div>
                <h4 style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                  {c.title}
                </h4>
                <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 3 }}>
                  {c.lecturerName}
                </p>

                <div style={{ marginTop: 14, paddingTop: 14, borderTop: '1px solid var(--border)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: 11 }}>
                    <span style={{ color: 'var(--text-muted)' }}>Attendance Rate</span>
                    <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{rate}%</span>
                  </div>
                  <div style={{ background: 'var(--border)', borderRadius: 99, height: 3, overflow: 'hidden' }}>
                    <div
                      style={{
                        height: '100%',
                        borderRadius: 99,
                        background: rate >= 75 ? '#22c55e' : '#eab308',
                        width: `${Math.min(100, rate)}%`,
                      }}
                    />
                  </div>
                  <p style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 5 }}>
                    {attendedCount} of {courseSessions.length} sessions attended
                  </p>
                </div>

                <button
                  onClick={onOpenScanner}
                  style={{
                    marginTop: 14,
                    width: '100%',
                    padding: '7px 0',
                    borderRadius: 7,
                    border: '1px solid var(--border)',
                    background: 'transparent',
                    color: 'var(--text-secondary)',
                    fontSize: 11,
                    fontWeight: 600,
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 6,
                    transition: 'border-color 0.15s, color 0.15s',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = 'var(--accent-border)';
                    e.currentTarget.style.color = 'var(--accent)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = 'var(--border)';
                    e.currentTarget.style.color = 'var(--text-secondary)';
                  }}
                >
                  <Camera style={{ width: 12, height: 12 }} /> Scan Attendance
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Tab: Course Catalog */}
      {activeTab === 'catalog' && (
        <div className="nex-card" style={{ padding: '22px 24px' }}>
          <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 4px' }}>
            Available Courses
          </h3>
          <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 20 }}>
            Register for courses to be eligible to mark attendance in lecture sessions.
          </p>

          <div>
            {courses.map((course, i) => {
              const enrollment = myEnrollments.find((e) => e.courseId === course.id);
              const isEnrolled = enrollment?.status === 'APPROVED';
              const isPending = enrollment?.status === 'PENDING';

              return (
                <div
                  key={course.id}
                  style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 12,
                    padding: '14px 0',
                    borderTop: i > 0 ? '1px solid var(--border)' : 'none',
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
                      <span style={{ fontSize: 11, fontWeight: 800, fontFamily: 'monospace', color: 'var(--accent)' }}>
                        {course.code}
                      </span>
                      <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                        {course.units} units · {course.semester}
                      </span>
                    </div>
                    <h4 style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>
                      {course.title}
                    </h4>
                    <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                      {course.lecturerName} · {course.department}
                    </p>
                  </div>

                  {isEnrolled ? (
                    <span className="badge badge-green" style={{ fontSize: 11, padding: '5px 12px' }}>
                      <Check style={{ width: 10, height: 10 }} /> Enrolled
                    </span>
                  ) : isPending ? (
                    <span className="badge badge-yellow" style={{ fontSize: 11, padding: '5px 12px' }}>
                      <Clock style={{ width: 10, height: 10 }} /> Pending
                    </span>
                  ) : (
                    <button
                      onClick={() => handleEnroll(course.id)}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 6,
                        padding: '7px 14px',
                        borderRadius: 7,
                        border: 'none',
                        background: 'var(--accent)',
                        color: '#fff',
                        fontSize: 11,
                        fontWeight: 700,
                        cursor: 'pointer',
                        fontFamily: 'inherit',
                      }}
                    >
                      <PlusCircle style={{ width: 12, height: 12 }} /> Enroll
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Tab: History */}
      {activeTab === 'history' && (
        <div className="nex-card" style={{ padding: '22px 24px' }}>
          <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 16px' }}>
            My Verified Attendance Log
          </h3>

          {myAttendance.length === 0 ? (
            <p style={{ fontSize: 12, color: 'var(--text-muted)', textAlign: 'center', padding: '32px 0' }}>
              No recorded attendances yet. Scan a QR code to log your first session.
            </p>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <thead>
                  <tr>
                    {['Course', 'Topic', 'Date & Time', 'Method', 'Status'].map((h, i) => (
                      <th
                        key={h}
                        style={{
                          padding: '0 0 10px',
                          fontSize: 10,
                          fontWeight: 700,
                          textTransform: 'uppercase',
                          letterSpacing: '0.07em',
                          color: 'var(--text-muted)',
                          textAlign: 'left',
                          borderBottom: '1px solid var(--border)',
                        }}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {myAttendance.map((rec, i) => (
                    <tr key={rec.id} style={{ borderTop: i > 0 ? '1px solid var(--border)' : 'none' }}>
                      <td style={{ padding: '10px 0', fontFamily: 'monospace', fontWeight: 700, color: 'var(--accent)' }}>
                        {rec.courseCode}
                      </td>
                      <td style={{ padding: '10px 0', fontWeight: 500, color: 'var(--text-primary)' }}>
                        {rec.courseTitle}
                      </td>
                      <td style={{ padding: '10px 0', color: 'var(--text-muted)', fontFamily: 'monospace', fontSize: 11 }}>
                        {new Date(rec.markedAt).toLocaleDateString()} at{' '}
                        {new Date(rec.markedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td style={{ padding: '10px 0', color: 'var(--text-secondary)', fontSize: 11 }}>
                        {rec.method === 'QR_SCAN' ? 'Camera QR' : 'Session Token'}
                      </td>
                      <td style={{ padding: '10px 0' }}>
                        <span className="badge badge-green">Verified</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
