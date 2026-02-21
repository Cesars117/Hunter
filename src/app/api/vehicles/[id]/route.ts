import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCompanyId } from '@/lib/api-auth';

// GET /api/vehicles/[id]
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const companyId = getCompanyId(request);
    const vehicle = await prisma.vehicle.findFirst({
      where: { id: params.id, companyId },
      include: {
        customer: true,
        estimates: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!vehicle) {
      return NextResponse.json(
        { error: 'Vehículo no encontrado' },
        { status: 404 }
      );
    }

    return NextResponse.json(vehicle);
  } catch (error) {
    console.error('Error fetching vehicle:', error);
    return NextResponse.json(
      { error: 'Error al obtener vehículo' },
      { status: 500 }
    );
  }
}

// PUT /api/vehicles/[id]
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const companyId = getCompanyId(request);
    const body = await request.json();

    const existing = await prisma.vehicle.findFirst({
      where: { id: params.id, companyId },
    });
    if (!existing) {
      return NextResponse.json({ error: 'Vehículo no encontrado' }, { status: 404 });
    }

    const vehicle = await prisma.vehicle.update({
      where: { id: params.id },
      data: {
        customerId: body.customerId,
        year: parseInt(body.year),
        make: body.make,
        model: body.model,
        trim: body.trim || null,
        color: body.color || null,
        vin: body.vin || null,
        licensePlate: body.licensePlate || null,
        mileage: body.mileage ? parseInt(body.mileage) : null,
        engineType: body.engineType || null,
        transmission: body.transmission || null,
        notes: body.notes || null,
      },
    });

    return NextResponse.json(vehicle);
  } catch (error) {
    console.error('Error updating vehicle:', error);
    return NextResponse.json(
      { error: 'Error al actualizar vehículo' },
      { status: 500 }
    );
  }
}

// DELETE /api/vehicles/[id]
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const companyId = getCompanyId(request);
    const existing = await prisma.vehicle.findFirst({
      where: { id: params.id, companyId },
    });
    if (!existing) {
      return NextResponse.json({ error: 'Vehículo no encontrado' }, { status: 404 });
    }

    await prisma.vehicle.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ message: 'Vehículo eliminado' });
  } catch (error) {
    console.error('Error deleting vehicle:', error);
    return NextResponse.json(
      { error: 'Error al eliminar vehículo' },
      { status: 500 }
    );
  }
}
