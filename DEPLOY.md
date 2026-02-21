# 🏗️ Guía de Despliegue — Hunter en Hostinger
## Subdominio: hunter.cdsrsolutions.com

---

## Paso 1: Crear el Subdominio en Hostinger

1. Entra a **hPanel** → https://hpanel.hostinger.com
2. Ve a **Dominios** → **Subdominios**
3. Crea: `hunter.cdsrsolutions.com`
4. Anota la **carpeta raíz** que se asigna (ej: `public_html/hunter`)

---

## Paso 2: Configurar Node.js en hPanel

1. En hPanel → **Avanzado** → **Node.js** (o busca "Node.js")
2. Clic en **"Crear nueva aplicación"**
3. Configura:
   - **Versión de Node.js**: `18.x` o superior
   - **Carpeta raíz de la aplicación**: `hunter` (o la carpeta donde subirás los archivos)
   - **Archivo de inicio**: `server.js`
   - **Puerto**: Se asigna automáticamente
4. **Variables de entorno** (agregar estas):
   ```
   NODE_ENV = production
   DATABASE_URL = file:./prisma/prod.db
   JWT_SECRET = (genera uno seguro, ej: openssl rand -base64 32)
   ```
5. Guarda la configuración

---

## Paso 3: Subir los Archivos

### Opción A: Usando el File Manager de hPanel

1. Primero, en tu PC, ejecuta este comando para crear el paquete de deploy:

   ```powershell
   cd c:\QuikStop
   
   # Crear carpeta de deploy
   mkdir deploy-hunter
   
   # Copiar standalone (incluye server.js, node_modules optimizados, .next)
   Copy-Item -Recurse .next\standalone\* deploy-hunter\
   
   # Copiar archivos estáticos de Next.js
   Copy-Item -Recurse .next\static deploy-hunter\.next\static
   
   # Copiar public (si existe)
   if (Test-Path public) { Copy-Item -Recurse public deploy-hunter\public }
   
   # Copiar Prisma schema (necesario para generar DB en producción)
   mkdir deploy-hunter\prisma
   Copy-Item prisma\schema.prisma deploy-hunter\prisma\
   Copy-Item prisma\seed.ts deploy-hunter\prisma\
   
   # Crear .env de producción
   Copy-Item .env.production deploy-hunter\.env
   
   # Comprimir
   Compress-Archive -Path deploy-hunter\* -DestinationPath hunter-deploy.zip -Force
   ```

2. En hPanel → **Archivos** → **Administrador de archivos**
3. Navega a la carpeta del subdominio (ej: `public_html/hunter` o la ruta asignada)
4. Sube el archivo `hunter-deploy.zip`
5. Extrae el ZIP en esa carpeta

### Opción B: Usando SSH (más rápido)

```bash
# Conectar por SSH (datos en hPanel → Acceso SSH)
ssh u123456789@hunter.cdsrsolutions.com -p 65002

# Ir a la carpeta
cd ~/hunter

# Clonar desde GitHub
git clone https://github.com/Cesars117/Hunter.git .

# Instalar dependencias
npm install --production

# Generar Prisma client
npx prisma generate

# Crear base de datos
npx prisma db push

# Crear datos iniciales
npx prisma db seed

# Build
npm run build

# Copiar standalone
cp -r .next/standalone/* .
cp -r .next/static .next/static
```

---

## Paso 4: Inicializar la Base de Datos

Si subiste los archivos por File Manager, necesitas ejecutar esto por SSH o por la terminal de Node.js en hPanel:

```bash
# En la carpeta de la app
npx prisma generate
npx prisma db push
npx prisma db seed
```

Esto creará la base de datos SQLite y los usuarios de prueba.

---

## Paso 5: Verificar el DNS

1. En hPanel → **Dominios** → **DNS / Nameservers**
2. Verifica que el subdominio `hunter` tenga un registro **A** o **CNAME** apuntando al servidor
3. Normalmente Hostinger lo configura automáticamente al crear el subdominio

---

## Paso 6: Activar SSL (HTTPS)

1. En hPanel → **Seguridad** → **SSL**
2. Instala SSL para `hunter.cdsrsolutions.com`
3. Hostinger ofrece SSL gratuito con Let's Encrypt

---

## Paso 7: Iniciar la Aplicación

1. En hPanel → **Node.js** → tu aplicación
2. Clic en **"Reiniciar"** o **"Iniciar"**
3. Visita: https://hunter.cdsrsolutions.com

---

## Credenciales de Prueba

| Empresa | Email | Contraseña |
|---------|-------|-----------|
| AutoFix PR | admin@autofix.com | admin123 |
| Taller Rodríguez | admin@rodriguez.com | admin123 |

---

## Estructura de Archivos en el Servidor

```
hunter/                    ← Carpeta raíz de la app
├── server.js              ← Archivo de inicio (Hostinger lo ejecuta)
├── .env                   ← Variables de entorno
├── .next/                 ← Build de Next.js
│   ├── server/
│   └── static/
├── node_modules/          ← Dependencias (las del standalone son mínimas)
├── prisma/
│   ├── schema.prisma
│   └── prod.db            ← Base de datos SQLite (se crea con db push)
├── package.json
└── public/                ← Archivos estáticos (favicon, etc.)
```

---

## Troubleshooting

### La app no inicia
- Revisa los **logs** en hPanel → Node.js → Logs
- Verifica que las variables de entorno estén correctas
- Asegúrate de que `server.js` sea el archivo de inicio

### Error de base de datos
- Verifica que `DATABASE_URL` apunte a `file:./prisma/prod.db`
- Ejecuta `npx prisma db push` para recrear la DB

### Error 503 / 502
- La app puede tardar unos segundos en iniciar
- Revisá el puerto asignado por Hostinger vs el que usa la app

### Cambiar contraseña del JWT_SECRET
- Genera uno seguro: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`
- Actualiza la variable en hPanel
- Reinicia la app
