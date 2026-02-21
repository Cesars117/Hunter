import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

// GET /api/setup - Auto-initialize database (no auth required)
// Visit https://hunter.cdsrsolutions.com/api/setup to initialize
export const dynamic = 'force-dynamic';

// Secret key to prevent unauthorized setup - can be changed
const SETUP_KEY = 'hunter2024';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const key = url.searchParams.get('key');

  // Show setup form if no key provided
  if (!key) {
    return new NextResponse(
      `<!DOCTYPE html>
<html>
<head><title>Hunter Setup</title>
<style>
  body { font-family: system-ui; max-width: 600px; margin: 50px auto; padding: 20px; background: #f8f9fa; }
  .card { background: white; border-radius: 12px; padding: 30px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
  h1 { color: #1e40af; margin-top: 0; }
  .btn { background: #2563eb; color: white; border: none; padding: 12px 24px; border-radius: 8px; font-size: 16px; cursor: pointer; text-decoration: none; display: inline-block; }
  .btn:hover { background: #1d4ed8; }
  .info { background: #dbeafe; padding: 15px; border-radius: 8px; margin: 15px 0; }
  .warn { background: #fef3c7; padding: 15px; border-radius: 8px; margin: 15px 0; }
</style>
</head>
<body>
<div class="card">
  <h1>🔧 Hunter - Setup</h1>
  <p>Este endpoint inicializa la base de datos con empresas y usuarios de prueba.</p>
  <div class="info">
    <strong>Credenciales que se crearán:</strong><br>
    📧 admin@autofix.com / admin123 (AutoFix PR)<br>
    📧 admin@rodriguez.com / admin123 (Taller Rodríguez)<br>
    📧 admin@sacket.com / admin123 (Sacket Prestige)<br>
    🔑 admin@cdsrsolutions.com / admin123 (SUPER ADMIN)
  </div>
  <div class="warn">
    ⚠️ Solo ejecuta esto una vez. Si ya tienes datos, no los sobrescribirá (usa upsert).
  </div>
  <br>
  <a class="btn" href="/api/setup?key=${SETUP_KEY}">▶️ Inicializar Base de Datos</a>
</div>
</body>
</html>`,
      {
        status: 200,
        headers: { 'Content-Type': 'text/html; charset=utf-8' },
      }
    );
  }

  if (key !== SETUP_KEY) {
    return NextResponse.json({ error: 'Clave incorrecta' }, { status: 403 });
  }

  const logs: string[] = [];
  const log = (msg: string) => {
    logs.push(msg);
    console.log(msg);
  };

  const prisma = new PrismaClient();

  try {
    log('🔧 Iniciando setup de Hunter...');

    // Test database connection
    log('📡 Probando conexión a base de datos...');
    try {
      // This will fail if tables don't exist, which is expected
      await prisma.$queryRaw`SELECT 1`;
      log('✅ Conexión a base de datos OK');
    } catch (dbError: unknown) {
      const msg = dbError instanceof Error ? dbError.message : String(dbError);
      log(`❌ Error de base de datos: ${msg}`);
      log('💡 Necesitas ejecutar "npx prisma db push" primero para crear las tablas.');
      return NextResponse.json(
        {
          ok: false,
          error: 'Base de datos no inicializada. Ejecuta: npx prisma db push',
          logs,
        },
        { status: 503 }
      );
    }

    // Check if tables exist by trying to count
    let tablesExist = true;
    try {
      await prisma.company.count();
    } catch {
      tablesExist = false;
      log('⚠️ Las tablas no existen todavía');
      log('💡 Necesitas ejecutar "npx prisma db push" primero');
      return NextResponse.json(
        {
          ok: false,
          error: 'Tablas no creadas. Ejecuta: npx prisma db push',
          logs,
        },
        { status: 503 }
      );
    }

    if (tablesExist) {
      log('✅ Tablas encontradas');
    }

    // ─── SEED DATA ─────────────────────────────────
    log('🌱 Sembrando datos...');

    // Companies
    log('  📋 Creando empresas...');
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
    log(`  ✅ Empresas: ${company1.name}, ${company2.name}`);

    // Sacket Prestige
    const company3 = await prisma.company.upsert({
      where: { id: 'comp-003' },
      update: {},
      create: {
        id: 'comp-003',
        name: 'Sacket Prestige',
        slug: 'sacket-prestige',
      },
    });

    // CDS Solutions (system)
    const companySys = await prisma.company.upsert({
      where: { id: 'comp-system' },
      update: {},
      create: {
        id: 'comp-system',
        name: 'CDS Solutions',
        slug: 'cds-solutions',
      },
    });
    log(`  ✅ + Sacket Prestige, CDS Solutions`);

    // Users
    log('  👤 Creando usuarios...');
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

    // Sacket admin
    await prisma.user.upsert({
      where: { id: 'user-003' },
      update: {},
      create: {
        id: 'user-003',
        companyId: company3.id,
        email: 'admin@sacket.com',
        password: hashedPassword,
        name: 'Sacket Admin',
        role: 'ADMIN',
      },
    });

    // SUPER ADMIN
    await prisma.user.upsert({
      where: { id: 'user-super' },
      update: {},
      create: {
        id: 'user-super',
        companyId: companySys.id,
        email: 'admin@cdsrsolutions.com',
        password: hashedPassword,
        name: 'Super Admin',
        role: 'SUPER_ADMIN',
      },
    });
    log('  ✅ Usuarios creados (incluye Sacket + Super Admin)');

    // Shop Settings
    log('  ⚙️ Creando configuración...');
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

    await prisma.shopSettings.upsert({
      where: { companyId: company3.id },
      update: {},
      create: {
        companyId: company3.id,
        shopName: 'Sacket Prestige',
        address: '100 Prestige Blvd',
        city: 'San Juan',
        state: 'PR',
        zipCode: '00907',
        phone: '(787) 555-0300',
        email: 'info@sacket.com',
        taxRate: 11.5,
        laborRate: 95.0,
      },
    });

    await prisma.shopSettings.upsert({
      where: { companyId: companySys.id },
      update: {},
      create: {
        companyId: companySys.id,
        shopName: 'CDS Solutions',
        email: 'admin@cdsrsolutions.com',
      },
    });
    log('  ✅ Configuración creada');

    // Final counts
    const counts = {
      companies: await prisma.company.count(),
      users: await prisma.user.count(),
      customers: await prisma.customer.count(),
      settings: await prisma.shopSettings.count(),
    };

    log('');
    log('🎉 ¡Setup completado exitosamente!');
    log(`📊 Empresas: ${counts.companies}, Usuarios: ${counts.users}, Clientes: ${counts.customers}`);
    log('');
    log('📧 Credenciales:');
    log('   admin@autofix.com / admin123');
    log('   admin@rodriguez.com / admin123');
    log('   admin@sacket.com / admin123');
    log('   🔑 admin@cdsrsolutions.com / admin123 (SUPER_ADMIN)');

    await prisma.$disconnect();

    return NextResponse.json({
      ok: true,
      message: '¡Setup completado!',
      counts,
      credentials: [
        { email: 'admin@autofix.com', password: 'admin123', company: 'AutoFix PR' },
        { email: 'admin@rodriguez.com', password: 'admin123', company: 'Taller Rodríguez' },
        { email: 'admin@sacket.com', password: 'admin123', company: 'Sacket Prestige' },
        { email: 'admin@cdsrsolutions.com', password: 'admin123', company: 'CDS Solutions', role: 'SUPER_ADMIN' },
      ],
      logs,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    log(`❌ Error: ${message}`);
    await prisma.$disconnect();
    return NextResponse.json(
      { ok: false, error: message, logs },
      { status: 500 }
    );
  }
}
