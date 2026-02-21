#!/bin/bash
export PATH=/opt/alt/alt-nodejs20/root/usr/bin:$PATH
HUNTER_DIR=~/domains/cdsrsolutions.com/public_html/hunter
cd "$HUNTER_DIR"
echo "PWD: $(pwd)"
echo "=== Step 1: Create .env ==="
JWT=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
printf 'DATABASE_URL="file:./prisma/prod.db"\nJWT_SECRET="%s"\nNODE_ENV="production"\nPORT=3000\n' "$JWT" > .env
cat .env
echo "=== Step 2: Prisma Generate ==="
npx prisma generate 2>&1
echo "=== Step 3: DB Push ==="
npx prisma db push --accept-data-loss 2>&1
echo "=== Step 4: Seed ==="
npx prisma db seed 2>&1
echo "=== Step 5: Build ==="
npm run build 2>&1
echo "=== DONE ==="