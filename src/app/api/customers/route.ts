import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCompanyId } from '@/lib/api-auth';

// GET /api/customers - List all customers for the company
export async function GET(request: NextRequest) {
  try {
    const companyId = getCompanyId(request);
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';

    const customers = await prisma.customer.findMany({
      where: {
        companyId,
        ...(search
          ? {
              OR: [
                { firstName: { contains: search } },
                { lastName: { contains: search } },
                { email: { contains: search } },
                { phone: { contains: search } },
              ],
            }
          : {}),
      },
      include: {
        _count: {
          select: { vehicles: true, estimates: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(customers);
  } catch (error) {
    console.error('Error fetching customers:', error);
    return NextResponse.json(
      { error: 'Error al obtener clientes' },
      { status: 500 }
    );
  }
}

// POST /api/customers - Create a new customer
export async function POST(request: NextRequest) {
  try {
    const companyId = getCompanyId(request);
    const body = await request.json();

    const customer = await prisma.customer.create({
      data: {
        companyId,
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

    return NextResponse.json(customer, { status: 201 });
  } catch (error) {
    console.error('Error creating customer:', error);
    return NextResponse.json(
      { error: 'Error al crear cliente' },
      { status: 500 }
    );
  }
}
