# Switching from alpine to a Debian-based image (like bullseye-slim) for easier package installation
FROM node:20-bullseye

# Install osmium-tool (required for your extract_rivers.sh script) and jq using apt
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
        osmium-tool \
        jq \
        && \
    # Clean up apt cache to reduce image size
    rm -rf /var/lib/apt/lists/*

# Set the working directory inside the container
WORKDIR /app

# Copy package.json and package-lock.json (if available) to the working directory
COPY package*.json ./

# Install the project dependencies inside the container
RUN npm install

# Copy the rest of the application code to the working directory
COPY . .

# Expose the port your app runs on (adjust if your app uses a different port)
EXPOSE 3000

# Define the command to run your application
CMD [ "npm", "run", "dev" ] 

