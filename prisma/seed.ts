import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🔧 Seeding Hunter database...');

  // ─── COMPANIES ─────────────────────────────────────
  const company1 = await prisma.company.upsert({
    where: { id: 'comp-001' },
    update: {},
    create: {
      id: 'comp-001',
      name: 'AutoFix PR',
      slug: 'autofix-pr',
    },
  });

  const company2 = await prisma.company.upsert({
    where: { id: 'comp-002' },
    update: {},
    create: {
      id: 'comp-002',
      name: 'Taller Rodríguez',
      slug: 'taller-rodriguez',
    },
  });

  // ─── USERS ─────────────────────────────────────────
  const hashedPassword = await bcrypt.hash('admin123', 12);

  await prisma.user.upsert({
    where: { id: 'user-001' },
    update: {},
    create: {
      id: 'user-001',
      companyId: company1.id,
      email: 'admin@autofix.com',
      password: hashedPassword,
      name: 'Carlos Admin',
      role: 'ADMIN',
    },
  });

  await prisma.user.upsert({
    where: { id: 'user-002' },
    update: {},
    create: {
      id: 'user-002',
      companyId: company2.id,
      email: 'admin@rodriguez.com',
      password: hashedPassword,
      name: 'Pedro Rodríguez',
      role: 'ADMIN',
    },
  });

  // ─── SHOP SETTINGS ────────────────────────────────
  await prisma.shopSettings.upsert({
    where: { companyId: company1.id },
    update: {},
    create: {
      companyId: company1.id,
      shopName: 'AutoFix PR',
      address: '123 Main Street',
      city: 'San Juan',
      state: 'PR',
      zipCode: '00901',
      phone: '(787) 555-0100',
      email: 'info@autofix.com',
      taxRate: 11.5,
      laborRate: 85.0,
    },
  });

  await prisma.shopSettings.upsert({
    where: { companyId: company2.id },
    update: {},
    create: {
      companyId: company2.id,
      shopName: 'Taller Rodríguez',
      address: '456 Calle Sol',
      city: 'Mayagüez',
      state: 'PR',
      zipCode: '00680',
      phone: '(787) 555-0200',
      email: 'info@rodriguez.com',
      taxRate: 11.5,
      laborRate: 75.0,
    },
  });

  // ─── SAMPLE DATA FOR COMPANY 1 ────────────────────
  const customer1 = await prisma.customer.upsert({
    where: { id: 'cust-001' },
    update: {},
    create: {
      id: 'cust-001',
      companyId: company1.id,
      firstName: 'Carlos',
      lastName: 'Rivera',
      email: 'carlos.rivera@email.com',
      phone: '(787) 555-0101',
      address: '456 Calle Sol',
      city: 'San Juan',
      state: 'PR',
      zipCode: '00902',
    },
  });

  const customer2 = await prisma.customer.upsert({
    where: { id: 'cust-002' },
    update: {},
    create: {
      id: 'cust-002',
      companyId: company1.id,
      firstName: 'María',
      lastName: 'González',
      email: 'maria.gonzalez@email.com',
      phone: '(787) 555-0102',
      address: '789 Ave. Fernández Juncos',
      city: 'Bayamón',
      state: 'PR',
      zipCode: '00960',
    },
  });

  const customer3 = await prisma.customer.upsert({
    where: { id: 'cust-003' },
    update: {},
    create: {
      id: 'cust-003',
      companyId: company1.id,
      firstName: 'José',
      lastName: 'Martínez',
      phone: '(787) 555-0103',
      email: 'jose.martinez@email.com',
      address: '321 Calle Luna',
      city: 'Carolina',
      state: 'PR',
      zipCode: '00979',
    },
  });

  // Sample Vehicles
  const vehicle1 = await prisma.vehicle.upsert({
    where: { id: 'veh-001' },
    update: {},
    create: {
      id: 'veh-001',
      companyId: company1.id,
      customerId: customer1.id,
      year: 2020,
      make: 'Toyota',
      model: 'Corolla',
      trim: 'LE',
      color: 'Blanco',
      vin: '2T1BURHE0LC123456',
      licensePlate: 'ABC-123',
      mileage: 45000,
      engineType: '1.8L 4-Cyl',
      transmission: 'CVT',
    },
  });

  const vehicle2 = await prisma.vehicle.upsert({
    where: { id: 'veh-002' },
    update: {},
    create: {
      id: 'veh-002',
      companyId: company1.id,
      customerId: customer2.id,
      year: 2019,
      make: 'Honda',
      model: 'CR-V',
      trim: 'EX',
      color: 'Gris',
      vin: '7FARW2H53KE123456',
      licensePlate: 'DEF-456',
      mileage: 62000,
      engineType: '1.5L Turbo',
      transmission: 'CVT',
    },
  });

  const vehicle3 = await prisma.vehicle.upsert({
    where: { id: 'veh-003' },
    update: {},
    create: {
      id: 'veh-003',
      companyId: company1.id,
      customerId: customer3.id,
      year: 2022,
      make: 'Hyundai',
      model: 'Tucson',
      trim: 'SEL',
      color: 'Azul',
      vin: '5NMJFDAF1NH123456',
      licensePlate: 'GHI-789',
      mileage: 28000,
      engineType: '2.5L 4-Cyl',
      transmission: 'Automática 8-vel',
    },
  });

  // Sample Estimates
  const estimate1 = await prisma.estimate.upsert({
    where: { id: 'est-001' },
    update: {},
    create: {
      id: 'est-001',
      companyId: company1.id,
      estimateNumber: 'EST-2026-0001',
      customerId: customer1.id,
      vehicleId: vehicle1.id,
      status: 'APPROVED',
      description: 'Servicio de frenos delanteros completo',
      subtotal: 485.00,
      taxRate: 11.5,
      taxAmount: 40.25,
      total: 525.25,
      approvedDate: new Date('2026-02-18'),
    },
  });

  // Estimate items for estimate 1
  await prisma.estimateItem.createMany({
    data: [
      {
        id: 'item-001',
        estimateId: estimate1.id,
        type: 'PART',
        description: 'Pastillas de freno delanteras - Ceramic',
        partNumber: 'BC-1234',
        brand: 'Wagner',
        quantity: 1,
        unitPrice: 89.99,
        cost: 45.00,
        amount: 89.99,
        taxable: true,
        sortOrder: 1,
      },
      {
        id: 'item-002',
        estimateId: estimate1.id,
        type: 'PART',
        description: 'Discos de freno delanteros (par)',
        partNumber: 'RT-5678',
        brand: 'Raybestos',
        quantity: 1,
        unitPrice: 145.00,
        cost: 78.00,
        amount: 145.00,
        taxable: true,
        sortOrder: 2,
      },
      {
        id: 'item-003',
        estimateId: estimate1.id,
        type: 'LABOR',
        description: 'Mano de obra - Reemplazo de frenos',
        quantity: 1,
        unitPrice: 250.00,
        cost: 0,
        amount: 250.00,
        hours: 2.5,
        laborRate: 100.00,
        taxable: false,
        sortOrder: 3,
      },
    ],
  });

  // Work order for approved estimate
  await prisma.workOrder.upsert({
    where: { id: 'wo-001' },
    update: {},
    create: {
      id: 'wo-001',
      companyId: company1.id,
      workOrderNumber: 'WO-2026-0001',
      estimateId: estimate1.id,
      status: 'IN_PROGRESS',
      assignedTo: 'Miguel Torres',
      bay: 'Bahía 2',
      priority: 'NORMAL',
      startDate: new Date('2026-02-19'),
      estimatedCompletion: new Date('2026-02-20'),
    },
  });

  // Estimate 2 - Pending
  await prisma.estimate.upsert({
    where: { id: 'est-002' },
    update: {},
    create: {
      id: 'est-002',
      companyId: company1.id,
      estimateNumber: 'EST-2026-0002',
      customerId: customer2.id,
      vehicleId: vehicle2.id,
      status: 'SENT',
      description: 'Diagnóstico y reparación de A/C',
      subtotal: 750.00,
      taxRate: 11.5,
      taxAmount: 57.50,
      total: 807.50,
    },
  });

  await prisma.estimateItem.createMany({
    data: [
      {
        id: 'item-004',
        estimateId: 'est-002',
        type: 'PART',
        description: 'Compresor de A/C remanufacturado',
        partNumber: 'AC-9012',
        brand: 'Denso',
        quantity: 1,
        unitPrice: 350.00,
        cost: 180.00,
        amount: 350.00,
        taxable: true,
        sortOrder: 1,
      },
      {
        id: 'item-005',
        estimateId: 'est-002',
        type: 'PART',
        description: 'Refrigerante R-134a (2 latas)',
        partNumber: 'RF-3456',
        brand: 'Interdynamics',
        quantity: 2,
        unitPrice: 25.00,
        cost: 12.00,
        amount: 50.00,
        taxable: true,
        sortOrder: 2,
      },
      {
        id: 'item-006',
        estimateId: 'est-002',
        type: 'LABOR',
        description: 'Mano de obra - Reemplazo compresor A/C',
        quantity: 1,
        unitPrice: 350.00,
        cost: 0,
        amount: 350.00,
        hours: 4.0,
        laborRate: 87.50,
        taxable: false,
        sortOrder: 3,
      },
    ],
  });

  // Estimate 3 - Draft
  await prisma.estimate.upsert({
    where: { id: 'est-003' },
    update: {},
    create: {
      id: 'est-003',
      companyId: company1.id,
      estimateNumber: 'EST-2026-0003',
      customerId: customer3.id,
      vehicleId: vehicle3.id,
      status: 'DRAFT',
      description: 'Cambio de aceite y filtros + inspección',
      subtotal: 185.00,
      taxRate: 11.5,
      taxAmount: 8.05,
      total: 193.05,
    },
  });

  await prisma.estimateItem.createMany({
    data: [
      {
        id: 'item-007',
        estimateId: 'est-003',
        type: 'PART',
        description: 'Aceite sintético 5W-30 (5 qt)',
        partNumber: 'OIL-001',
        brand: 'Mobil 1',
        quantity: 1,
        unitPrice: 45.00,
        cost: 28.00,
        amount: 45.00,
        taxable: true,
        sortOrder: 1,
      },
      {
        id: 'item-008',
        estimateId: 'est-003',
        type: 'PART',
        description: 'Filtro de aceite',
        partNumber: 'FLT-002',
        brand: 'Wix',
        quantity: 1,
        unitPrice: 12.00,
        cost: 5.50,
        amount: 12.00,
        taxable: true,
        sortOrder: 2,
      },
      {
        id: 'item-009',
        estimateId: 'est-003',
        type: 'PART',
        description: 'Filtro de aire',
        partNumber: 'FLT-003',
        brand: 'Wix',
        quantity: 1,
        unitPrice: 28.00,
        cost: 14.00,
        amount: 28.00,
        taxable: true,
        sortOrder: 3,
      },
      {
        id: 'item-010',
        estimateId: 'est-003',
        type: 'LABOR',
        description: 'Mano de obra - Cambio aceite + inspección',
        quantity: 1,
        unitPrice: 100.00,
        cost: 0,
        amount: 100.00,
        hours: 1.0,
        laborRate: 100.00,
        taxable: false,
        sortOrder: 4,
      },
    ],
  });

  console.log('✅ Seed completed successfully!');
  console.log('   - 2 Empresas (AutoFix PR, Taller Rodríguez)');
  console.log('   - 2 Usuarios (admin@autofix.com / admin@rodriguez.com)');
  console.log('   - Contraseña: admin123');
  console.log('   - 3 Clientes (empresa AutoFix)');
  console.log('   - 3 Vehículos');
  console.log('   - 3 Estimados con líneas');
  console.log('   - 1 Orden de trabajo');
  console.log('   - Configuración del taller para cada empresa');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
