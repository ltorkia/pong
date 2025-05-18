FROM node:18-alpine

WORKDIR /app

# Install dependencies for both frontend and backend
COPY backend/package*.json ./backend/
COPY frontend/package*.json ./frontend/

RUN cd backend && npm install
RUN cd frontend && npm install

# Copy project files
COPY . .

# Build frontend
RUN cd frontend && npm run build

# Set environment variables
ENV NODE_ENV=production

# Expose ports
EXPOSE 3000 8080

# Start both services
CMD ["sh", "-c", "cd backend && npm start"]