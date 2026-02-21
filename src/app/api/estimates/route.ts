import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { generateEstimateNumber } from '@/lib/utils';
import { getCompanyId } from '@/lib/api-auth';

// GET /api/estimates
export async function GET(request: NextRequest) {
  try {
    const companyId = getCompanyId(request);
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const customerId = searchParams.get('customerId');
    const vehicleId = searchParams.get('vehicleId');

    const where: any = { companyId };
    if (status) {
      if (status === 'pending') {
        where.status = { in: ['DRAFT', 'SENT'] };
      } else if (status === 'active') {
        where.status = { in: ['APPROVED', 'IN_PROGRESS'] };
      } else {
        where.status = status.toUpperCase();
      }
    }
    if (customerId) where.customerId = customerId;
    if (vehicleId) where.vehicleId = vehicleId;

    const estimates = await prisma.estimate.findMany({
      where,
      include: {
        customer: { select: { firstName: true, lastName: true } },
        vehicle: { select: { year: true, make: true, model: true } },
        items: { orderBy: { sortOrder: 'asc' } },
        workOrder: { select: { id: true, status: true, workOrderNumber: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(estimates);
  } catch (error) {
    console.error('Error fetching estimates:', error);
    return NextResponse.json(
      { error: 'Error al obtener estimados' },
      { status: 500 }
    );
  }
}

// POST /api/estimates
export async function POST(request: NextRequest) {
  try {
    const companyId = getCompanyId(request);
    const body = await request.json();

    // Generate estimate number
    const estimateNumber = generateEstimateNumber();

    // Get shop settings for defaults
    const settings = await prisma.shopSettings.findFirst({
      where: { companyId },
    });

    const estimate = await prisma.estimate.create({
      data: {
        companyId,
        estimateNumber,
        customerId: body.customerId,
        vehicleId: body.vehicleId,
        status: 'DRAFT',
        description: body.description || null,
        diagnosticNotes: body.diagnosticNotes || null,
        taxRate: body.taxRate ?? settings?.taxRate ?? 11.5,
        customerNotes: body.customerNotes || null,
        internalNotes: body.internalNotes || null,
      },
      include: {
        customer: true,
        vehicle: true,
        items: true,
      },
    });

    return NextResponse.json(estimate, { status: 201 });
  } catch (error) {
    console.error('Error creating estimate:', error);
    return NextResponse.json(
      { error: 'Error al crear estimado' },
      { status: 500 }
    );
  }
}
