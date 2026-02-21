import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireSuperAdmin, forbiddenError } from '@/lib/api-auth';
import { hashPassword } from '@/lib/auth';

// GET /api/admin/companies/[id] - Get single company details
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    requireSuperAdmin(request);
  } catch {
    return forbiddenError();
  }

  try {
    const company = await prisma.company.findUnique({
      where: { id: params.id },
      include: {
        _count: {
          select: { users: true, customers: true, vehicles: true, estimates: true, workOrders: true },
        },
        shopSettings: true,
        users: {
          select: { id: true, name: true, email: true, role: true, isActive: true, createdAt: true },
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!company) {
      return NextResponse.json({ error: 'Empresa no encontrada' }, { status: 404 });
    }

    return NextResponse.json(company);
  } catch (error) {
    console.error('Error fetching company:', error);
    return NextResponse.json({ error: 'Error al obtener empresa' }, { status: 500 });
  }
}

// PUT /api/admin/companies/[id] - Update company
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    requireSuperAdmin(request);
  } catch {
    return forbiddenError();
  }

  try {
    const body = await request.json();
    const { name, slug, isActive } = body;

    const existing = await prisma.company.findUnique({ where: { id: params.id } });
    if (!existing) {
      return NextResponse.json({ error: 'Empresa no encontrada' }, { status: 404 });
    }

    // Check slug uniqueness if changing
    if (slug && slug !== existing.slug) {
      const slugTaken = await prisma.company.findUnique({ where: { slug } });
      if (slugTaken) {
        return NextResponse.json({ error: 'El slug ya está en uso' }, { status: 400 });
      }
    }

    const company = await prisma.company.update({
      where: { id: params.id },
      data: {
        ...(name !== undefined && { name }),
        ...(slug !== undefined && { slug }),
        ...(isActive !== undefined && { isActive }),
      },
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

    return NextResponse.json(company);
  } catch (error) {
    console.error('Error updating company:', error);
    return NextResponse.json({ error: 'Error al actualizar empresa' }, { status: 500 });
  }
}

// DELETE /api/admin/companies/[id] - Delete company (cascades all data)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    requireSuperAdmin(request);
  } catch {
    return forbiddenError();
  }

  try {
    const existing = await prisma.company.findUnique({ where: { id: params.id } });
    if (!existing) {
      return NextResponse.json({ error: 'Empresa no encontrada' }, { status: 404 });
    }

    // Cascade delete handled by Prisma schema onDelete: Cascade
    await prisma.company.delete({ where: { id: params.id } });

    return NextResponse.json({ ok: true, message: `Empresa "${existing.name}" eliminada` });
  } catch (error) {
    console.error('Error deleting company:', error);
    return NextResponse.json({ error: 'Error al eliminar empresa' }, { status: 500 });
  }
}
