#!/bin/bash

echo "📋 Récupération des logs Render..."
echo ""
echo "Pour voir les logs de debug, vous devez:"
echo "1. Aller sur https://dashboard.render.com"
echo "2. Sélectionner le service 'crm-intelligent'"
echo "3. Cliquer sur 'Logs'"
echo "4. Chercher les lignes commençant par [AUTH DEBUG]"
echo ""
echo "Les logs devraient montrer:"
echo "- [AUTH DEBUG] Login attempt for: romain.cano33@gmail.com"
echo "- [AUTH DEBUG] User found ou User NOT found"
echo "- [AUTH DEBUG] Password validation result"
echo ""
echo "Alternativement, testez directement avec curl pour voir la réponse complète:"

curl -X POST https://crm-intelligent.onrender.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"romain.cano33@gmail.com","password":"Temoignage2025!"}' \
  -v 2>&1 | grep -E "(< HTTP|< |{)"