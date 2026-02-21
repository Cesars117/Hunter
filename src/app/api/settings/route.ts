import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCompanyId, getCompanyFilter } from '@/lib/api-auth';

export const dynamic = 'force-dynamic';

// GET /api/settings
export async function GET(request: NextRequest) {
  try {
    const companyId = getCompanyId(request);

    let settings = await prisma.shopSettings.findFirst({
      where: { companyId },
    });

    if (!settings) {
      settings = await prisma.shopSettings.create({
        data: { companyId },
      });
    }

    return NextResponse.json(settings);
  } catch (error) {
    console.error('Error fetching settings:', error);
    return NextResponse.json(
      { error: 'Error al obtener configuración' },
      { status: 500 }
    );
  }
}

// PUT /api/settings
export async function PUT(request: NextRequest) {
  try {
    const companyId = getCompanyId(request);
    const body = await request.json();

    const settings = await prisma.shopSettings.upsert({
      where: { companyId },
      update: {
        shopName: body.shopName,
        address: body.address,
        city: body.city,
        state: body.state,
        zipCode: body.zipCode,
        phone: body.phone,
        email: body.email,
        website: body.website,
        taxRate: parseFloat(body.taxRate) || 11.5,
        laborRate: parseFloat(body.laborRate) || 85.0,
      },
      create: {
        companyId,
        shopName: body.shopName,
        address: body.address,
        city: body.city,
        state: body.state,
        zipCode: body.zipCode,
        phone: body.phone,
        email: body.email,
        website: body.website,
        taxRate: parseFloat(body.taxRate) || 11.5,
        laborRate: parseFloat(body.laborRate) || 85.0,
      },
    });

    return NextResponse.json(settings);
  } catch (error) {
    console.error('Error updating settings:', error);
    return NextResponse.json(
      { error: 'Error al guardar configuración' },
      { status: 500 }
    );
  }
}
