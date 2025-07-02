#!/bin/bash

# Script de démarrage pour VelocitaLeads DEV
# Ports dédiés : Backend 3101, Frontend 3100

echo "🚀 Démarrage de VelocitaLeads DEV"
echo "📊 Backend API : Port 3101"
echo "🖥️  Frontend   : Port 3100"
echo ""

# Vérifier si les ports sont libres
if lsof -Pi :3101 -sTCP:LISTEN -t >/dev/null ; then
    echo "⚠️  Port 3101 (Backend) déjà utilisé"
    echo "   Processus actuel : $(lsof -Pi :3101 -sTCP:LISTEN | tail -1)"
    echo ""
fi

if lsof -Pi :3100 -sTCP:LISTEN -t >/dev/null ; then
    echo "⚠️  Port 3100 (Frontend) déjà utilisé" 
    echo "   Processus actuel : $(lsof -Pi :3100 -sTCP:LISTEN | tail -1)"
    echo ""
fi

echo "▶️  Démarrage du backend..."
npm run dev &
BACKEND_PID=$!

echo "▶️  Démarrage du frontend..."
cd client && npm run dev &
FRONTEND_PID=$!

echo ""
echo "✅ Services démarrés !"
echo "🔗 Backend  : http://69.62.110.246:3101"
echo "🔗 Frontend : http://69.62.110.246:3100"
echo ""
echo "Pour arrêter les services : Ctrl+C ou kill $BACKEND_PID $FRONTEND_PID"

# Attendre la fin des processus
wait