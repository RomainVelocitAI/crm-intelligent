FROM node:18-alpine

# Installer les dépendances système nécessaires
RUN apk add --no-cache \
    chromium \
    nss \
    freetype \
    freetype-dev \
    harfbuzz \
    ca-certificates \
    ttf-freefont \
    openssl \
    openssl-dev \
    libc6-compat \
    && rm -rf /var/cache/apk/*

# Configurer Puppeteer pour utiliser Chromium installé
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser

# Créer le répertoire de l'application
WORKDIR /app

# Copier les fichiers de configuration
COPY package*.json ./
COPY tsconfig.json ./
COPY prisma ./prisma/

# Installer TOUTES les dépendances (dev incluses pour tsx)
RUN npm ci

# Copier le code source
COPY . .

# Générer le client Prisma
RUN npx prisma generate

# Créer les dossiers nécessaires
RUN mkdir -p uploads/pdfs logs

# Exposer le port
EXPOSE 80

# Commande de démarrage en mode développement avec tsx
CMD ["npm", "run", "dev"]