# Dockerfile
# Use a stable Node.js image
FROM node:18-alpine

# Set working directory inside the container
WORKDIR /usr/src/app

# Copy package files and install dependencies. This benefits from Docker layer caching.
COPY package*.json ./
RUN npm install

# Copy the rest of the application source code (contracts, tests, config)
COPY . .

# Compile contracts
RUN npx hardhat compile

# Command to run the test suite when the container starts
CMD ["npx", "hardhat", "test"]