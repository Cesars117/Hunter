import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { generateWorkOrderNumber } from '@/lib/utils';
import { getCompanyId } from '@/lib/api-auth';
import { isSuperAdmin } from '@/lib/auth';

function getOwnerFilter(request: NextRequest, id: string) {
  const role = request.headers.get('x-user-role') || '';
  const where: any = { id };
  if (!isSuperAdmin(role)) {
    where.companyId = getCompanyId(request);
  }
  return where;
}

// GET /api/estimates/[id]
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const estimate = await prisma.estimate.findFirst({
      where: getOwnerFilter(request, params.id),
      include: {
        customer: true,
        vehicle: true,
        items: { orderBy: { sortOrder: 'asc' } },
        workOrder: {
          include: {
            tasks: { orderBy: { sortOrder: 'asc' } },
          },
        },
      },
    });

    if (!estimate) {
      return NextResponse.json(
        { error: 'Estimado no encontrado' },
        { status: 404 }
      );
    }

    return NextResponse.json(estimate);
  } catch (error) {
    console.error('Error fetching estimate:', error);
    return NextResponse.json(
      { error: 'Error al obtener estimado' },
      { status: 500 }
    );
  }
}

// PUT /api/estimates/[id]
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const companyId = getCompanyId(request);
    const body = await request.json();

    // Verify ownership
    const existing = await prisma.estimate.findFirst({
      where: getOwnerFilter(request, params.id),
    });
    if (!existing) {
      return NextResponse.json({ error: 'Estimado no encontrado' }, { status: 404 });
    }

    // If updating items, handle them separately
    if (body.items) {
      await prisma.estimateItem.deleteMany({
        where: { estimateId: params.id },
      });

      if (body.items.length > 0) {
        await prisma.estimateItem.createMany({
          data: body.items.map((item: any, index: number) => ({
            estimateId: params.id,
            type: item.type,
            description: item.description,
            partNumber: item.partNumber || null,
            brand: item.brand || null,
            supplier: item.supplier || null,
            quantity: parseFloat(item.quantity) || 1,
            unitPrice: parseFloat(item.unitPrice) || 0,
            cost: parseFloat(item.cost) || 0,
            amount: (parseFloat(item.quantity) || 1) * (parseFloat(item.unitPrice) || 0),
            taxable: item.taxable !== false,
            hours: item.hours ? parseFloat(item.hours) : null,
            laborRate: item.laborRate ? parseFloat(item.laborRate) : null,
            notes: item.notes || null,
            sortOrder: index,
          })),
        });
      }
    }

    // Calculate totals
    const items = await prisma.estimateItem.findMany({
      where: { estimateId: params.id },
    });

    const subtotal = items.reduce((sum, item) => sum + item.amount, 0);
    const taxRate = body.taxRate ?? 11.5;
    const taxableAmount = items
      .filter((item) => item.taxable)
      .reduce((sum, item) => sum + item.amount, 0);
    const taxAmount = (taxableAmount * taxRate) / 100;
    const discount = parseFloat(body.discount) || 0;
    const total = subtotal + taxAmount - discount;

    // Handle status change to APPROVED - create work order
    if (body.status === 'APPROVED') {
      const existingWO = await prisma.workOrder.findUnique({
        where: { estimateId: params.id },
      });

      if (!existingWO) {
        await prisma.workOrder.create({
          data: {
            companyId,
            workOrderNumber: generateWorkOrderNumber(),
            estimateId: params.id,
            status: 'PENDING',
            priority: 'NORMAL',
          },
        });
      }
    }

    const estimate = await prisma.estimate.update({
      where: { id: params.id },
      data: {
        description: body.description,
        diagnosticNotes: body.diagnosticNotes,
        status: body.status,
        taxRate,
        subtotal,
        taxAmount,
        discount,
        total,
        customerNotes: body.customerNotes,
        internalNotes: body.internalNotes,
        approvedDate: body.status === 'APPROVED' ? new Date() : undefined,
        completedDate: body.status === 'COMPLETED' ? new Date() : undefined,
      },
      include: {
        customer: true,
        vehicle: true,
        items: { orderBy: { sortOrder: 'asc' } },
        workOrder: true,
      },
    });

    return NextResponse.json(estimate);
  } catch (error) {
    console.error('Error updating estimate:', error);
    return NextResponse.json(
      { error: 'Error al actualizar estimado' },
      { status: 500 }
    );
  }
}

// DELETE /api/estimates/[id]
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const existing = await prisma.estimate.findFirst({
      where: getOwnerFilter(request, params.id),
    });
    if (!existing) {
      return NextResponse.json({ error: 'Estimado no encontrado' }, { status: 404 });
    }

    await prisma.workOrder.deleteMany({
      where: { estimateId: params.id },
    });

    await prisma.estimate.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ message: 'Estimado eliminado' });
  } catch (error) {
    console.error('Error deleting estimate:', error);
    return NextResponse.json(
      { error: 'Error al eliminar estimado' },
      { status: 500 }
    );
  }
}
