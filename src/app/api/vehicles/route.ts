import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCompanyId } from '@/lib/api-auth';

// GET /api/vehicles
export async function GET(request: NextRequest) {
  try {
    const companyId = getCompanyId(request);
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const customerId = searchParams.get('customerId');

    const where: any = { companyId };
    if (customerId) where.customerId = customerId;
    if (search) {
      where.OR = [
        { make: { contains: search } },
        { model: { contains: search } },
        { vin: { contains: search } },
        { licensePlate: { contains: search } },
      ];
    }

    const vehicles = await prisma.vehicle.findMany({
      where,
      include: {
        customer: {
          select: { firstName: true, lastName: true },
        },
        _count: {
          select: { estimates: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(vehicles);
  } catch (error) {
    console.error('Error fetching vehicles:', error);
    return NextResponse.json(
      { error: 'Error al obtener vehículos' },
      { status: 500 }
    );
  }
}

// POST /api/vehicles
export async function POST(request: NextRequest) {
  try {
    const companyId = getCompanyId(request);
    const body = await request.json();

    const vehicle = await prisma.vehicle.create({
      data: {
        companyId,
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

    return NextResponse.json(vehicle, { status: 201 });
  } catch (error) {
    console.error('Error creating vehicle:', error);
    return NextResponse.json(
      { error: 'Error al crear vehículo' },
      { status: 500 }
    );
  }
}
