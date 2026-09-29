import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/db';
import { signToken } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, email, password, role, matricNumber, level, department } = body;

    if (!name || !email || !password || !role) {
      return NextResponse.json({ error: 'Missing required fields.' }, { status: 400 });
    }

    if (role === 'STUDENT' && !matricNumber) {
      return NextResponse.json({ error: 'Matric number is required for students.' }, { status: 400 });
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json({ error: 'Email already registered.' }, { status: 409 });
    }

    if (matricNumber) {
      const existingMatric = await prisma.user.findUnique({ where: { matricNumber } });
      if (existingMatric) {
        return NextResponse.json({ error: 'Matric number already registered.' }, { status: 409 });
      }
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const user = await prisma.user.create({
      data: {
        name,
        email,
        passwordHash,
        role,
        matricNumber: role === 'STUDENT' ? matricNumber : undefined,
        level: role === 'STUDENT' ? (level ?? 'ND1') : undefined,
        department: department ?? 'Software & Web Development',
      },
    });

    const token = await signToken({
      userId: user.id,
      role: user.role,
      name: user.name,
      email: user.email,
    });

    const res = NextResponse.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        matricNumber: user.matricNumber,
        level: user.level,
        department: user.department,
        institution: user.institution,
      },
      token,
    });

    res.cookies.set('qatt_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/',
    });

    return res;
  } catch (err) {
    console.error('[SIGNUP]', err);
    return NextResponse.json({ error: 'Server error. Please try again.' }, { status: 500 });
  }
}
