'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  User,
  Course,
  Enrollment,
  Session,
  AttendanceRecord,
  ScanResult,
} from '@/lib/types';
import {
  INITIAL_USERS,
  INITIAL_COURSES,
  INITIAL_ENROLLMENTS,
  INITIAL_SESSIONS,
  INITIAL_ATTENDANCE,
} from '@/lib/mockData';

interface AppContextType {
  theme: 'dark';
  toggleTheme: () => void;
  currentUser: User | null;
  setCurrentUser: (user: User | null) => void;
  users: User[];
  courses: Course[];
  enrollments: Enrollment[];
  sessions: Session[];
  attendance: AttendanceRecord[];
  
  // Actions
  createCourse: (data: {
    code: string;
    title: string;
    department: string;
    semester: string;
    units: number;
    requiresApproval: boolean;
  }) => Course;
  
  enrollCourse: (courseId: string, studentId?: string) => { success: boolean; message: string };
  updateEnrollmentStatus: (enrollmentId: string, status: 'APPROVED' | 'REJECTED') => void;
  
  startSession: (courseId: string, topic: string, durationMinutes: number) => Session;
  endSession: (sessionId: string) => void;
  extendSession: (sessionId: string, additionalMinutes: number) => void;
  
  markAttendance: (
    input: string | { sessionId?: string; token?: string; courseId?: string },
    method?: 'QR_SCAN' | 'SESSION_CODE'
  ) => ScanResult;

  resetToDefaultData: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const STORAGE_KEYS = {
  THEME: 'qatt_theme_v1',
  USER: 'qatt_user_v1',
  USERS: 'qatt_users_v1',
  COURSES: 'qatt_courses_v1',
  ENROLLMENTS: 'qatt_enrollments_v1',
  SESSIONS: 'qatt_sessions_v1',
  ATTENDANCE: 'qatt_attendance_v1',
};

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const theme = 'dark' as const;
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>(INITIAL_USERS);
  const [courses, setCourses] = useState<Course[]>(INITIAL_COURSES);
  const [enrollments, setEnrollments] = useState<Enrollment[]>(INITIAL_ENROLLMENTS);
  const [sessions, setSessions] = useState<Session[]>(INITIAL_SESSIONS);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>(INITIAL_ATTENDANCE);
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize from LocalStorage
  useEffect(() => {
    try {
      // Always dark mode — ensure class is set
      document.documentElement.classList.add('dark');

      const savedUser = localStorage.getItem(STORAGE_KEYS.USER);
      if (savedUser) {
        setCurrentUser(JSON.parse(savedUser));
      }

      const savedUsers = localStorage.getItem(STORAGE_KEYS.USERS);
      if (savedUsers) setUsers(JSON.parse(savedUsers));

      const savedCourses = localStorage.getItem(STORAGE_KEYS.COURSES);
      if (savedCourses) setCourses(JSON.parse(savedCourses));

      const savedEnrollments = localStorage.getItem(STORAGE_KEYS.ENROLLMENTS);
      if (savedEnrollments) setEnrollments(JSON.parse(savedEnrollments));

      const savedSessions = localStorage.getItem(STORAGE_KEYS.SESSIONS);
      if (savedSessions) setSessions(JSON.parse(savedSessions));

      const savedAttendance = localStorage.getItem(STORAGE_KEYS.ATTENDANCE);
      if (savedAttendance) setAttendance(JSON.parse(savedAttendance));
    } catch (e) {
      console.warn('LocalStorage initialization notice:', e);
    } finally {
      setIsInitialized(true);
    }
  }, []);

  // Always dark — force class once on mount
  useEffect(() => {
    document.documentElement.classList.add('dark');
  }, []);

  // Persist state changes
  useEffect(() => {
    if (!isInitialized) return;
    try {
      localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(currentUser));
      localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
      localStorage.setItem(STORAGE_KEYS.COURSES, JSON.stringify(courses));
      localStorage.setItem(STORAGE_KEYS.ENROLLMENTS, JSON.stringify(enrollments));
      localStorage.setItem(STORAGE_KEYS.SESSIONS, JSON.stringify(sessions));
      localStorage.setItem(STORAGE_KEYS.ATTENDANCE, JSON.stringify(attendance));
    } catch (e) {
      console.error('Failed to sync to LocalStorage', e);
    }
  }, [currentUser, users, courses, enrollments, sessions, attendance, isInitialized]);

  // No-op — dark mode is permanent
  const toggleTheme = () => {};

  const handleSetCurrentUser = (user: User | null) => {
    setCurrentUser(user);
    if (!user) {
      localStorage.removeItem(STORAGE_KEYS.USER);
    }
  };

  const createCourse = (data: {
    code: string;
    title: string;
    department: string;
    semester: string;
    units: number;
    requiresApproval: boolean;
  }): Course => {
    const lecturer = currentUser?.role === 'LECTURER' ? currentUser : users.find((u) => u.role === 'LECTURER')!;
    const newCourse: Course = {
      id: `course-${Date.now()}`,
      code: data.code.toUpperCase().trim(),
      title: data.title.trim(),
      lecturerId: lecturer.id,
      lecturerName: lecturer.name,
      department: data.department || lecturer.department,
      semester: data.semester,
      units: data.units || 3,
      requiresApproval: data.requiresApproval,
      createdAt: new Date().toISOString(),
    };

    setCourses((prev) => [newCourse, ...prev]);
    return newCourse;
  };

  const enrollCourse = (courseId: string, studentId?: string) => {
    const student = studentId
      ? users.find((u) => u.id === studentId)
      : currentUser?.role === 'STUDENT'
      ? currentUser
      : users.find((u) => u.role === 'STUDENT');

    if (!student) {
      return { success: false, message: 'Student account not identified.' };
    }

    const course = courses.find((c) => c.id === courseId);
    if (!course) {
      return { success: false, message: 'Course not found.' };
    }

    const existing = enrollments.find(
      (e) => e.courseId === courseId && e.studentId === student.id
    );

    if (existing) {
      if (existing.status === 'APPROVED') {
        return { success: false, message: 'You are already enrolled in this course.' };
      }
      if (existing.status === 'PENDING') {
        return { success: false, message: 'Your enrollment is currently pending approval.' };
      }
    }

    const newEnrollment: Enrollment = {
      id: `enr-${Date.now()}`,
      courseId,
      studentId: student.id,
      studentName: student.name,
      matricNumber: student.matricNumber || 'FPA/CS/24/00-0000',
      status: course.requiresApproval ? 'PENDING' : 'APPROVED',
      enrolledAt: new Date().toISOString(),
    };

    setEnrollments((prev) => [...prev, newEnrollment]);

    return {
      success: true,
      message: course.requiresApproval
        ? `Enrollment submitted for ${course.code}! Awaiting lecturer approval.`
        : `Successfully enrolled in ${course.code}!`,
    };
  };

  const updateEnrollmentStatus = (enrollmentId: string, status: 'APPROVED' | 'REJECTED') => {
    setEnrollments((prev) =>
      prev.map((e) => (e.id === enrollmentId ? { ...e, status } : e))
    );
  };

  const startSession = (courseId: string, topic: string, durationMinutes: number): Session => {
    const course = courses.find((c) => c.id === courseId);
    if (!course) throw new Error('Course not found');

    const lecturer = currentUser?.role === 'LECTURER' ? currentUser : users.find((u) => u.id === course.lecturerId) || {
      id: course.lecturerId,
      name: course.lecturerName,
    };

    const sessionId = `sess-${Date.now()}`;
    const token = `${course.code.replace(/\s+/g, '')}-${Math.floor(100 + Math.random() * 900)}`;
    const expiresAt = new Date(Date.now() + durationMinutes * 60 * 1000).toISOString();

    const qrPayload = JSON.stringify({
      sessionId,
      courseId: course.id,
      token,
      v: 1,
    });

    const newSession: Session = {
      id: sessionId,
      courseId: course.id,
      courseCode: course.code,
      courseTitle: course.title,
      lecturerId: lecturer.id,
      lecturerName: lecturer.name,
      topic: topic.trim() || `Lecture Session - ${course.code}`,
      token,
      qrPayload,
      createdAt: new Date().toISOString(),
      expiresAt,
      durationMinutes,
      isActive: true,
    };

    // Close any previous active session for this course to prevent conflicts
    setSessions((prev) => [
      newSession,
      ...prev.map((s) => (s.courseId === courseId ? { ...s, isActive: false } : s)),
    ]);

    return newSession;
  };

  const endSession = (sessionId: string) => {
    setSessions((prev) =>
      prev.map((s) => (s.id === sessionId ? { ...s, isActive: false } : s))
    );
  };

  const extendSession = (sessionId: string, additionalMinutes: number) => {
    setSessions((prev) =>
      prev.map((s) => {
        if (s.id === sessionId) {
          const currentExpiry = new Date(s.expiresAt).getTime();
          const newExpiry = new Date(Math.max(Date.now(), currentExpiry) + additionalMinutes * 60 * 1000).toISOString();
          return { ...s, expiresAt: newExpiry, isActive: true };
        }
        return s;
      })
    );
  };

  const markAttendance = (
    input: string | { sessionId?: string; token?: string; courseId?: string },
    method: 'QR_SCAN' | 'SESSION_CODE' = 'QR_SCAN'
  ): ScanResult => {
    const student = currentUser?.role === 'STUDENT'
      ? currentUser
      : users.find((u) => u.id === 'stu-1'); // Default demo student: Sanya Ololade Timileyin

    if (!student) {
      return { success: false, message: 'You must be signed in as a student to mark attendance.' };
    }

    let parsedSessionId: string | undefined;
    let parsedToken: string | undefined;

    if (typeof input === 'string') {
      try {
        const parsed = JSON.parse(input);
        parsedSessionId = parsed.sessionId;
        parsedToken = parsed.token;
      } catch {
        // Plain text token entered
        parsedToken = input.trim();
      }
    } else {
      parsedSessionId = input.sessionId;
      parsedToken = input.token;
    }

    // Find the session
    const session = sessions.find((s) => {
      if (parsedSessionId && s.id === parsedSessionId) return true;
      if (parsedToken && s.token.toUpperCase() === parsedToken.toUpperCase()) return true;
      return false;
    });

    if (!session) {
      return {
        success: false,
        message: 'Invalid session or QR code. Please verify the code on the screen.',
      };
    }

    // Check if session has expired
    const isExpired = new Date(session.expiresAt).getTime() < Date.now();
    if (!session.isActive || isExpired) {
      return {
        success: false,
        message: `This lecture session (${session.courseCode}) has expired or is no longer active.`,
      };
    }

    // PRD REQUIREMENT: Check if student is enrolled in this course
    const enrollment = enrollments.find(
      (e) => e.courseId === session.courseId && e.studentId === student.id
    );

    if (!enrollment) {
      return {
        success: false,
        message: `Attendance rejected: You are NOT enrolled in ${session.courseCode}. Per school policy, you must first register for this course.`,
      };
    }

    if (enrollment.status === 'PENDING') {
      return {
        success: false,
        message: `Attendance rejected: Your enrollment for ${session.courseCode} is currently pending lecturer approval.`,
      };
    }

    if (enrollment.status === 'REJECTED') {
      return {
        success: false,
        message: `Attendance rejected: Your enrollment in ${session.courseCode} was rejected by the course lecturer.`,
      };
    }

    // PRD REQUIREMENT: Check if attendance already recorded (No duplicate attendance)
    const alreadyMarked = attendance.find(
      (a) => a.sessionId === session.id && a.studentId === student.id
    );

    if (alreadyMarked) {
      return {
        success: false,
        message: `Duplicate scan detected! You already recorded attendance for this session at ${new Date(
          alreadyMarked.markedAt
        ).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}.`,
      };
    }

    // Create verified attendance record
    const newRecord: AttendanceRecord = {
      id: `att-${Date.now()}`,
      sessionId: session.id,
      courseId: session.courseId,
      courseCode: session.courseCode,
      courseTitle: session.courseTitle,
      studentId: student.id,
      studentName: student.name,
      matricNumber: student.matricNumber || 'FPA/CS/24/03-0108',
      markedAt: new Date().toISOString(),
      method,
      status: 'PRESENT',
      deviceInfo: typeof navigator !== 'undefined' ? `${navigator.userAgent.slice(0, 30)}...` : 'Browser',
    };

    setAttendance((prev) => [newRecord, ...prev]);

    return {
      success: true,
      message: `Verified! Attendance recorded for ${session.courseCode} (${session.topic}).`,
      record: newRecord,
    };
  };

  const resetToDefaultData = () => {
    setUsers(INITIAL_USERS);
    setCourses(INITIAL_COURSES);
    setEnrollments(INITIAL_ENROLLMENTS);
    setSessions(INITIAL_SESSIONS);
    setAttendance(INITIAL_ATTENDANCE);
    try {
      localStorage.clear();
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <AppContext.Provider
      value={{
        theme,
        toggleTheme,
        currentUser,
        setCurrentUser: handleSetCurrentUser,
        users,
        courses,
        enrollments,
        sessions,
        attendance,
        createCourse,
        enrollCourse,
        updateEnrollmentStatus,
        startSession,
        endSession,
        extendSession,
        markAttendance,
        resetToDefaultData,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
