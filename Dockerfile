# Use the latest Node.js version for development
FROM node:20-alpine AS dev

# Set the working directory
WORKDIR /app

# Copy package.json and package-lock.json to install dependencies
COPY package*.json ./

# Install all dependencies (including devDependencies)
RUN npm install

# Copy the source code to the working directory
COPY . .

# Expose the port the app runs on (usually 3000 for NestJS)
EXPOSE 5000

# Start the app in development mode with hot-reloading
CMD ["npm", "run", "start:dev"]
