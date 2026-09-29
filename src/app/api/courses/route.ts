import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import { prisma } from '@/lib/db';

// GET /api/courses — list all courses (students & lecturers)
export async function GET(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search') ?? '';
    const mine = searchParams.get('mine') === 'true';

    const where: Record<string, unknown> = {};

    if (mine && user.role === 'LECTURER') {
      where.lecturerId = user.userId;
    }

    if (search) {
      where.OR = [
        { code: { contains: search, mode: 'insensitive' } },
        { title: { contains: search, mode: 'insensitive' } },
        { department: { contains: search, mode: 'insensitive' } },
      ];
    }

    const courses = await prisma.course.findMany({
      where,
      include: {
        lecturer: { select: { id: true, name: true, department: true } },
        _count: { select: { enrollments: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ courses });
  } catch (err) {
    console.error('[GET /api/courses]', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

// POST /api/courses — create a new course (lecturer only)
export async function POST(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'LECTURER' && user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Only lecturers can create courses.' }, { status: 403 });
    }

    const { code, title, department, semester, units, requiresApproval } = await req.json();

    if (!code || !title) {
      return NextResponse.json({ error: 'Course code and title are required.' }, { status: 400 });
    }

    const existing = await prisma.course.findUnique({ where: { code } });
    if (existing) {
      return NextResponse.json({ error: 'Course code already exists.' }, { status: 409 });
    }

    const course = await prisma.course.create({
      data: {
        code: code.toUpperCase().trim(),
        title,
        department: department ?? 'Software & Web Development',
        semester: semester ?? '1st Semester 2025/2026',
        units: Number(units) || 3,
        requiresApproval: requiresApproval ?? false,
        lecturerId: user.userId,
      },
      include: {
        lecturer: { select: { id: true, name: true, department: true } },
      },
    });

    return NextResponse.json({ course }, { status: 201 });
  } catch (err) {
    console.error('[POST /api/courses]', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
