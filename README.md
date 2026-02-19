# YouTube Clone - MERN Stack

A full-stack YouTube clone built with MongoDB, Express, React, and Node.js (MERN Stack).

## Features

### Frontend (React)
- **Home Page**: YouTube header, sidebar with toggle, filter buttons, and video grid
- **User Authentication**: Register and login with JWT-based authentication
- **Search & Filter**: Search by title, filter by category (10+ categories)
- **Video Player**: Video playback, like/dislike buttons, comment section with CRUD
- **Channel Page**: Create channel, upload/edit/delete videos
- **Responsive Design**: Works on desktop, tablet, and mobile

### Backend (Node.js/Express)
- RESTful API endpoints for:
  - User authentication (register, login, JWT)
  - Video management (CRUD operations)
  - Channel management (create, read, update, delete)
  - Comments (add, edit, delete)
- MongoDB database with Mongoose ODM
- JWT-based authentication with protected routes

## Tech Stack

### Frontend
- React 18 with Vite
- React Router DOM for navigation
- Axios for API calls
- CSS for styling

### Backend
- Node.js with Express.js
- MongoDB with Mongoose
- JSON Web Token (JWT) for authentication
- bcryptjs for password hashing

## ⚠️ IMPORTANT: Installation Steps

**DO NOT forget to install dependencies!**

```bash
# 1. Navigate to the project folder
cd youtube-clone

# 2. Install backend dependencies (REQUIRED!)
cd server
npm install

# 3. Install frontend dependencies (REQUIRED!)
cd ../client
npm install
```

### Why npm install is required:
- The project files don't include node_modules (they're in .gitignore)
- You must run `npm install` to download all required packages
- Without this, you'll get "Cannot find package 'express'" errors

## Running the Application

### Prerequisites
- Node.js (v18+)
- MongoDB (local or Atlas) - Optional for demo mode

### Step 1: Install Dependencies
```bash
# Backend
cd server
npm install

# Frontend  
cd ../client
npm install
```

### Step 2: Configure Environment

Update `server/.env` with your MongoDB connection:
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/youtube-clone
JWT_SECRET=youtubesecretkey123
```

### Step 3: Start the Application

**Terminal 1 - Backend:**
```bash
cd server
npm start
```
Server runs on http://localhost:5000

**Terminal 2 - Frontend:**
```bash
cd client
npm run dev
```
Client runs on http://localhost:3000

### Step 4: Open in Browser
Go to **http://localhost:3000**

## Demo Mode

The application includes sample data for demonstration when MongoDB is not connected. This allows testing the UI features without a running MongoDB instance. Sample videos will be displayed automatically.

## Project Structure

```
youtube-clone/
├── server/                 # Backend
│   ├── config/            # Database configuration
│   ├── middleware/        # Auth middleware
│   ├── models/            # Mongoose models
│   ├── routes/            # API routes
│   ├── index.js           # Server entry point
│   ├── package.json
│   └── .env               # Environment variables
│
├── client/                 # Frontend
│   ├── src/
│   │   ├── components/    # React components
│   │   ├── context/       # Auth context
│   │   ├── pages/         # Page components
│   │   ├── App.jsx        # Main app component
│   │   ├── main.jsx       # Entry point
│   │   └── index.css      # Global styles
│   ├── index.html
│   ├── package.json
│   └── vite.config.js
│
├── .gitignore
└── README.md
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user (protected)
- `PUT /api/auth/profile` - Update profile (protected)

### Videos
- `GET /api/videos` - Get all videos (with search/filter)
- `GET /api/videos/:id` - Get single video
- `POST /api/videos` - Create video (protected)
- `PUT /api/videos/:id` - Update video (protected)
- `DELETE /api/videos/:id` - Delete video (protected)
- `PUT /api/videos/:id/like` - Like/dislike video (protected)

### Channels
- `GET /api/channels` - Get all channels
- `GET /api/channels/:id` - Get single channel
- `POST /api/channels` - Create channel (protected)
- `PUT /api/channels/:id` - Update channel (protected)
- `DELETE /api/channels/:id` - Delete channel (protected)

### Comments
- `GET /api/comments/video/:videoId` - Get comments for video
- `POST /api/comments` - Add comment (protected)
- `PUT /api/comments/:id` - Update comment (protected)
- `DELETE /api/comments/:id` - Delete comment (protected)

## Categories

The following filter categories are available:
- All
- Programming
- Music
- Gaming
- Education
- Entertainment
- Sports
- Technology
- News
- Travel
- Food

## Troubleshooting

### Error: Cannot find package 'express'
**Solution:** Run `npm install` in both server and client folders:
```bash
cd server && npm install
cd ../client && npm install
```

### Error: Path not found
**Solution:** Use quotes around path if it contains spaces:
```bash
cd "c:\Users\Your Name\Project\youtube-clone"
```

### MongoDB Connection Error
- Ensure MongoDB is running
- Or use demo mode (works without MongoDB)

## Contributing

This is a capstone project for educational purposes.

## License

MIT
