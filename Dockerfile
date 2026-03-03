# Use Node.js LTS version
FROM node:25.7

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --omit=dev

# Copy application files
COPY src/ ./src/
COPY public/ ./public/

# Expose the game port
EXPOSE 3333

# Start the server
CMD ["node", "src/server/server.js"]
