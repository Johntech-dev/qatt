import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import { prisma } from '@/lib/db';

// POST /api/courses/[id]/enroll — student enrolls in a course
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'STUDENT') {
      return NextResponse.json({ error: 'Only students can enroll.' }, { status: 403 });
    }

    const { id: courseId } = await params;

    const course = await prisma.course.findUnique({ where: { id: courseId } });
    if (!course) return NextResponse.json({ error: 'Course not found.' }, { status: 404 });

    const existing = await prisma.enrollment.findUnique({
      where: { studentId_courseId: { studentId: user.userId, courseId } },
    });

    if (existing) {
      return NextResponse.json(
        { message: `Already ${existing.status.toLowerCase()} for this course.`, enrollment: existing },
        { status: 200 }
      );
    }

    const enrollment = await prisma.enrollment.create({
      data: {
        studentId: user.userId,
        courseId,
        status: course.requiresApproval ? 'PENDING' : 'APPROVED',
      },
    });

    const message = course.requiresApproval
      ? 'Enrollment request sent. Awaiting lecturer approval.'
      : 'Successfully enrolled in course!';

    return NextResponse.json({ enrollment, message }, { status: 201 });
  } catch (err) {
    console.error('[POST /api/courses/[id]/enroll]', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
