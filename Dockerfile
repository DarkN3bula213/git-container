# Use an official Node.js runtime as a parent image
FROM node:20.10.0

# Set the working directory in the container
WORKDIR /usr/src/app

# Copy package.json and pnpm-lock.yaml (or package-lock.json if you use npm) files
COPY package*.json pnpm-lock.yaml ./

# Install dependencies
RUN npm install -g pnpm && pnpm install

# Copy the rest of your application's code
COPY . .

# Build your TypeScript application
RUN pnpm build

# Your application binds to port 3000, so you'll use the EXPOSE instruction to have it mapped by the docker daemon
EXPOSE ${PORT}

# Define command to run the application
CMD [ "node", "dist/index.js" ]
