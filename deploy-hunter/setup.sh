#!/bin/bash
# ============================================
# Hunter - Script de Instalación Automática
# Para Hostinger (Shared Hosting con Node.js)
# ============================================
# USO: bash setup.sh
# Este script hace TODO automáticamente:
#   1. Genera un JWT_SECRET seguro
#   2. Crea el archivo .env de producción
#   3. Instala dependencias
#   4. Genera el cliente Prisma
#   5. Crea la base de datos
#   6. Siembra datos iniciales
#   7. Compila la aplicación
#   8. Prepara el standalone
# ============================================

set -e  # Detener si hay error

echo ""
echo "🔧 ============================================"
echo "🔧  Hunter - Instalación Automática"
echo "🔧  Sistema de Gestión de Taller Mecánico"
echo "🔧 ============================================"
echo ""

# Detectar directorio actual
APP_DIR=$(pwd)
echo "📂 Directorio: $APP_DIR"
echo ""

# ─── PASO 1: Generar JWT_SECRET ─────────────────────
echo "🔑 Paso 1/7: Generando JWT_SECRET seguro..."
JWT_SECRET=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
echo "   ✅ JWT_SECRET generado"

# ─── PASO 2: Crear .env ─────────────────────────────
echo "📝 Paso 2/7: Creando archivo .env..."
cat > .env << EOF
# Hunter - Producción
DATABASE_URL="file:./prisma/prod.db"
JWT_SECRET="${JWT_SECRET}"
NODE_ENV="production"
PORT=3000
EOF
echo "   ✅ .env creado"

# ─── PASO 3: Instalar dependencias ──────────────────
echo "📦 Paso 3/7: Instalando dependencias..."
npm install 2>&1 | tail -3
echo "   ✅ Dependencias instaladas"

# ─── PASO 4: Generar Prisma Client ──────────────────
echo "🔧 Paso 4/7: Generando Prisma Client..."
npx prisma generate 2>&1 | tail -3
echo "   ✅ Prisma Client generado"

# ─── PASO 5: Crear Base de Datos ────────────────────
echo "🗄️  Paso 5/7: Creando base de datos..."
npx prisma db push --accept-data-loss 2>&1 | tail -5
echo "   ✅ Base de datos creada"

# ─── PASO 6: Sembrar datos iniciales ────────────────
echo "🌱 Paso 6/7: Sembrando datos iniciales..."
npx prisma db seed 2>&1 | tail -5
echo "   ✅ Datos iniciales creados"

# ─── PASO 7: Compilar la aplicación ─────────────────
echo "🏗️  Paso 7/7: Compilando aplicación (esto tarda ~2 min)..."
npm run build 2>&1 | tail -10
echo "   ✅ Aplicación compilada"

# ─── PREPARAR STANDALONE ────────────────────────────
echo "📋 Preparando standalone..."
if [ -d ".next/standalone" ]; then
  # Copiar estáticos al standalone
  cp -r .next/static .next/standalone/.next/static 2>/dev/null || true
  [ -d "public" ] && cp -r public .next/standalone/public 2>/dev/null || true
  # Copiar .env al standalone
  cp .env .next/standalone/.env 2>/dev/null || true
  # Copiar prisma y db al standalone
  mkdir -p .next/standalone/prisma
  cp prisma/schema.prisma .next/standalone/prisma/ 2>/dev/null || true
  [ -f "prisma/prod.db" ] && cp prisma/prod.db .next/standalone/prisma/ 2>/dev/null || true
  echo "   ✅ Standalone preparado"
fi

echo ""
echo "🎉 ============================================"
echo "🎉  ¡Instalación completada exitosamente!"
echo "🎉 ============================================"
echo ""
echo "📌 Credenciales de prueba:"
echo "   Empresa 1: admin@autofix.com / admin123"
echo "   Empresa 2: admin@rodriguez.com / admin123"
echo ""
echo "📌 Próximos pasos:"
echo "   1. En hPanel → Node.js, configura:"
echo "      - Archivo de inicio: server.js"
echo "      - Reinicia la aplicación"
echo "   2. Visita: https://hunter.cdsrsolutions.com"
echo ""
