# ./server/Dockerfile
FROM node:18

# Install build tools required for bcrypt and other native modules
RUN apt-get update && apt-get install -y python3 make g++ \
  && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies inside container
RUN npm install

# Copy application code
COPY . .

# Rebuild bcrypt for Linux environment
RUN npm rebuild bcrypt --build-from-source

# Expose your server port
EXPOSE 8080

# Start the app
CMD ["npm", "start"]
