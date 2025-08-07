#!/bin/bash

# Script de monitoring pour l'authentification CRM
# À exécuter régulièrement pour détecter les problèmes

LOG_FILE="/var/www/CRM/crm-intelligent/auth-monitor.log"
ALERT_EMAIL="romain.cano33@gmail.com"

# Fonction de log
log_message() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" >> "$LOG_FILE"
    echo "$1"
}

# Fonction d'alerte
send_alert() {
    local message="$1"
    log_message "ALERT: $message"
    
    # Envoyer un email d'alerte (si configuré)
    # echo "$message" | mail -s "CRM Auth Alert" "$ALERT_EMAIL"
}

# Vérifier l'état de l'authentification
check_auth() {
    log_message "Starting authentication check..."
    
    # Exécuter le test
    output=$(node /var/www/CRM/crm-intelligent/test-auth.js 2>&1)
    exit_code=$?
    
    if [ $exit_code -eq 0 ]; then
        log_message "✓ All authentication tests passed"
    else
        send_alert "Authentication tests failed! Check the logs."
        echo "$output" >> "$LOG_FILE"
        
        # Tenter de corriger automatiquement
        log_message "Attempting auto-fix..."
        fix_output=$(node /var/www/CRM/crm-intelligent/test-auth.js --fix 2>&1)
        
        if [ $? -eq 0 ]; then
            log_message "✓ Auto-fix successful"
        else
            send_alert "Auto-fix failed! Manual intervention required."
        fi
    fi
}

# Vérifier la connexion à la base de données
check_database() {
    log_message "Checking database connection..."
    
    # Test de connexion simple
    node -e "
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();
    prisma.user.count()
        .then(count => {
            console.log('Database OK: ' + count + ' users');
            process.exit(0);
        })
        .catch(err => {
            console.error('Database Error: ' + err.message);
            process.exit(1);
        });
    " 2>&1
    
    if [ $? -eq 0 ]; then
        log_message "✓ Database connection OK"
    else
        send_alert "Database connection failed!"
    fi
}

# Fonction principale
main() {
    echo "=== CRM Authentication Monitor ==="
    echo "Time: $(date)"
    echo ""
    
    # Vérifications
    check_database
    check_auth
    
    # Nettoyer les vieux logs (garder 30 jours)
    if [ -f "$LOG_FILE" ]; then
        temp_file=$(mktemp)
        tail -n 10000 "$LOG_FILE" > "$temp_file"
        mv "$temp_file" "$LOG_FILE"
    fi
    
    echo ""
    echo "Monitor check complete. Logs saved to: $LOG_FILE"
}

# Exécuter
main