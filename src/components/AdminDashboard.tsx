'use client';

import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { exportAttendanceToCSV } from '@/lib/exportUtils';
import {
  ShieldCheck,
  Users,
  GraduationCap,
  BookOpen,
  Download,
  Search,
  CheckCircle2,
} from 'lucide-react';

export const AdminDashboard: React.FC = () => {
  const { users, courses, attendance } = useApp();
  const [filterCourse, setFilterCourse] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const lecturers = users.filter((u) => u.role === 'LECTURER');
  const students = users.filter((u) => u.role === 'STUDENT');

  const filteredAttendance = attendance.filter((rec) => {
    const matchesCourse = filterCourse === 'ALL' || rec.courseCode === filterCourse;
    const matchesSearch =
      searchQuery === '' ||
      rec.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      rec.matricNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      rec.courseCode.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCourse && matchesSearch;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Admin Welcome Banner */}
      <div className="p-6 sm:p-8 rounded-3xl nex-card flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs uppercase tracking-widest font-extrabold text-amber-500">
              Institutional Admin Console
            </span>
            <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-purple-500/10 text-purple-600 dark:text-purple-300 border border-purple-500/20">
              Federal Polytechnic, Ado-Ekiti
            </span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-gray-950 dark:text-white tracking-tight">
            System Administration & Analytics
          </h2>
          <p className="text-xs text-gray-600 dark:text-neutral-400 mt-1">
            Department of Software & Web Development • Master academic records & attendance audit logs
          </p>
        </div>

        <button
          onClick={() => exportAttendanceToCSV(filteredAttendance, 'Institutional_Attendance_Master_Log.csv')}
          disabled={filteredAttendance.length === 0}
          className="flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/30 transition-all active:scale-95"
        >
          <Download className="w-4 h-4" /> Export Master CSV Report
        </button>
      </div>

      {/* Institutional Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="p-5 rounded-2xl nex-card">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-gray-500 dark:text-neutral-400 uppercase tracking-wider">
              Registered Students
            </span>
            <GraduationCap className="w-4 h-4 text-emerald-500" />
          </div>
          <p className="text-3xl font-black text-gray-900 dark:text-white mt-2 tracking-tight">
            {students.length}
          </p>
          <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1 font-medium">
            Verified Polytechnic accounts
          </p>
        </div>

        <div className="p-5 rounded-2xl nex-card">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-gray-500 dark:text-neutral-400 uppercase tracking-wider">
              Lecturers & Faculty
            </span>
            <Users className="w-4 h-4 text-purple-500" />
          </div>
          <p className="text-3xl font-black text-gray-900 dark:text-white mt-2 tracking-tight">
            {lecturers.length}
          </p>
          <p className="text-xs text-purple-600 dark:text-purple-400 mt-1 font-medium">
            Course instructors
          </p>
        </div>

        <div className="p-5 rounded-2xl nex-card">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-gray-500 dark:text-neutral-400 uppercase tracking-wider">
              Active Courses
            </span>
            <BookOpen className="w-4 h-4 text-indigo-500" />
          </div>
          <p className="text-3xl font-black text-gray-900 dark:text-white mt-2 tracking-tight">
            {courses.length}
          </p>
          <p className="text-xs text-indigo-600 dark:text-indigo-400 mt-1 font-medium">
            1st Semester curriculum
          </p>
        </div>

        <div className="p-5 rounded-2xl nex-card">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-gray-500 dark:text-neutral-400 uppercase tracking-wider">
              Total Scans Captured
            </span>
            <CheckCircle2 className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-3xl font-black text-gray-900 dark:text-white mt-2 tracking-tight">
            {attendance.length}
          </p>
          <p className="text-xs text-amber-600 dark:text-amber-400 mt-1 font-medium">
            Zero proxy records
          </p>
        </div>
      </div>

      {/* Lecturers & Students Directory */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="p-6 rounded-3xl nex-card">
          <h3 className="font-bold text-xs text-gray-900 dark:text-white uppercase tracking-wider mb-4 flex items-center gap-2">
            <Users className="w-4 h-4 text-purple-500" />
            Lecturer Registry ({lecturers.length})
          </h3>
          <div className="divide-y divide-purple-100 dark:divide-white/[0.04] text-xs">
            {lecturers.map((lec) => {
              const lecCourses = courses.filter((c) => c.lecturerId === lec.id);
              return (
                <div key={lec.id} className="py-3 flex items-center justify-between">
                  <div>
                    <p className="font-bold text-gray-900 dark:text-white">{lec.name}</p>
                    <p className="text-[11px] text-gray-500 dark:text-neutral-400">
                      {lec.email} • {lec.department}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="font-semibold text-purple-700 dark:text-purple-300">
                      {lecCourses.length} Courses
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="p-6 rounded-3xl nex-card">
          <h3 className="font-bold text-xs text-gray-900 dark:text-white uppercase tracking-wider mb-4 flex items-center gap-2">
            <GraduationCap className="w-4 h-4 text-emerald-500" />
            Student Accounts ({students.length})
          </h3>
          <div className="divide-y divide-purple-100 dark:divide-white/[0.04] text-xs">
            {students.map((stu) => {
              const countAttended = attendance.filter((a) => a.studentId === stu.id).length;
              return (
                <div key={stu.id} className="py-3 flex items-center justify-between">
                  <div>
                    <p className="font-bold text-gray-900 dark:text-white">{stu.name}</p>
                    <p className="text-[11px] font-mono text-purple-700 dark:text-purple-300">
                      {stu.matricNumber} • {stu.department}
                    </p>
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    {countAttended} Scans Logged
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Master Attendance Logs */}
      <div className="p-6 rounded-3xl nex-card">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h3 className="font-bold text-base text-gray-900 dark:text-white">
              Institutional Attendance Audit Log
            </h3>
            <p className="text-xs text-gray-500 dark:text-neutral-400">
              Showing {filteredAttendance.length} attendance records
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search name, matric..."
                className="pl-8 pr-3 py-1.5 rounded-full text-xs bg-white dark:bg-white/[0.04] border border-purple-200 dark:border-white/10 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>

            <select
              value={filterCourse}
              onChange={(e) => setFilterCourse(e.target.value)}
              className="px-3 py-1.5 rounded-full text-xs bg-white dark:bg-white/[0.04] border border-purple-200 dark:border-white/10 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="ALL">All Courses</option>
              {courses.map((c) => (
                <option key={c.id} value={c.code}>
                  {c.code}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-purple-100 dark:border-white/[0.06] text-gray-400 dark:text-neutral-500 font-semibold uppercase text-[10px]">
                <th className="pb-2">Matric No</th>
                <th className="pb-2">Student Name</th>
                <th className="pb-2">Course</th>
                <th className="pb-2">Date & Time</th>
                <th className="pb-2">Method</th>
                <th className="pb-2 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-purple-100 dark:divide-white/[0.04]">
              {filteredAttendance.map((rec) => (
                <tr key={rec.id} className="hover:bg-purple-50/50 dark:hover:bg-white/[0.02]">
                  <td className="py-3 font-mono text-purple-700 dark:text-purple-300 font-bold">
                    {rec.matricNumber}
                  </td>
                  <td className="py-3 font-semibold text-gray-900 dark:text-white">
                    {rec.studentName}
                  </td>
                  <td className="py-3 font-mono text-gray-700 dark:text-neutral-300">
                    {rec.courseCode}
                  </td>
                  <td className="py-3 text-gray-500 dark:text-neutral-400 font-mono">
                    {new Date(rec.markedAt).toLocaleDateString()} at{' '}
                    {new Date(rec.markedAt).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                      second: '2-digit',
                    })}
                  </td>
                  <td className="py-3">
                    <span className="text-[11px] text-gray-600 dark:text-neutral-300">
                      {rec.method === 'QR_SCAN' ? 'Camera QR' : 'Session Token'}
                    </span>
                  </td>
                  <td className="py-3 text-right">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      {rec.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
