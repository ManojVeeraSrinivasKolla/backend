
FROM node:20-alpine

# Set the working directory inside the container
WORKDIR /app

# Copy the package.json and package-lock.json first to take advantage of Docker's cache
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the application code (including dist or build folder) into the container
# Make sure the dist folder is generated before this step in your build process
COPY . .

# Build the project (this step is required if you need to generate the dist folder)
RUN npm run build

# Expose the port your app will run on
EXPOSE 8000

# Set environment variables (these can also be set at runtime using -e flags in the `docker run` command)
# If you are using GitHub secrets, they will be passed during the GitHub Actions workflow.
ENV PORT=8000
ENV MONGO_URI=${DB_URL}
ENV JWT_SECRET=${JWT_SECRET}
ENV CLOUDINARY_API_KEY=${CLOUDINARY_API_KEY}
ENV CLOUDINARY_NAME=${CLOUDINARY_NAME}
ENV CLOUDINARY_SECRET_KEY=${CLOUDINARY_SECRET_KEY}


# Command to run your app inside the container (this assumes your built app is in dist/)
CMD ["node", "dist/index.js"]