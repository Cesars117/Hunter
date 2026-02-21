import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCompanyId } from '@/lib/api-auth';

// GET /api/customers/[id]
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const companyId = getCompanyId(request);
    const customer = await prisma.customer.findFirst({
      where: { id: params.id, companyId },
      include: {
        vehicles: {
          orderBy: { createdAt: 'desc' },
        },
        estimates: {
          orderBy: { createdAt: 'desc' },
          include: {
            vehicle: { select: { year: true, make: true, model: true } },
          },
        },
      },
    });

    if (!customer) {
      return NextResponse.json(
        { error: 'Cliente no encontrado' },
        { status: 404 }
      );
    }

    return NextResponse.json(customer);
  } catch (error) {
    console.error('Error fetching customer:', error);
    return NextResponse.json(
      { error: 'Error al obtener cliente' },
      { status: 500 }
    );
  }
}

// PUT /api/customers/[id]
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const companyId = getCompanyId(request);
    const body = await request.json();

    // Verify ownership
    const existing = await prisma.customer.findFirst({
      where: { id: params.id, companyId },
    });
    if (!existing) {
      return NextResponse.json({ error: 'Cliente no encontrado' }, { status: 404 });
    }

    const customer = await prisma.customer.update({
      where: { id: params.id },
      data: {
        firstName: body.firstName,
        lastName: body.lastName,
        email: body.email || null,
        phone: body.phone,
        phone2: body.phone2 || null,
        address: body.address || null,
        city: body.city || null,
        state: body.state || null,
        zipCode: body.zipCode || null,
        notes: body.notes || null,
      },
    });

    return NextResponse.json(customer);
  } catch (error) {
    console.error('Error updating customer:', error);
    return NextResponse.json(
      { error: 'Error al actualizar cliente' },
      { status: 500 }
    );
  }
}

// DELETE /api/customers/[id]
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const companyId = getCompanyId(request);

    // Verify ownership
    const existing = await prisma.customer.findFirst({
      where: { id: params.id, companyId },
    });
    if (!existing) {
      return NextResponse.json({ error: 'Cliente no encontrado' }, { status: 404 });
    }

    await prisma.customer.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ message: 'Cliente eliminado' });
  } catch (error) {
    console.error('Error deleting customer:', error);
    return NextResponse.json(
      { error: 'Error al eliminar cliente' },
      { status: 500 }
    );
  }
}
