# FROM node:20

# WORKDIR /app

# COPY package*.json ./
# # RUN npm install
# RUN npm install --include=dev
# RUN npm install -D ts-node typescript

# COPY . .

# EXPOSE 3000
# CMD ["npm", "run", "dev"]

FROM node:20

# Crée le dossier de travail
WORKDIR /app

# Copie les fichiers de dépendances
COPY package*.json ./

# Installe toutes les dépendances, y compris ts-node et typescript
RUN npm install --save-dev ts-node typescript
RUN npm install --include=dev

# Si jamais ts-node n'est pas listé dans package.json (facultatif mais sûr)
RUN npm install -D ts-node typescript

# Copie le reste du projet
COPY . .

# Ouvre le port utilisé par ton backend
EXPOSE 8080

# Lance le serveur en développement (assume que tu as un script "dev" dans package.json)
CMD ["npm", "run", "dev"]
