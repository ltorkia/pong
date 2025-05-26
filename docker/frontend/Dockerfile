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
