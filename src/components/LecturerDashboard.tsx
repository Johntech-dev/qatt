'use client';

import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { Course, Session } from '@/lib/types';
import { exportAttendanceToCSV } from '@/lib/exportUtils';
import {
  QrCode,
  Plus,
  Users,
  Clock,
  BookOpen,
  Calendar,
  Download,
  Play,
  Check,
  XCircle,
  Sparkles,
  ArrowRight,
  TrendingUp,
} from 'lucide-react';

interface LecturerDashboardProps {
  onOpenProjector: (session: Session) => void;
}

export const LecturerDashboard: React.FC<LecturerDashboardProps> = ({ onOpenProjector }) => {
  const {
    currentUser,
    courses,
    enrollments,
    sessions,
    attendance,
    createCourse,
    updateEnrollmentStatus,
    startSession,
  } = useApp();

  const [selectedCourseId, setSelectedCourseId] = useState<string>(
    courses[0]?.id || ''
  );
  const [showCreateCourseModal, setShowCreateCourseModal] = useState(false);
  const [showNewSessionModal, setShowNewSessionModal] = useState(false);

  const [newCode, setNewCode] = useState('');
  const [newTitle, setNewTitle] = useState('');
  const [newSemester, setNewSemester] = useState('1st Semester 2025/2026');
  const [newUnits, setNewUnits] = useState(3);
  const [newRequiresApproval, setNewRequiresApproval] = useState(false);

  const [sessionTopic, setSessionTopic] = useState('');
  const [sessionDuration, setSessionDuration] = useState(15);

  const myCourses = courses.filter((c) =>
    currentUser?.role === 'ADMIN' ? true : c.lecturerId === currentUser?.id || c.lecturerName === currentUser?.name
  );

  const activeCourse = courses.find((c) => c.id === selectedCourseId) || myCourses[0] || courses[0];

  const courseEnrollments = enrollments.filter(
    (e) => e.courseId === activeCourse?.id
  );

  const courseSessions = sessions.filter(
    (s) => s.courseId === activeCourse?.id
  );

  const courseAttendance = attendance.filter(
    (a) => a.courseId === activeCourse?.id
  );

  const handleCreateCourseSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCode || !newTitle) return;

    const created = createCourse({
      code: newCode,
      title: newTitle,
      department: currentUser?.department || 'Software & Web Development',
      semester: newSemester,
      units: Number(newUnits),
      requiresApproval: newRequiresApproval,
    });

    setSelectedCourseId(created.id);
    setNewCode('');
    setNewTitle('');
    setShowCreateCourseModal(false);
  };

  const handleStartSessionSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeCourse) return;

    const session = startSession(
      activeCourse.id,
      sessionTopic || `Lecture Session - ${activeCourse.code}`,
      Number(sessionDuration)
    );

    setShowNewSessionModal(false);
    setSessionTopic('');
    onOpenProjector(session);
  };

  const liveSession = sessions.find(
    (s) => s.courseId === activeCourse?.id && s.isActive && new Date(s.expiresAt) > new Date()
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Banner (Nexora Dark Header) */}
      <div className="p-6 sm:p-8 rounded-3xl nex-card flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs uppercase tracking-widest font-extrabold text-purple-600 dark:text-purple-400">
              Lecturer Control Center
            </span>
            <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-purple-500/10 text-purple-600 dark:text-purple-300 border border-purple-500/20 font-medium">
              Federal Polytechnic, Ado-Ekiti
            </span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-gray-950 dark:text-white tracking-tight">
            Welcome, {currentUser?.name || 'Mrs. Abiodun'}
          </h2>
          <p className="text-xs text-gray-600 dark:text-neutral-400 mt-1">
            Department of {currentUser?.department || 'Software & Web Development'} • Supervise attendance sessions & verify roster
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => setShowCreateCourseModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-full text-xs font-bold bg-white dark:bg-white/[0.04] hover:bg-purple-50 dark:hover:bg-white/[0.08] text-gray-900 dark:text-white border border-purple-200 dark:border-white/10 transition-all shadow-sm"
          >
            <Plus className="w-4 h-4 text-purple-500" />
            Add New Course
          </button>

          {liveSession ? (
            <button
              onClick={() => onOpenProjector(liveSession)}
              className="flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/30 transition-all active:scale-95 animate-pulse"
            >
              <QrCode className="w-4 h-4" />
              Open Live QR Screen ({liveSession.courseCode})
            </button>
          ) : (
            <button
              onClick={() => setShowNewSessionModal(true)}
              className="flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-bold bg-purple-600 hover:bg-purple-500 text-white shadow-lg shadow-purple-600/35 transition-all active:scale-95"
            >
              <Play className="w-4 h-4" />
              Start Attendance Session
            </button>
          )}
        </div>
      </div>

      {/* Main Course Selector & Overview Tabs */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Course List */}
        <div className="lg:col-span-4 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-extrabold text-xs uppercase tracking-wider text-gray-900 dark:text-neutral-300 flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-purple-500" />
              My Courses ({myCourses.length})
            </h3>
          </div>

          <div className="space-y-3">
            {myCourses.map((c) => {
              const countEnrolled = enrollments.filter(
                (e) => e.courseId === c.id && e.status === 'APPROVED'
              ).length;
              const hasActiveSession = sessions.some(
                (s) => s.courseId === c.id && s.isActive && new Date(s.expiresAt) > new Date()
              );
              const isSelected = activeCourse?.id === c.id;

              return (
                <div
                  key={c.id}
                  onClick={() => setSelectedCourseId(c.id)}
                  className={`p-4 rounded-2xl cursor-pointer transition-all border ${isSelected
                      ? 'bg-purple-500/10 dark:bg-white/[0.06] border-purple-500 dark:border-purple-500/70 shadow-md shadow-purple-600/10'
                      : 'bg-white dark:bg-white/[0.02] border-purple-100 dark:border-white/[0.06] hover:border-purple-300 dark:hover:border-white/10'
                    }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-xs text-purple-700 dark:text-purple-300">
                      {c.code}
                    </span>
                    {hasActiveSession && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 animate-pulse">
                        LIVE
                      </span>
                    )}
                  </div>
                  <h4 className="font-bold text-xs sm:text-sm text-gray-900 dark:text-white mt-1 line-clamp-1">
                    {c.title}
                  </h4>
                  <div className="mt-3 flex items-center justify-between text-[11px] text-gray-500 dark:text-neutral-400">
                    <span>{countEnrolled} Students Enrolled</span>
                    <span>{c.units} Units</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Selected Course Workspace */}
        {activeCourse && (
          <div className="lg:col-span-8 space-y-6">
            {/* Course Summary Card */}
            <div className="p-6 rounded-3xl nex-card">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-purple-100 dark:border-white/[0.06] pb-5">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-lg bg-purple-100 dark:bg-white/[0.05] text-purple-700 dark:text-purple-300 border border-purple-300 dark:border-white/10">
                      {activeCourse.code}
                    </span>
                    <span className="text-xs text-gray-500 dark:text-neutral-400">
                      {activeCourse.units} Credit Units • {activeCourse.semester}
                    </span>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mt-2">
                    {activeCourse.title}
                  </h3>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowNewSessionModal(true)}
                    className="flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold bg-purple-600 hover:bg-purple-500 text-white shadow-md transition-all active:scale-95"
                  >
                    <QrCode className="w-4 h-4" /> Start QR Session
                  </button>
                  <button
                    onClick={() =>
                      exportAttendanceToCSV(
                        courseAttendance,
                        `${activeCourse.code}_Full_Attendance_Report.csv`
                      )
                    }
                    className="flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white shadow-md transition-all active:scale-95"
                  >
                    <Download className="w-4 h-4" /> Export CSV
                  </button>
                </div>
              </div>

              {/* Stats Bar */}
              <div className="grid grid-cols-3 gap-4 pt-5">
                <div>
                  <p className="text-[10px] uppercase font-bold text-gray-500 dark:text-neutral-400">
                    Enrolled Students
                  </p>
                  <p className="text-xl font-black text-gray-900 dark:text-white mt-0.5">
                    {courseEnrollments.filter((e) => e.status === 'APPROVED').length}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] uppercase font-bold text-gray-500 dark:text-neutral-400">
                    Sessions Held
                  </p>
                  <p className="text-xl font-black text-gray-900 dark:text-white mt-0.5">
                    {courseSessions.length}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] uppercase font-bold text-gray-500 dark:text-neutral-400">
                    Total Scans
                  </p>
                  <p className="text-xl font-black text-gray-900 dark:text-white mt-0.5">
                    {courseAttendance.length}
                  </p>
                </div>
              </div>
            </div>

            {/* Student Enrollment Roster & Approvals */}
            <div className="p-6 rounded-3xl nex-card">
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-bold text-xs uppercase tracking-wider text-gray-900 dark:text-white flex items-center gap-2">
                  <Users className="w-4 h-4 text-purple-500" />
                  Course Roster & Registrations ({courseEnrollments.length})
                </h4>
                <span className="text-[11px] text-gray-500 dark:text-neutral-400">
                  {activeCourse.requiresApproval ? 'Manual Approval Enabled' : 'Auto-Enrollment Active'}
                </span>
              </div>

              {courseEnrollments.length === 0 ? (
                <p className="text-xs text-gray-400 dark:text-neutral-500 py-6 text-center">
                  No students enrolled in this course yet.
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-purple-100 dark:border-white/[0.06] text-gray-400 dark:text-neutral-500 font-semibold uppercase text-[10px]">
                        <th className="pb-2">Student Name</th>
                        <th className="pb-2">Matric Number</th>
                        <th className="pb-2">Status</th>
                        <th className="pb-2">Enrolled Date</th>
                        <th className="pb-2 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-purple-100 dark:divide-white/[0.04]">
                      {courseEnrollments.map((enr) => (
                        <tr key={enr.id} className="hover:bg-purple-50/50 dark:hover:bg-white/[0.02]">
                          <td className="py-3 font-semibold text-gray-900 dark:text-white">
                            {enr.studentName}
                          </td>
                          <td className="py-3 font-mono text-purple-700 dark:text-purple-300">
                            {enr.matricNumber}
                          </td>
                          <td className="py-3">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${enr.status === 'APPROVED'
                                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                  : enr.status === 'PENDING'
                                    ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                                    : 'bg-red-500/10 text-red-400 border border-red-500/20'
                                }`}
                            >
                              {enr.status}
                            </span>
                          </td>
                          <td className="py-3 text-gray-500 dark:text-neutral-400">
                            {new Date(enr.enrolledAt).toLocaleDateString()}
                          </td>
                          <td className="py-3 text-right">
                            {enr.status === 'PENDING' ? (
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  onClick={() => updateEnrollmentStatus(enr.id, 'APPROVED')}
                                  className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 transition-colors"
                                  title="Approve Student"
                                >
                                  <Check className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => updateEnrollmentStatus(enr.id, 'REJECTED')}
                                  className="p-1.5 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors"
                                  title="Reject Student"
                                >
                                  <XCircle className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            ) : enr.status === 'APPROVED' ? (
                              <button
                                onClick={() => updateEnrollmentStatus(enr.id, 'REJECTED')}
                                className="text-[10px] text-red-400 hover:underline"
                              >
                                Revoke
                              </button>
                            ) : (
                              <button
                                onClick={() => updateEnrollmentStatus(enr.id, 'APPROVED')}
                                className="text-[10px] text-emerald-400 hover:underline"
                              >
                                Re-approve
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Past Lecture Sessions & Reports */}
            <div className="p-6 rounded-3xl nex-card">
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-bold text-xs uppercase tracking-wider text-gray-900 dark:text-white flex items-center gap-2">
                  <Clock className="w-4 h-4 text-purple-500" />
                  Lecture Attendance Sessions ({courseSessions.length})
                </h4>
              </div>

              {courseSessions.length === 0 ? (
                <p className="text-xs text-gray-400 dark:text-neutral-500 py-6 text-center">
                  No sessions conducted yet for this course. Click &quot;Start QR Session&quot; to begin.
                </p>
              ) : (
                <div className="space-y-3">
                  {courseSessions.map((sess) => {
                    const attendees = attendance.filter((a) => a.sessionId === sess.id);
                    const isSessionLive = sess.isActive && new Date(sess.expiresAt) > new Date();

                    return (
                      <div
                        key={sess.id}
                        className="p-4 rounded-2xl bg-purple-50/50 dark:bg-white/[0.02] border border-purple-100 dark:border-white/[0.05] flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-xs sm:text-sm text-gray-900 dark:text-white">
                              {sess.topic}
                            </span>
                            {isSessionLive ? (
                              <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 animate-pulse">
                                Active Now
                              </span>
                            ) : (
                              <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-gray-500/20 text-gray-400">
                                Ended
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-gray-500 dark:text-neutral-400 mt-1">
                            {new Date(sess.createdAt).toLocaleDateString()} at{' '}
                            {new Date(sess.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}{' '}
                            • Token: <span className="font-mono font-bold text-purple-600 dark:text-purple-300">{sess.token}</span>
                          </p>
                        </div>

                        <div className="flex items-center gap-3">
                          <span className="text-xs font-semibold text-gray-700 dark:text-neutral-200">
                            {attendees.length} Present
                          </span>
                          <button
                            onClick={() => onOpenProjector(sess)}
                            className="px-3 py-1.5 rounded-full text-xs font-semibold bg-purple-600 hover:bg-purple-500 text-white shadow-sm flex items-center gap-1.5"
                          >
                            <QrCode className="w-3.5 h-3.5" /> Projector View
                          </button>
                          <button
                            onClick={() =>
                              exportAttendanceToCSV(
                                attendees,
                                `${sess.courseCode}_${sess.token}_Attendance.csv`,
                                sess
                              )
                            }
                            disabled={attendees.length === 0}
                            className="p-1.5 rounded-full text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10 disabled:opacity-30"
                            title="Export Session CSV"
                          >
                            <Download className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Create Course Modal */}
      {showCreateCourseModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-xl">
          <div className="w-full max-w-md bg-white dark:bg-[#0a0314] border border-purple-200 dark:border-white/10 rounded-3xl p-6 shadow-2xl">
            <h3 className="font-bold text-lg text-gray-900 dark:text-white mb-4">
              Add New Polytechnic Course
            </h3>
            <form onSubmit={handleCreateCourseSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-neutral-300 mb-1">
                  Course Code
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. CSC 301"
                  value={newCode}
                  onChange={(e) => setNewCode(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl text-xs font-mono uppercase bg-white dark:bg-white/[0.04] border border-purple-200 dark:border-white/10 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-neutral-300 mb-1">
                  Course Title
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Web Development & Cloud Systems"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl text-xs bg-white dark:bg-white/[0.04] border border-purple-200 dark:border-white/10 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-neutral-300 mb-1">
                    Credit Units
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={6}
                    value={newUnits}
                    onChange={(e) => setNewUnits(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 rounded-xl text-xs bg-white dark:bg-white/[0.04] border border-purple-200 dark:border-white/10 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-neutral-300 mb-1">
                    Semester
                  </label>
                  <select
                    value={newSemester}
                    onChange={(e) => setNewSemester(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl text-xs bg-white dark:bg-white/[0.04] border border-purple-200 dark:border-white/10 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="1st Semester 2025/2026">1st Semester 2025/2026</option>
                    <option value="2nd Semester 2025/2026">2nd Semester 2025/2026</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="requiresApproval"
                  checked={newRequiresApproval}
                  onChange={(e) => setNewRequiresApproval(e.target.checked)}
                  className="rounded border-purple-300 text-purple-600 focus:ring-purple-500"
                />
                <label htmlFor="requiresApproval" className="text-xs text-gray-700 dark:text-neutral-300">
                  Require lecturer approval before student can mark attendance
                </label>
              </div>

              <div className="pt-3 flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowCreateCourseModal(false)}
                  className="flex-1 py-2.5 rounded-xl text-xs font-semibold border border-purple-200 dark:border-white/10 text-gray-700 dark:text-neutral-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl text-xs font-bold bg-purple-600 hover:bg-purple-500 text-white shadow-lg"
                >
                  Create Course
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Start Attendance Session Modal */}
      {showNewSessionModal && activeCourse && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-xl">
          <div className="w-full max-w-md bg-white dark:bg-[#0a0314] border border-purple-200 dark:border-white/10 rounded-3xl p-6 shadow-2xl">
            <h3 className="font-bold text-lg text-gray-900 dark:text-white mb-2">
              Launch Attendance Session
            </h3>
            <p className="text-xs text-gray-500 dark:text-neutral-400 mb-4">
              Creating a dynamic time-bound QR code for <strong className="text-purple-600 dark:text-purple-400">{activeCourse.code}</strong>
            </p>

            <form onSubmit={handleStartSessionSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-neutral-300 mb-1">
                  Lecture Topic / Module
                </label>
                <input
                  type="text"
                  placeholder="e.g. Next.js Routing & API Integration"
                  value={sessionTopic}
                  onChange={(e) => setSessionTopic(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl text-xs bg-white dark:bg-white/[0.04] border border-purple-200 dark:border-white/10 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-neutral-300 mb-1">
                  QR Expiry Window (Minutes)
                </label>
                <select
                  value={sessionDuration}
                  onChange={(e) => setSessionDuration(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 rounded-xl text-xs bg-white dark:bg-white/[0.04] border border-purple-200 dark:border-white/10 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value={5}>5 Minutes (Quick Rollcall)</option>
                  <option value={10}>10 Minutes (Standard Class)</option>
                  <option value={15}>15 Minutes</option>
                  <option value={30}>30 Minutes</option>
                  <option value={60}>60 Minutes (Full Lecture Period)</option>
                </select>
                <p className="text-[11px] text-gray-500 dark:text-neutral-400 mt-1">
                  After this time, the QR code automatically closes to prevent proxy sharing.
                </p>
              </div>

              <div className="pt-3 flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowNewSessionModal(false)}
                  className="flex-1 py-2.5 rounded-xl text-xs font-semibold border border-purple-200 dark:border-white/10 text-gray-700 dark:text-neutral-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl text-xs font-bold bg-purple-600 hover:bg-purple-500 text-white shadow-lg flex items-center justify-center gap-1.5"
                >
                  <QrCode className="w-4 h-4" /> Generate QR Code
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
