# USOSA Alumni Platform Deployment Guide

This document provides instructions for deploying and running the USOSA Alumni Platform.

## System Requirements

- Node.js (v14 or higher)
- MongoDB (v4.4 or higher)
- npm (v6 or higher)

## Deployment Steps

1. **Clone the repository**
   ```
   git clone https://github.com/your-organization/usosa-alumni-platform.git
   cd usosa-alumni-platform
   ```

2. **Run the deployment script**
   ```
   ./deploy.sh
   ```
   This script will:
   - Copy project files to the deployment directory
   - Install dependencies for both frontend and backend
   - Build the frontend application
   - Create necessary configuration files
   - Set up the MongoDB database with initial data

3. **Start the application**
   ```
   ./deployment/start.sh
   ```
   This will start both the backend server and frontend application.

## Default Admin Credentials

After deployment, you can log in with the following admin credentials:

- **Email**: admin@usosa.org
- **Password**: admin123

It is highly recommended to change these credentials after the first login.

## Application Structure

The USOSA Alumni Platform consists of two main components:

### Backend (Node.js/Express/MongoDB)
- API server running on port 5000
- RESTful endpoints for all platform features
- JWT-based authentication
- MongoDB database for data storage

### Frontend (Next.js)
- Modern React-based user interface
- Responsive design for desktop and mobile
- Server-side rendering for improved performance
- Client-side routing for smooth navigation

## Features

1. **User Registration & Profiles**
   - Alumni can create profiles with details like name, school, year of graduation, and profession
   - Profile verification system to maintain authenticity

2. **School-Based Directories**
   - Alumni are grouped by their respective schools for easy networking
   - Advanced search to find alumni based on name, school, profession, or location

3. **Discussion Forums**
   - Dedicated forums for each Unity School to facilitate discussions
   - General USOSA forum for inter-school collaboration
   - Admin/moderation tools to manage discussions

4. **Event Management System**
   - Centralized calendar for reunions, seminars, and networking events
   - Online event registration & RSVP system
   - Automated reminders and notifications

5. **Admin Dashboard**
   - Comprehensive admin interface for managing the platform
   - School management functionality to add and edit schools
   - User management and moderation tools

## Customization

The application can be customized by modifying the following files:

- **Backend Configuration**: `/deployment/backend/.env`
- **Frontend Configuration**: `/deployment/frontend/.env.local`

## Troubleshooting

If you encounter any issues during deployment:

1. Check MongoDB is running: `sudo systemctl status mongod`
2. Verify backend is running: `curl http://localhost:5000/api/health`
3. Check frontend build logs: `/deployment/frontend/.next/build-logs`

For additional support, please contact the development team.
