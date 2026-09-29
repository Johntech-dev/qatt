import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function GET(req: NextRequest) {
  const user = await getUserFromRequest(req);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const dbUser = await prisma.user.findUnique({
    where: { id: user.userId },
    select: {
      id: true, name: true, email: true, role: true,
      matricNumber: true, level: true, department: true, institution: true,
    },
  });

  if (!dbUser) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json({ user: dbUser });
}
