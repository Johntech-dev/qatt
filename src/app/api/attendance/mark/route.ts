import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import { prisma } from '@/lib/db';

// POST /api/attendance/mark — student marks attendance via QR scan or session token
export async function POST(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'STUDENT') {
      return NextResponse.json({ error: 'Only students can mark attendance.' }, { status: 403 });
    }

    const { qrPayload, token, method } = await req.json();

    let session;

    if (qrPayload) {
      // Parse QR code JSON payload
      try {
        const parsed = JSON.parse(qrPayload);
        session = await prisma.session.findUnique({
          where: { token: parsed.token },
          include: { course: true },
        });
      } catch {
        return NextResponse.json({ error: 'Invalid QR code.' }, { status: 400 });
      }
    } else if (token) {
      session = await prisma.session.findUnique({
        where: { token: token.toUpperCase() },
        include: { course: true },
      });
    }

    if (!session) {
      return NextResponse.json({ error: 'Session not found. Check the QR code or token.' }, { status: 404 });
    }

    if (!session.isActive) {
      return NextResponse.json({ error: 'This session has already been closed.' }, { status: 400 });
    }

    if (new Date(session.expiresAt) < new Date()) {
      // Auto-close expired session
      await prisma.session.update({ where: { id: session.id }, data: { isActive: false } });
      return NextResponse.json({ error: 'QR code has expired. Ask your lecturer to start a new session.' }, { status: 400 });
    }

    // Verify student is enrolled and approved in this course
    const enrollment = await prisma.enrollment.findUnique({
      where: {
        studentId_courseId: { studentId: user.userId, courseId: session.courseId },
      },
    });

    if (!enrollment) {
      return NextResponse.json(
        { error: 'You are not enrolled in this course. Please register first.' },
        { status: 403 }
      );
    }

    if (enrollment.status !== 'APPROVED') {
      return NextResponse.json(
        { error: 'Your enrollment is pending lecturer approval.' },
        { status: 403 }
      );
    }

    // Check for duplicate attendance
    const existing = await prisma.attendanceRecord.findUnique({
      where: { studentId_sessionId: { studentId: user.userId, sessionId: session.id } },
    });

    if (existing) {
      return NextResponse.json(
        { error: 'Attendance already recorded for this session.', alreadyMarked: true },
        { status: 200 }
      );
    }

    const record = await prisma.attendanceRecord.create({
      data: {
        studentId: user.userId,
        sessionId: session.id,
        courseId: session.courseId,
        method: method === 'SESSION_CODE' ? 'SESSION_CODE' : 'QR_SCAN',
      },
      include: {
        student: { select: { name: true, matricNumber: true } },
        session: { include: { course: { select: { code: true, title: true } } } },
      },
    });

    return NextResponse.json({
      success: true,
      message: `Attendance marked! Welcome to ${session.course.code} - ${session.course.title}.`,
      record: {
        id: record.id,
        courseCode: record.session.course.code,
        courseTitle: record.session.course.title,
        studentName: record.student.name,
        matricNumber: record.student.matricNumber,
        markedAt: record.markedAt.toISOString(),
        method: record.method,
      },
    });
  } catch (err) {
    console.error('[POST /api/attendance/mark]', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

// GET /api/attendance/mark — get attendance records
export async function GET(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const courseId = searchParams.get('courseId');
    const sessionId = searchParams.get('sessionId');

    const where: Record<string, unknown> = {};

    if (user.role === 'STUDENT') {
      where.studentId = user.userId;
    } else if (user.role === 'LECTURER') {
      // Only their course sessions
      const myCourses = await prisma.course.findMany({
        where: { lecturerId: user.userId },
        select: { id: true },
      });
      where.courseId = { in: myCourses.map((c) => c.id) };
    }

    if (courseId) where.courseId = courseId;
    if (sessionId) where.sessionId = sessionId;

    const records = await prisma.attendanceRecord.findMany({
      where,
      include: {
        student: { select: { id: true, name: true, matricNumber: true, level: true } },
        session: {
          select: {
            id: true,
            topic: true,
            token: true,
            createdAt: true,
            course: { select: { code: true, title: true } },
          },
        },
      },
      orderBy: { markedAt: 'desc' },
    });

    return NextResponse.json({ records });
  } catch (err) {
    console.error('[GET /api/attendance/mark]', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
