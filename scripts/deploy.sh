#!/bin/bash

echo "🚀 Iniciando deploy de Credit to Show Bunge..."

# Verificar que estamos en el directorio correcto
if [ ! -f "package.json" ]; then
    echo "❌ Error: No se encontró package.json. Asegúrate de estar en el directorio del proyecto."
    exit 1
fi

# Instalar dependencias si no están instaladas
if [ ! -d "node_modules" ]; then
    echo "📦 Instalando dependencias..."
    pnpm install
fi

# Build del proyecto
echo "🔨 Construyendo proyecto..."
pnpm build

# Verificar que el build fue exitoso
if [ $? -eq 0 ]; then
    echo "✅ Build exitoso!"
    
    # Commit y push automático
    echo "📝 Haciendo commit de cambios..."
    git add .
    git commit -m "Deploy: $(date '+%Y-%m-%d %H:%M:%S')"
    
    echo "🚀 Subiendo a GitHub..."
    git push origin main
    
    echo "🎉 ¡Deploy iniciado! Revisa Vercel para el progreso."
    echo "🔗 Repositorio: https://github.com/Mica14-AgCode/credit-to-show-bunge"
else
    echo "❌ Error en el build. Revisa los errores arriba."
    exit 1
fi 