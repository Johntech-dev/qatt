import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import { prisma } from '@/lib/db';
import crypto from 'crypto';

function generateToken(): string {
  return crypto.randomBytes(4).toString('hex').toUpperCase();
}

// POST /api/sessions — start a new attendance session (lecturer only)
export async function POST(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'LECTURER' && user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Only lecturers can start sessions.' }, { status: 403 });
    }

    const { courseId, topic, durationMinutes } = await req.json();
    if (!courseId || !topic) {
      return NextResponse.json({ error: 'courseId and topic required.' }, { status: 400 });
    }

    const course = await prisma.course.findUnique({ where: { id: courseId } });
    if (!course) return NextResponse.json({ error: 'Course not found.' }, { status: 404 });

    // Close any existing active sessions for this course
    await prisma.session.updateMany({
      where: { courseId, isActive: true },
      data: { isActive: false },
    });

    const token = generateToken();
    const duration = Number(durationMinutes) || 15;
    const expiresAt = new Date(Date.now() + duration * 60 * 1000);

    const qrPayload = JSON.stringify({
      type: 'POLYATTEND_QR',
      courseId,
      courseCode: course.code,
      token,
      expiresAt: expiresAt.toISOString(),
      v: 1,
    });

    const session = await prisma.session.create({
      data: {
        courseId,
        lecturerId: user.userId,
        topic,
        token,
        qrPayload,
        durationMinutes: duration,
        expiresAt,
        isActive: true,
      },
      include: {
        course: { select: { code: true, title: true } },
        lecturer: { select: { name: true } },
      },
    });

    return NextResponse.json({ session }, { status: 201 });
  } catch (err) {
    console.error('[POST /api/sessions]', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

// GET /api/sessions — get sessions for a course
export async function GET(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const courseId = searchParams.get('courseId');

    const where: Record<string, unknown> = courseId ? { courseId } : {};

    if (user.role === 'LECTURER') {
      where.lecturerId = user.userId;
    }

    const sessions = await prisma.session.findMany({
      where,
      include: {
        course: { select: { code: true, title: true } },
        _count: { select: { attendance: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ sessions });
  } catch (err) {
    console.error('[GET /api/sessions]', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

// PATCH /api/sessions — close/extend a session
export async function PATCH(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { sessionId, action, additionalMinutes } = await req.json();

    if (action === 'close') {
      const session = await prisma.session.update({
        where: { id: sessionId },
        data: { isActive: false },
      });
      return NextResponse.json({ session });
    }

    if (action === 'extend' && additionalMinutes) {
      const session = await prisma.session.findUnique({ where: { id: sessionId } });
      if (!session) return NextResponse.json({ error: 'Not found' }, { status: 404 });

      const newExpiry = new Date(session.expiresAt.getTime() + additionalMinutes * 60 * 1000);
      const updated = await prisma.session.update({
        where: { id: sessionId },
        data: { expiresAt: newExpiry },
      });
      return NextResponse.json({ session: updated });
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  } catch (err) {
    console.error('[PATCH /api/sessions]', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
