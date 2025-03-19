#!/bin/bash

# Script to prepare and deploy the USOSA Alumni Platform

echo "Starting deployment process for USOSA Alumni Platform..."

# Create deployment directory if it doesn't exist
mkdir -p /home/ubuntu/usosa-alumni-platform/deployment

# Copy frontend and backend files to deployment directory
echo "Copying project files to deployment directory..."
cp -r /home/ubuntu/usosa-alumni-platform/frontend /home/ubuntu/usosa-alumni-platform/deployment/
cp -r /home/ubuntu/usosa-alumni-platform/backend /home/ubuntu/usosa-alumni-platform/deployment/

# Install dependencies for backend
echo "Installing backend dependencies..."
cd /home/ubuntu/usosa-alumni-platform/deployment/backend
npm install

# Install dependencies for frontend
echo "Installing frontend dependencies..."
cd /home/ubuntu/usosa-alumni-platform/deployment/frontend
npm install

# Build frontend
echo "Building frontend..."
npm run build

# Create .env file for backend
echo "Creating environment configuration for backend..."
cat > /home/ubuntu/usosa-alumni-platform/deployment/backend/.env << EOL
PORT=5000
MONGODB_URI=mongodb://localhost:27017/usosa_alumni
JWT_SECRET=usosa_secret_key_for_development
NODE_ENV=production
EOL

# Create a simple MongoDB setup script
echo "Creating MongoDB setup script..."
cat > /home/ubuntu/usosa-alumni-platform/deployment/setup_mongodb.js << EOL
// This script initializes the MongoDB database with initial data
db = db.getSiblingDB('usosa_alumni');

// Create collections
db.createCollection('users');
db.createCollection('profiles');
db.createCollection('schools');
db.createCollection('forums');
db.createCollection('topics');
db.createCollection('posts');
db.createCollection('events');

// Insert initial admin user
db.users.insertOne({
  email: 'admin@usosa.org',
  password: '$2a$10$XFE0rQyZ5GFIgbXHCQlqIeOu0WnjB3fABD0mSi0ftmVTPUZMDkbi6', // hashed 'admin123'
  firstName: 'USOSA',
  lastName: 'Admin',
  role: 'admin',
  isVerified: true,
  createdAt: new Date(),
  updatedAt: new Date()
});

// Insert initial schools
db.schools.insertMany([
  {
    name: 'Federal Government College, Buni-Yadi',
    shortName: 'FGC Buni-Yadi',
    region: 'North East',
    state: 'Yobe',
    established: 1970,
    type: 'Mixed',
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    name: 'Federal Government Girls College, Potiskum',
    shortName: 'FGGC Potiskum',
    region: 'North East',
    state: 'Yobe',
    established: 1972,
    type: 'Girls',
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    name: 'King\'s College, Lagos',
    shortName: 'KC Lagos',
    region: 'South West',
    state: 'Lagos',
    established: 1909,
    type: 'Boys',
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    name: 'Queen\'s College, Lagos',
    shortName: 'QC Lagos',
    region: 'South West',
    state: 'Lagos',
    established: 1927,
    type: 'Girls',
    createdAt: new Date(),
    updatedAt: new Date()
  }
]);

// Create general USOSA forum
db.forums.insertOne({
  name: 'USOSA General Forum',
  description: 'General discussion forum for all USOSA alumni',
  isSchoolSpecific: false,
  createdAt: new Date(),
  updatedAt: new Date()
});

console.log('Database initialization completed successfully');
EOL

# Create start script
echo "Creating start script..."
cat > /home/ubuntu/usosa-alumni-platform/deployment/start.sh << EOL
#!/bin/bash

# Start MongoDB (assuming it's installed)
echo "Starting MongoDB..."
sudo systemctl start mongod || echo "MongoDB service not found, please install MongoDB"

# Initialize database if needed
echo "Initializing database..."
mongo /home/ubuntu/usosa-alumni-platform/deployment/setup_mongodb.js

# Start backend server
echo "Starting backend server..."
cd /home/ubuntu/usosa-alumni-platform/deployment/backend
npm start &

# Start frontend server
echo "Starting frontend server..."
cd /home/ubuntu/usosa-alumni-platform/deployment/frontend
npm start
EOL

# Make start script executable
chmod +x /home/ubuntu/usosa-alumni-platform/deployment/start.sh

echo "Deployment preparation completed successfully!"
echo "To start the application, run: ./usosa-alumni-platform/deployment/start.sh"
