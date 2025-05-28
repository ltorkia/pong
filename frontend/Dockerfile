<<<<<<< HEAD
FROM node:18-alpine

WORKDIR /app

# Copier les fichiers de dépendances
COPY package*.json ./

# Installer les dépendances
RUN npm install

# Copier le code source
COPY . .

# Exposer le port
EXPOSE 3000

# Commande de développement avec Vite
CMD ["npm", "run", "dev"]
=======
FROM node:20

WORKDIR /app

COPY package*.json ./
# RUN npm install
RUN npm install --include=dev
# RUN npm install -D ts-node typescript
# RUN npm install -D vite


COPY . .

EXPOSE 3000
CMD ["npm", "run", "dev"]
>>>>>>> ea02d3285ab3c4f4406851940a619b38e3e33aa8
