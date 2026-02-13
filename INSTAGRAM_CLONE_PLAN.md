# Instagram Clone Backend - Implementation Plan

## 🎯 Overview
Full-featured Instagram clone backend built with NestJS, MongoDB, Socket.IO, and AWS S3 integration.

## 📦 Tech Stack
- **Framework**: NestJS
- **Database**: MongoDB with Mongoose
- **Authentication**: JWT with Passport
- **Real-time**: Socket.IO (WebSockets)
- **File Storage**: Multer + AWS S3 (configurable)
- **Cache**: In-memory (upgradeable to Redis)
- **Validation**: class-validator, class-transformer

## 🏗️ Architecture

### Module Structure
```
src/modules/
├── auth/                 # ✅ Already exists - enhance
├── users/                # ✅ Already exists - enhance
├── profile/              # ✅ Already exists - enhance
├── posts/                # ✅ Already exists - enhance for Instagram
├── comments/             # 🆕 Comment system with nested replies
├── likes/                # 🆕 Like system for posts & comments
├── follows/              # 🆕 Follow/unfollow system
├── feed/                 # 🆕 Personalized feed algorithm
├── stories/              # 🆕 24-hour temporary stories
├── reels/                # 🆕 Short video content
├── direct-messages/      # 🆕 1-on-1 and group chat
├── notifications/        # 🆕 Real-time notifications
├── search/               # 🆕 Search users, hashtags, posts
├── hashtags/             # 🆕 Hashtag system
├── bookmarks/            # 🆕 Save posts for later
├── explore/              # 🆕 Discover algorithm
├── media/                # 🆕 Media upload & processing
└── activity/             # 🆕 User activity tracking
```

## 📋 Feature List

### ✅ Core Features (Enhance Existing)
1. **Authentication & Authorization**
   - JWT-based auth
   - Email/phone login
   - OAuth (Google, Facebook)
   - Two-factor authentication
   - Session management

2. **User Management**
   - Registration & login
   - Profile management (bio, avatar, website)
   - Account privacy (public/private)
   - Account verification (blue tick)
   - Account deactivation/deletion

3. **Profile Enhancement**
   - Profile picture & cover
   - Bio with links
   - Website link
   - Gender, birthday
   - Pronouns
   - Account privacy settings

4. **Posts Module (Enhanced)**
   - Create posts with multiple images/videos
   - Captions with mentions & hashtags
   - Location tagging
   - Alt text for accessibility
   - Edit/delete posts
   - Archive posts
   - Turn off commenting
   - Hide like count

### 🆕 New Features

#### 5. Comments System
- Comment on posts
- Reply to comments (nested)
- Like comments
- Mention users in comments
- Delete own comments
- Report comments
- Pin comments (post owner)
- Comment pagination

#### 6. Likes System
- Like/unlike posts
- Like/unlike comments
- Like/unlike stories
- See who liked (if public)
- Hide like counts

#### 7. Follow System
- Follow/unfollow users
- Follow requests (private accounts)
- Accept/reject follow requests
- Block/unblock users
- Mute users
- Close friends list
- Followers/following lists
- Suggested users to follow

#### 8. Feed Algorithm
- Personalized home feed
- Following feed (chronological)
- Algorithm based on:
  - User engagement
  - Recency
  - Relationship strength
  - Content type preference
- Infinite scroll pagination
- Pull-to-refresh

#### 9. Stories
- Create stories (photo/video)
- 24-hour auto-delete
- Story viewers list
- Reply to stories (DM)
- Story highlights (save permanently)
- Story polls, questions, quizzes
- Story mentions
- Story hashtags
- Close friends stories
- Archive stories

#### 10. Reels
- Upload short videos (15-90s)
- Video filters & effects
- Audio/music integration
- Reels feed (explore)
- Like, comment, share reels
- Remix/duet functionality
- Trending reels
- Reels by hashtag

#### 11. Direct Messages
- 1-on-1 messaging
- Group chats
- Send photos/videos
- Voice messages
- Share posts/reels/stories
- View once messages
- Message reactions
- Typing indicators
- Read receipts
- Online status
- Message search
- Delete messages
- Unsend messages
- Message requests (from non-followers)

#### 12. Notifications
- Real-time WebSocket notifications
- Push notification support
- Notification types:
  - Likes on posts/comments
  - Comments on posts
  - New followers
  - Follow requests
  - Mentions in posts/comments/stories
  - DM messages
  - Story views
- Notification preferences
- Mark as read/unread
- Clear all notifications

#### 13. Search
- Search users
- Search hashtags
- Search locations
- Search history
- Trending searches
- Recent searches
- Clear search history
- Search suggestions

#### 14. Hashtags
- Create hashtags
- Follow hashtags
- Trending hashtags
- Posts by hashtag
- Hashtag count
- Related hashtags
- Hashtag suggestions

#### 15. Bookmarks
- Save posts
- Create collections
- Organize saved posts
- Remove saved posts
- Private bookmarks

#### 16. Explore Page
- Discover new content
- Algorithm based on:
  - User interests
  - Popular content
  - Trending hashtags
  - Location-based content
- Content categories
- Infinite scroll

#### 17. Media Management
- Upload images (JPEG, PNG, WEBP)
- Upload videos (MP4, MOV)
- Image compression
- Video transcoding
- Thumbnail generation
- AWS S3 integration
- Local storage fallback
- CDN support
- Media validation
- Max file size limits

#### 18. Activity & Analytics
- Post views
- Profile views
- Story views
- Engagement rate
- Follower growth
- Best time to post
- User activity log

## 🗄️ Database Schema

### Collections

1. **Users**
   - Basic info, credentials, settings
   - Account type (public/private)
   - Verification status

2. **Profiles**
   - Bio, avatar, website
   - followers/following counts
   - Posts count

3. **Posts**
   - Media URLs, caption
   - Location, hashtags, mentions
   - Like count, comment count
   - Privacy settings

4. **Comments**
   - Post reference, user reference
   - Content, parent comment (for replies)
   - Like count

5. **Likes**
   - User reference
   - Target (post/comment/story)
   - Target type

6. **Follows**
   - Follower, following
   - Status (pending/accepted)

7. **Stories**
   - Media URL, user
   - Expiry time
   - Viewers list

8. **Reels**
   - Video URL, thumbnail
   - Audio, effects
   - Like/comment count

9. **DirectMessages**
   - Conversation ID
   - Sender, receiver(s)
   - Message content/media
   - Read status

10. **Notifications**
    - User, actor
    - Type, content
    - Read status
    - Link reference

11. **Hashtags**
    - Tag name
    - Post count
    - Follower count

12. **Bookmarks**
    - User, post
    - Collection reference

13. **Activities**
    - User, action type
    - Target, timestamp

## 🔧 Implementation Steps

### Phase 1: Core Enhancement (1-2 days)
- [x] Existing: Auth, Users, Profile, Posts
- [ ] Enhance Posts module for Instagram features
- [ ] Add media upload service
- [ ] Set up AWS S3 integration

### Phase 2: Social Features (2-3 days)
- [ ] Implement Comments system
- [ ] Implement Likes system
- [ ] Implement Follow system
- [ ] Create Feed algorithm

### Phase 3: Stories & Reels (2-3 days)
- [ ] Implement Stories module
- [ ] Implement Reels module
- [ ] Add video processing

### Phase 4: Messaging (2-3 days)
- [ ] Set up Socket.IO gateway
- [ ] Implement Direct Messages
- [ ] Add real-time features
- [ ] Implement typing indicators

### Phase 5: Discovery (1-2 days)
- [ ] Implement Search module
- [ ] Implement Hashtags system
- [ ] Implement Explore algorithm
- [ ] Implement Bookmarks

### Phase 6: Notifications & Polish (1-2 days)
- [ ] Implement real-time notifications
- [ ] Add activity tracking
- [ ] API documentation (Swagger)
- [ ] E2E tests

## 🎨 API Endpoints

### Authentication
- POST `/auth/register`
- POST `/auth/login`
- POST `/auth/logout`
- POST `/auth/refresh`
- POST `/auth/forgot-password`
- POST `/auth/reset-password`

### Users & Profile
- GET `/users/:id`
- GET `/users/me`
- PATCH `/users/me`
- GET `/users/:id/posts`
- GET `/users/:id/followers`
- GET `/users/:id/following`

### Posts
- POST `/posts` - Create post
- GET `/posts/:id` - Get post
- PATCH `/posts/:id` - Update post
- DELETE `/posts/:id` - Delete post
- POST `/posts/:id/like` - Like post
- DELETE `/posts/:id/like` - Unlike post
- GET `/posts/:id/likes` - Get likers

### Comments
- POST `/posts/:id/comments` - Add comment
- GET `/posts/:id/comments` - Get comments
- POST `/comments/:id/reply` - Reply to comment
- DELETE `/comments/:id` - Delete comment
- POST `/comments/:id/like` - Like comment

### Follows
- POST `/users/:id/follow` - Follow user
- DELETE `/users/:id/follow` - Unfollow user
- GET `/users/:id/follow-requests` - Get requests
- POST `/follow-requests/:id/accept` - Accept request
- DELETE `/follow-requests/:id/reject` - Reject request

### Feed
- GET `/feed` - Personalized feed
- GET `/feed/following` - Following feed
- GET `/feed/explore` - Explore feed

### Stories
- POST `/stories` - Create story
- GET `/stories` - Get stories feed
- GET `/stories/:id` - Get story
- DELETE `/stories/:id` - Delete story
- POST `/stories/:id/view` - Mark as viewed
- GET `/stories/:id/viewers` - Get viewers

### Reels
- POST `/reels` - Upload reel
- GET `/reels` - Get reels feed
- GET `/reels/:id` - Get reel
- POST `/reels/:id/like` - Like reel
- GET `/reels/trending` - Trending reels

### Direct Messages
- GET `/messages/conversations` - Get all conversations
- POST `/messages/conversations` - Create conversation
- GET `/messages/conversations/:id` - Get messages
- POST `/messages/conversations/:id/messages` - Send message
- DELETE `/messages/:id` - Delete message
- PATCH `/messages/:id/read` - Mark as read

### Notifications
- GET `/notifications` - Get all notifications
- PATCH `/notifications/:id/read` - Mark as read
- DELETE `/notifications/:id` - Delete notification
- PATCH `/notifications/read-all` - Mark all as read

### Search
- GET `/search/users?q=` - Search users
- GET `/search/hashtags?q=` - Search hashtags
- GET `/search/places?q=` - Search locations
- GET `/search/recent` - Recent searches
- DELETE `/search/recent` - Clear search history

### Hashtags
- GET `/hashtags/:tag` - Get hashtag details
- GET `/hashtags/:tag/posts` - Posts by hashtag
- POST `/hashtags/:tag/follow` - Follow hashtag
- GET `/hashtags/trending` - Trending hashtags

### Bookmarks
- GET `/bookmarks` - Get saved posts
- POST `/bookmarks` - Save post
- DELETE `/bookmarks/:id` - Remove bookmark
- GET `/bookmarks/collections` - Get collections
- POST `/bookmarks/collections` - Create collection

## 🔐 Security Features
- JWT authentication
- Rate limiting
- Input validation
- XSS protection
- CSRF protection
- File upload validation
- Private account handling
- Blocked user handling
- Content moderation

## 🚀 Performance Optimization
- Database indexing
- Query optimization
- Pagination
- Caching (Redis ready)
- CDN for media
- Lazy loading
- Image optimization
- Video compression

## 📊 Testing
- Unit tests for services
- E2E tests for API endpoints
- Integration tests
- Load testing

## 📚 Documentation
- Swagger API documentation
- README with setup instructions
- Architecture documentation
- API usage examples

---

**Let's build this! 🚀**
