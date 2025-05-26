FROM node:20

# Crée le dossier de travail
WORKDIR /app

# Copier package.json pour installer les dépendances
COPY package*.json ./

# Installer les dependances
RUN npm install

# Copier le reste du code
COPY . .

# Ouvre le port utilisé par le backend
EXPOSE 8080

# Lance le serveur en développement avec le script "dev" dans package.json
CMD ["npm", "run", "dev"]
