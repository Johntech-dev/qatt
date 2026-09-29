import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import { prisma } from '@/lib/db';

// GET /api/enrollments — get enrollments (for lecturer's courses or student's own)
export async function GET(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const courseId = searchParams.get('courseId');

    if (user.role === 'STUDENT') {
      const enrollments = await prisma.enrollment.findMany({
        where: { studentId: user.userId },
        include: {
          course: {
            include: { lecturer: { select: { name: true } } },
          },
        },
        orderBy: { enrolledAt: 'desc' },
      });
      return NextResponse.json({ enrollments });
    }

    if (user.role === 'LECTURER' || user.role === 'ADMIN') {
      const where: Record<string, unknown> = courseId ? { courseId } : {};
      if (user.role === 'LECTURER' && !courseId) {
        // All enrollments across this lecturer's courses
        const myCourses = await prisma.course.findMany({
          where: { lecturerId: user.userId },
          select: { id: true },
        });
        where.courseId = { in: myCourses.map((c: { id: any; }) => c.id) };
      }

      const enrollments = await prisma.enrollment.findMany({
        where,
        include: {
          student: { select: { id: true, name: true, matricNumber: true, level: true, department: true } },
          course: { select: { id: true, code: true, title: true } },
        },
        orderBy: { enrolledAt: 'desc' },
      });
      return NextResponse.json({ enrollments });
    }

    return NextResponse.json({ enrollments: [] });
  } catch (err) {
    console.error('[GET /api/enrollments]', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

// PATCH /api/enrollments — update status (lecturer approves/rejects)
export async function PATCH(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'LECTURER' && user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Only lecturers can update enrollments.' }, { status: 403 });
    }

    const { enrollmentId, status } = await req.json();
    if (!enrollmentId || !status) {
      return NextResponse.json({ error: 'enrollmentId and status required.' }, { status: 400 });
    }

    const updated = await prisma.enrollment.update({
      where: { id: enrollmentId },
      data: { status },
    });

    return NextResponse.json({ enrollment: updated });
  } catch (err) {
    console.error('[PATCH /api/enrollments]', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
