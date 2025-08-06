#!/bin/bash
# Script de build pour Vercel

echo "=== Début du build Vercel ==="
echo "Répertoire actuel: $(pwd)"
echo "Contenu du répertoire:"
ls -la

if [ -d "client" ]; then
    echo "=== Le dossier client existe ==="
    cd client
    echo "Installation des dépendances du frontend..."
    npm install
    echo "Build du frontend..."
    npm run build
    echo "=== Build terminé avec succès ==="
else
    echo "ERREUR: Le dossier client n'existe pas!"
    echo "Contenu actuel:"
    ls -la
    exit 1
fi