import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export async function POST() {
  try {
    const existingAdmin = await prisma.user.findFirst({
      where: { role: 'ADMIN' },
    });

    if (existingAdmin) {
      return NextResponse.json({ message: 'Admin already exists' }, { status: 400 });
    }

    const password = await bcrypt.hash('admin123', 10);

    const admin = await prisma.user.create({
      data: {
        email: 'admin@team.gg',
        name: 'Admin User',
        password,
        role: 'ADMIN',
      },
    });

    return NextResponse.json({ message: 'Admin created successfully', user: admin });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: 'Error creating admin' }, { status: 500 });
  }
}
