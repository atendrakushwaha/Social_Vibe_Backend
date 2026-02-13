# Instagram Clone Backend - NestJS + MongoDB

A production-ready, full-featured Instagram clone backend built with NestJS and MongoDB, featuring all advanced Instagram functionalities.

## 🚀 Features

### ✅ **Core Features**
- **Authentication** - JWT-based auth with email/phone login
- **User Management** - Profile management, account privacy, verification
- **Posts** - Multi-media posts with captions, hashtags, mentions, location tags
- **Comments** - Nested comments with mentions and replies
- **Likes** - Universal like system for posts, comments, stories, reels
- **Follow System** - Follow/unfollow with private account support
- **Feed** - Personalized algorithmic feed + chronological following feed

### 🌟 **Advanced Features**
- **Stories** - 24-hour auto-expiring stories with viewers tracking
- **Reels** - Short video content with trending algorithm
- **Direct Messages** - Real-time 1-on-1 and group messaging (WebSocket)
- **Notifications** - Real-time notifications via WebSocket
- **Search** - Global search across users, hashtags, and posts
- **Hashtags** - Trending hashtags with follow support
- **Bookmarks** - Save posts with collections
- **Explore** - Discover content algorithm

### 🔥 **Real-time Features (WebSocket)**
- Live notifications
- Direct messaging
- Typing indicators
- Read receipts
- Online status
- Live post engagement

## 📁 Project Structure

```
src/
├── common/           # Shared utilities, guards, decorators
│   ├── guards/       # JWT auth guard
│   └── multer/       # File upload configuration
├── config/           # Configuration files
│   ├── mongo.config.ts
│   └── jwt.config.ts
├── modules/
│   ├── auth/         # Authentication & authorization
│   ├── users/        # User management
│   ├── posts/        # Posts with media, hashtags, mentions
│   ├── comments/     # Nested comments system
│   ├── likes/        # Universal like system
│   ├── follows/      # Follow/unfollow with requests
│   ├── feed/         # Personalized feed algorithm
│   ├── stories/      # 24-hour stories
│   ├── reels/        # Short video content
│   ├── notifications/# Real-time notifications
│   ├── bookmarks/    # Save posts
│   ├── hashtags/     # Hashtag system
│   ├── search/       # Global search
│   └── events/       # WebSocket gateway
└── main.ts           # Application entry point
```

## 🛠️ Tech Stack

- **Framework**: NestJS v11
- **Database**: MongoDB with Mongoose
- **Authentication**: JWT with Passport
- **Real-time**: Socket.IO (WebSockets)
- **File Upload**: Multer
- **Validation**: class-validator, class-transformer
- **Documentation**: Swagger/OpenAPI
- **Testing**: Jest

## 📦 Installation

### Prerequisites
- Node.js >= 18.x
- MongoDB >= 6.x
- npm or yarn

### Setup

1. **Clone the repository**
```bash
git clone <repository-url>
cd nest-best-structure
```

2. **Install dependencies**
```bash
npm install
```

3. **Configure environment variables**
Create a `.env` file in the root directory:
```env
# MongoDB
MONGO_URI=mongodb://localhost:27017/instagram-clone

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=7d

# Server
PORT=3000
NODE_ENV=development

# Optional: AWS S3 for media storage
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
AWS_S3_BUCKET=your-bucket-name
AWS_REGION=us-east-1
```

4. **Run the application**

```bash
# Development mode
npm run start:dev

# Production mode
npm run build
npm run start:prod
```

The API will be available at `http://localhost:3000`

## 📚 API Documentation

Once the application is running, access the Swagger documentation at:
```
http://localhost:3000/api
```

## 🔑 API Endpoints Overview

### Authentication
- `POST /auth/register` - Register new user
- `POST /auth/login` - Login
- `POST /auth/logout` - Logout

### Users & Profile
- `GET /users/:id` - Get user profile
- `PATCH /users/me` - Update own profile
- `GET /users/:id/posts` - Get user's posts

### Posts
- `POST /posts` - Create post
- `GET /posts/:id` - Get post details
- `PATCH /posts/:id` - Update post
- `DELETE /posts/:id` - Delete post
- `GET /posts/user/:userId` - Get user's posts
- `GET /posts/hashtag/:hashtag` - Posts by hashtag
- `GET /posts/trending` - Trending posts

### Comments
- `POST /comments/posts/:postId` - Add comment
- `GET /comments/posts/:postId` - Get post comments
- `GET /comments/:id/replies` - Get comment replies
- `PATCH /comments/:id` - Update comment
- `DELETE /comments/:id` - Delete comment
- `POST /comments/:id/pin` - Pin comment

### Likes
- `POST /likes/:targetType/:targetId` - Toggle like
- `GET /likes/:targetType/:targetId` - Get likers
- `GET /likes/:targetType/:targetId/check` - Check if liked

### Follows
- `POST /follows/:userId` - Follow user
- `DELETE /follows/:userId` - Unfollow user
- `GET /follows/followers/:userId` - Get followers
- `GET /follows/following/:userId` - Get following
- `GET /follows/requests` - Get follow requests
- `PATCH /follows/requests/:id/accept` - Accept request
- `DELETE /follows/requests/:id/reject` - Reject request
- `GET /follows/status/:userId` - Get follow status

### Feed
- `GET /feed` - Personalized feed
- `GET /feed/following` - Following feed
- `GET /feed/explore` - Explore feed

### Stories
- `POST /stories` - Create story
- `GET /stories` - Get active stories
- `POST /stories/:id/view` - Mark story as viewed

### Reels
- `POST /reels` - Upload reel
- `GET /reels` - Get reels feed
- `GET /reels/trending` - Trending reels
- `POST /reels/:id/view` - Increment view

### Notifications
- `GET /notifications` - Get notifications
- `PATCH /notifications/:id/read` - Mark as read
- `PATCH /notifications/read-all` - Mark all as read
- `DELETE /notifications/:id` - Delete notification

### Bookmarks
- `POST /bookmarks/:postId` - Save post
- `GET /bookmarks` - Get saved posts
- `DELETE /bookmarks/:postId` - Remove bookmark

### Hashtags
- `GET /hashtags/trending` - Trending hashtags
- `GET /hashtags/search?q=` - Search hashtags

### Search
- `GET /search?q=` - Global search
- `GET /search/users?q=` - Search users
- `GET /search/hashtags?q=` - Search hashtags
- `GET /search/posts?q=` - Search posts

## 🔌 WebSocket Events

### Client → Server Events

```javascript
// Join a conversation
socket.emit('conversation:join', { conversationId: '...' });

// Start typing
socket.emit('typing:start', { conversationId: '...', userId: '...' });

// Stop typing
socket.emit('typing:stop', { conversationId: '...', userId: '...' });

// Mark message as read
socket.emit('message:read', { 
  conversationId: '...', 
  messageId: '...', 
  userId: '...' 
});
```

### Server → Client Events

```javascript
// New notification
socket.on('notification', (data) => {
  console.log('New notification:', data);
});

// New message
socket.on('message', (data) => {
  console.log('New message:', data);
});

// User online/offline
socket.on('user:online', (data) => {
  console.log('User online:', data.userId);
});

socket.on('user:offline', (data) => {
  console.log('User offline:', data.userId);
});

// Typing indicators
socket.on('typing:start', (data) => {
  console.log('User typing:', data.userId);
});

socket.on('typing:stop', (data) => {
  console.log('User stopped typing:', data.userId);
});
```

## 🗄️ Database Schema

### Key Collections

#### Users
- Authentication credentials
- Profile information (bio, avatar, website)
- Account settings (privacy, verification)
- Follower/following counts
- Blocked/muted users
- Close friends list

#### Posts
- Multi-media support (images/videos)
- Caption with hashtags and mentions
- Location tagging
- Engagement counts (likes, comments, shares)
- Visibility settings
- Archive capability

#### Comments
- Content with mentions
- Nested replies (parent-child)
- Like count
- Pin capability for post owners

#### Likes
- Universal system (posts, comments, stories, reels)
- Compound unique index (user + target)

#### Follows
- Follow status (pending/accepted/rejected)
- Support for private accounts

#### Stories
- 24-hour auto-expiry
- Viewers tracking
- Interactive elements (polls, questions)
- Visibility controls

#### Reels
- Video URL and thumbnail
- Audio tracks
- Engagement metrics
- Remix/duet support

#### Notifications
- Multiple notification types
- Read/unread status
- Target reference (post, comment, etc.)

## 🔒 Security Features

- ✅ JWT authentication
- ✅ Password hashing with bcrypt
- ✅ Input validation
- ✅ Authorization guards
- ✅ Private account handling
- ✅ Blocked user filtering
- ✅ File upload validation

## 🧪 Testing

```bash
# Unit tests
npm run test

# E2E tests
npm run test:e2e

# Test coverage
npm run test:cov
```

## 🚢 Deployment

### Production Checklist

1. **Environment Variables**
   - Set strong JWT_SECRET
   - Configure production MongoDB URI
   - Set up AWS S3 for media storage
   - Configure CORS for your frontend domain

2. **Database**
   - Enable MongoDB authentication
   - Set up database backups
   - Create proper indexes

3. **Media Storage**
   - Configure AWS S3 or alternative CDN
   - Set up media processing pipeline
   - Enable image compression

4. **Monitoring**
   - Set up application monitoring
   - Configure error tracking (Sentry)
   - Enable logging

5. **Performance**
   - Enable Redis for caching
   - Set up load balancing
   - Configure rate limiting

## 📈 Performance Optimizations

- Database indexing for all queries
- Pagination for all list endpoints
- Aggregation pipelines for complex queries
- Lazy loading for media
- Caching ready (add Redis)
- Connection pooling

## 🔮 Future Enhancements

- [ ] Direct messaging module (full implementation)
- [ ] Voice/video calls
- [ ] Advanced analytics dashboard
- [ ] Content moderation AI
- [ ] Multi-language support
- [ ] Two-factor authentication
- [ ] OAuth integration (Google, Facebook)
- [ ] Push notifications (FCM)
- [ ] Admin panel
- [ ] Content reporting system

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## 📝 License

This project is licensed under the MIT License.

## 🙏 Acknowledgments

Built with:
- [NestJS](https://nestjs.com/) - Progressive Node.js framework
- [MongoDB](https://www.mongodb.com/) - NoSQL database
- [Socket.IO](https://socket.io/) - Real-time communication
- [Mongoose](https://mongoosejs.com/) - MongoDB ODM

## 📧 Support

For issues and questions, please create an issue in the repository.

---

**Happy Coding! 🚀**
