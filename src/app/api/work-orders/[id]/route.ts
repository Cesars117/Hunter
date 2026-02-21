import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
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

// GET /api/work-orders/[id]
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const where = getOwnerFilter(request, params.id);
    const workOrder = await prisma.workOrder.findFirst({
      where,
      include: {
        estimate: {
          include: {
            customer: true,
            vehicle: true,
            items: { orderBy: { sortOrder: 'asc' } },
          },
        },
        tasks: { orderBy: { sortOrder: 'asc' } },
      },
    });

    if (!workOrder) {
      return NextResponse.json(
        { error: 'Orden de trabajo no encontrada' },
        { status: 404 }
      );
    }

    return NextResponse.json(workOrder);
  } catch (error) {
    console.error('Error fetching work order:', error);
    return NextResponse.json(
      { error: 'Error al obtener orden de trabajo' },
      { status: 500 }
    );
  }
}

// PUT /api/work-orders/[id]
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();

    // Verify ownership
    const where = getOwnerFilter(request, params.id);
    const existing = await prisma.workOrder.findFirst({ where });
    if (!existing) {
      return NextResponse.json({ error: 'Orden no encontrada' }, { status: 404 });
    }

    // Handle tasks update
    if (body.tasks) {
      await prisma.workTask.deleteMany({
        where: { workOrderId: params.id },
      });

      if (body.tasks.length > 0) {
        await prisma.workTask.createMany({
          data: body.tasks.map((task: any, index: number) => ({
            workOrderId: params.id,
            description: task.description,
            status: task.status || 'PENDING',
            assignedTo: task.assignedTo || null,
            timeSpent: task.timeSpent ? parseFloat(task.timeSpent) : null,
            notes: task.notes || null,
            completedAt: task.status === 'COMPLETED' ? new Date() : null,
            sortOrder: index,
          })),
        });
      }
    }

    const workOrder = await prisma.workOrder.update({
      where: { id: params.id },
      data: {
        status: body.status,
        assignedTo: body.assignedTo,
        bay: body.bay,
        priority: body.priority,
        startDate: body.startDate ? new Date(body.startDate) : undefined,
        estimatedCompletion: body.estimatedCompletion
          ? new Date(body.estimatedCompletion)
          : undefined,
        completedDate: body.status === 'COMPLETED' ? new Date() : undefined,
        deliveredDate: body.status === 'DELIVERED' ? new Date() : undefined,
        techNotes: body.techNotes,
      },
      include: {
        estimate: {
          include: {
            customer: true,
            vehicle: true,
            items: { orderBy: { sortOrder: 'asc' } },
          },
        },
        tasks: { orderBy: { sortOrder: 'asc' } },
      },
    });

    // If work order is completed, update estimate status too
    if (body.status === 'COMPLETED') {
      await prisma.estimate.update({
        where: { id: workOrder.estimateId },
        data: {
          status: 'COMPLETED',
          completedDate: new Date(),
        },
      });
    }

    return NextResponse.json(workOrder);
  } catch (error) {
    console.error('Error updating work order:', error);
    return NextResponse.json(
      { error: 'Error al actualizar orden de trabajo' },
      { status: 500 }
    );
  }
}
