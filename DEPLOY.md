# Hunter - Despliegue en Hostinger
## Subdominio: hunter.cdsrsolutions.com

---

## LO QUE YA ESTA LISTO (Automatico)

- [x] Build de produccion (standalone)
- [x] Script de instalacion automatica (`setup.sh`)
- [x] Paquete de deploy (`hunter-deploy.zip` - 12.9 MB)
- [x] Configuracion de .htaccess
- [x] GitHub actualizado

---

## LO QUE TIENES QUE HACER TU (Manual - 5 pasos)

### Paso 1: Crear Subdominio (2 min)
1. Entra a **hPanel**: https://hpanel.hostinger.com
2. Selecciona tu plan con el dominio `cdsrsolutions.com`
3. Ve a **Dominios** -> **Subdominios**
4. Escribe `hunter` y crea el subdominio
5. **Anota la carpeta** que te asigna (ej: `public_html/hunter` o `domains/hunter.cdsrsolutions.com/public_html`)

### Paso 2: Configurar Node.js App (3 min)
1. En hPanel -> **Avanzado** -> **Node.js**
2. Clic en **"Crear nueva aplicacion"**
3. Configura:
   | Campo | Valor |
   |-------|-------|
   | **Version Node.js** | `18.x` o superior |
   | **Carpeta raiz** | La carpeta del paso 1 (ej: `hunter`) |
   | **Archivo de inicio** | `server.js` |
4. **NO inicies la app todavia**

### Paso 3: Subir Archivos (5 min)

#### Opcion A — Por SSH (recomendada, mas rapida):
```bash
# 1. Conectar por SSH (datos de acceso en hPanel -> Acceso SSH)
ssh tu-usuario@tu-servidor.hostinger.com -p 65002

# 2. Ir a la carpeta del subdominio
cd ~/domains/hunter.cdsrsolutions.com/public_html
# O la ruta que mostro el paso 1

# 3. Clonar el repo
git clone https://github.com/Cesars117/Hunter.git .

# 4. EJECUTAR SCRIPT AUTOMATICO (hace todo: instala, compila, crea DB)
bash setup.sh
```
**Listo!** El script hace TODO automaticamente.

#### Opcion B — Por File Manager (si no tienes SSH):
1. En hPanel -> **Archivos** -> **Administrador de archivos**
2. Navega a la carpeta del subdominio
3. Sube `hunter-deploy.zip` (esta en `c:\QuikStop\hunter-deploy.zip`)
4. Haz clic derecho en el ZIP -> **Extraer**
5. Abre la **Terminal** de hPanel (o SSH) y ejecuta:
   ```bash
   cd ~/domains/hunter.cdsrsolutions.com/public_html
   bash setup.sh
   ```

### Paso 4: SSL (1 min)
1. En hPanel -> **Seguridad** -> **SSL**
2. Instala certificado SSL para `hunter.cdsrsolutions.com`
3. Hostinger ofrece **Let's Encrypt gratis**

### Paso 5: Iniciar App (30 seg)
1. En hPanel -> **Avanzado** -> **Node.js**
2. Clic **"Reiniciar"** en tu aplicacion
3. Espera 30 segundos
4. Abre: **https://hunter.cdsrsolutions.com**

---

## Credenciales de Prueba

| Empresa | Email | Contrasena |
|---------|-------|-----------|
| AutoFix PR | `admin@autofix.com` | `admin123` |
| Taller Rodriguez | `admin@rodriguez.com` | `admin123` |

---

## Si algo no funciona

| Problema | Solucion |
|----------|----------|
| App no inicia | hPanel -> Node.js -> ver **Logs** |
| Error 503/502 | Espera 1 min, la app tarda en arrancar |
| Error de DB | SSH -> `cd carpeta-app` -> `npx prisma db push` |
| Pagina en blanco | Verifica que `server.js` sea el archivo de inicio |
| SSL no funciona | Espera 15 min, Let's Encrypt tarda en propagarse |

---

## Notas Importantes

- **Base de datos**: SQLite (se guarda en `prisma/prod.db` dentro de tu servidor)
- **Backups**: Descarga periodicamente el archivo `prisma/prod.db`
- **Actualizar**: SSH -> `cd carpeta-app` -> `git pull` -> `bash setup.sh`
- **JWT_SECRET**: El script `setup.sh` genera uno automaticamente
