# Instagram Clone - Quick Start Guide

## 🚀 Get Started in 5 Minutes

### 1. Prerequisites Check
```bash
# Check Node.js version (need >= 18.x)
node --version

# Check MongoDB (should be running)
mongosh --version
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Setup Environment
Copy and paste this into `.env` file in root directory:

```env
MONGO_URI=mongodb://localhost:27017/instagram-clone
JWT_SECRET=instagram-super-secret-key-2024
JWT_EXPIRES_IN=7d
PORT=3000
NODE_ENV=development
```

### 4. Start MongoDB
Make sure MongoDB is running:

```bash
# Windows
net start MongoDB

# macOS/Linux
sudo systemctl start mongod
```

### 5. Run the Application
```bash
npm run start:dev
```

### 6. Test the API

Open your browser and go to:
- **Swagger Documentation**: http://localhost:3000/api
- **Health Check**: http://localhost:3000/health

## 📝 Testing the API

### Step 1: Register a User

**Request:**
```http
POST http://localhost:3000/auth/register
Content-Type: application/json

{
  "username": "johndoe",
  "email": "john@example.com",
  "password": "Password123!",
  "fullName": "John Doe"
}
```

### Step 2: Login

**Request:**
```http
POST http://localhost:3000/auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "Password123!"
}
```

**Response:**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "...",
    "username": "johndoe",
    "email": "john@example.com"
  }
}
```

Copy the `access_token` for the next requests!

### Step 3: Create a Post

**Request:**
```http
POST http://localhost:3000/posts
Authorization: Bearer YOUR_ACCESS_TOKEN_HERE
Content-Type: application/json

{
  "media": [
    {
      "url": "https://picsum.photos/800/600",
      "type": "image",
      "altText": "Beautiful sunset"
    }
  ],
  "caption": "Amazing sunset! #sunset #nature @janedoe",
  "visibility": "public"
}
```

### Step 4: Get Feed

**Request:**
```http
GET http://localhost:3000/feed?page=1&limit=10
Authorization: Bearer YOUR_ACCESS_TOKEN_HERE
```

### Step 5: Like a Post

**Request:**
```http
POST http://localhost:3000/likes/posts/POST_ID_HERE
Authorization: Bearer YOUR_ACCESS_TOKEN_HERE
```

### Step 6: Add a Comment

**Request:**
```http
POST http://localhost:3000/comments/posts/POST_ID_HERE
Authorization: Bearer YOUR_ACCESS_TOKEN_HERE
Content-Type: application/json

{
  "content": "Great post! 🔥"
}
```

### Step 7: Follow a User

**Request:**
```http
POST http://localhost:3000/follows/USER_ID_HERE
Authorization: Bearer YOUR_ACCESS_TOKEN_HERE
```

### Step 8: Search

**Request:**
```http
GET http://localhost:3000/search?q=sunset
```

## 🔥 WebSocket Testing

### Connect to WebSocket

```javascript
// Using socket.io-client
import io from 'socket.io-client';

const socket = io('http://localhost:3000', {
  auth: {
    userId: 'YOUR_USER_ID'
  }
});

// Listen for notifications
socket.on('notification', (data) => {
  console.log('New notification:', data);
});

// Listen for messages
socket.on('message', (data) => {
  console.log('New message:', data);
});

// Join a conversation
socket.emit('conversation:join', {
  conversationId: 'CONVERSATION_ID'
});

// Send typing indicator
socket.emit('typing:start', {
  conversationId: 'CONVERSATION_ID',
  userId: 'YOUR_USER_ID'
});
```

## 📊 Module Overview

### ✅ Implemented Modules

1. **Posts** - Create, read, update, delete posts ✅
2. **Comments** - Nested comments with replies ✅
3. **Likes** - Universal like system ✅
4. **Follows** - Follow/unfollow with requests ✅
5. **Feed** - Personalized + Following + Explore ✅
6. **Stories** - 24-hour stories ✅
7. **Reels** - Short videos ✅
8. **Notifications** - Real-time notifications ✅
9. **Bookmarks** - Save posts ✅
10. **Hashtags** - Trending hashtags ✅
11. **Search** - Global search ✅
12. **WebSocket** - Real-time features ✅

### 🚧 To Be Enhanced

- Direct Messages (basic structure ready, needs full implementation)
- Media Upload Service (currently accepts URLs)
- Push Notifications (structure ready)
- Admin Panel
- Analytics Dashboard

## 🎯 Next Steps

1. **Add More Users** - Register multiple users to test social features
2. **Test Follow Flow** - Follow users and see personalized feed
3. **Create Stories** - Test 24-hour expiring stories
4. **Upload Reels** - Test short video content
5. **Use WebSocket** - Test real-time notifications
6. **Search Everything** - Test global search

## 🐛 Troubleshooting

### MongoDB Connection Error
```bash
# Make sure MongoDB is running
mongosh

# If failed, start MongoDB service
net start MongoDB  # Windows
sudo systemctl start mongod  # Linux
```

### Port Already in Use
Change the port in `.env`:
```env
PORT=3001
```

### JWT Token Expired
Login again to get a new token:
```http
POST http://localhost:3000/auth/login
```

## 📚 Resources

- [Full API Documentation](http://localhost:3000/api)
- [Detailed README](./INSTAGRAM_README.md)
- [Implementation Plan](./INSTAGRAM_CLONE_PLAN.md)

## 🎉 You're All Set!

Your Instagram clone backend is now running with all advanced features!

Start building your frontend or test the API with Postman. Happy coding! 🚀
