# Use official Node.js image
FROM node:18

# Set working directory
WORKDIR /app

# Copy package.json and install dependencies
COPY package*.json ./
RUN npm install

# Copy backend code
COPY . .

# Expose backend port
EXPOSE 3002

# Start server
CMD ["node", "server.js"]
