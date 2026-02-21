import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCompanyId, getCompanyFilter } from '@/lib/api-auth';

export const dynamic = 'force-dynamic';

// GET /api/work-orders
export async function GET(request: NextRequest) {
  try {
    const companyFilter = getCompanyFilter(request);
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');

    const where: any = companyFilter ? { companyId: companyFilter } : {};
    if (status) {
      if (status === 'active') {
        where.status = { in: ['PENDING', 'IN_PROGRESS', 'WAITING_PARTS', 'ON_HOLD'] };
      } else {
        where.status = status.toUpperCase();
      }
    }

    const workOrders = await prisma.workOrder.findMany({
      where,
      include: {
        estimate: {
          include: {
            customer: { select: { firstName: true, lastName: true, phone: true } },
            vehicle: { select: { year: true, make: true, model: true, color: true, licensePlate: true } },
          },
        },
        tasks: { orderBy: { sortOrder: 'asc' } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(workOrders);
  } catch (error) {
    console.error('Error fetching work orders:', error);
    return NextResponse.json(
      { error: 'Error al obtener órdenes de trabajo' },
      { status: 500 }
    );
  }
}
