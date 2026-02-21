import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireSuperAdmin, forbiddenError, authError } from '@/lib/api-auth';
import { hashPassword } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// GET /api/admin/companies - List all companies (SUPER_ADMIN only)
export async function GET(request: NextRequest) {
  try {
    requireSuperAdmin(request);
  } catch {
    return forbiddenError();
  }

  try {
    const companies = await prisma.company.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: {
            users: true,
            customers: true,
            vehicles: true,
            estimates: true,
            workOrders: true,
          },
        },
        shopSettings: {
          select: { shopName: true, phone: true, email: true },
        },
        users: {
          select: { id: true, name: true, email: true, role: true, isActive: true },
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    return NextResponse.json(companies);
  } catch (error) {
    console.error('Error listing companies:', error);
    return NextResponse.json(
      { error: 'Error al obtener empresas' },
      { status: 500 }
    );
  }
}

// POST /api/admin/companies - Create a new company with admin user
export async function POST(request: NextRequest) {
  try {
    requireSuperAdmin(request);
  } catch {
    return forbiddenError();
  }

  try {
    const body = await request.json();
    const { name, slug, adminName, adminEmail, adminPassword } = body;

    if (!name || !slug || !adminEmail || !adminPassword) {
      return NextResponse.json(
        { error: 'Nombre, slug, email y contraseña del admin son requeridos' },
        { status: 400 }
      );
    }

    // Check slug uniqueness
    const existingSlug = await prisma.company.findUnique({ where: { slug } });
    if (existingSlug) {
      return NextResponse.json(
        { error: 'El slug ya está en uso' },
        { status: 400 }
      );
    }

    // Check email uniqueness
    const existingEmail = await prisma.user.findUnique({ where: { email: adminEmail } });
    if (existingEmail) {
      return NextResponse.json(
        { error: 'El email ya está registrado' },
        { status: 400 }
      );
    }

    const hashedPw = await hashPassword(adminPassword);

    // Create company + admin user + shop settings in transaction
    const company = await prisma.$transaction(async (tx) => {
      const newCompany = await tx.company.create({
        data: { name, slug },
      });

      await tx.user.create({
        data: {
          companyId: newCompany.id,
          email: adminEmail,
          password: hashedPw,
          name: adminName || name,
          role: 'ADMIN',
        },
      });

      await tx.shopSettings.create({
        data: {
          companyId: newCompany.id,
          shopName: name,
        },
      });

      return newCompany;
    });

    // Return the full company with relations
    const fullCompany = await prisma.company.findUnique({
      where: { id: company.id },
      include: {
        _count: {
          select: { users: true, customers: true, vehicles: true, estimates: true, workOrders: true },
        },
        shopSettings: { select: { shopName: true, phone: true, email: true } },
        users: {
          select: { id: true, name: true, email: true, role: true, isActive: true },
        },
      },
    });

    return NextResponse.json(fullCompany, { status: 201 });
  } catch (error) {
    console.error('Error creating company:', error);
    return NextResponse.json(
      { error: 'Error al crear empresa' },
      { status: 500 }
    );
  }
}
