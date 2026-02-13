# Calls API - How to Make Audio/Video Calls

## Overview
This guide explains how to use the Calls API to initiate, manage, and track audio/video calls in your Instagram clone.

---

## 🚀 API Endpoints

### 1. **Initiate a Call** (Audio or Video)

**Endpoint:** `POST /calls/initiate`

**Description:** Start a new audio or video call with another user.

**Headers:**
```
Authorization: Bearer <your_jwt_token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "receiverId": "65abc123def456789012",
  "callType": "video",
  "conversationId": "65xyz123def456789012"  // Optional
}
```

**Parameters:**
- `receiverId` (required): User ID of the person you want to call
- `callType` (required): Either `"audio"` or `"video"`
- `conversationId` (optional): If calling from a conversation

**Response (200 OK):**
```json
{
  "message": "Call initiated",
  "call": {
    "_id": "65call123def456789012",
    "callerId": "65user123def456789012",
    "receiverId": "65abc123def456789012",
    "callType": "video",
    "status": "initiated",
    "conversationId": "65xyz123def456789012",
    "createdAt": "2026-02-06T10:20:30.000Z",
    "updatedAt": "2026-02-06T10:20:30.000Z"
  }
}
```

---

### 2. **Answer a Call**

**Endpoint:** `PATCH /calls/:callId/answer`

**Description:** Accept or reject an incoming call.

**Headers:**
```
Authorization: Bearer <your_jwt_token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "accept": true  // true to accept, false to reject
}
```

**Response (200 OK):**
```json
{
  "message": "Call answered",
  "call": {
    "_id": "65call123def456789012",
    "callerId": "65user123def456789012",
    "receiverId": "65abc123def456789012",
    "callType": "video",
    "status": "answered",
    "startedAt": "2026-02-06T10:20:45.000Z",
    "createdAt": "2026-02-06T10:20:30.000Z",
    "updatedAt": "2026-02-06T10:20:45.000Z"
  }
}
```

---

### 3. **End a Call**

**Endpoint:** `PATCH /calls/:callId/end`

**Description:** End an ongoing call.

**Headers:**
```
Authorization: Bearer <your_jwt_token>
```

**Response (200 OK):**
```json
{
  "message": "Call ended",
  "call": {
    "_id": "65call123def456789012",
    "callerId": "65user123def456789012",
    "receiverId": "65abc123def456789012",
    "callType": "video",
    "status": "ended",
    "startedAt": "2026-02-06T10:20:45.000Z",
    "endedAt": "2026-02-06T10:35:20.000Z",
    "duration": 875,  // Duration in seconds
    "createdAt": "2026-02-06T10:20:30.000Z",
    "updatedAt": "2026-02-06T10:35:20.000Z"
  }
}
```

---

### 4. **Get Call History**

**Endpoint:** `GET /calls/history?page=1&limit=20`

**Description:** Retrieve paginated call history for the authenticated user.

**Headers:**
```
Authorization: Bearer <your_jwt_token>
```

**Query Parameters:**
- `page` (optional, default: 1): Page number
- `limit` (optional, default: 50): Items per page

**Response (200 OK):**
```json
{
  "calls": [
    {
      "_id": "65call123def456789012",
      "callerId": {
        "_id": "65user123def456789012",
        "username": "john_doe",
        "fullName": "John Doe",
        "avatar": "https://...",
        "isVerified": true
      },
      "receiverId": {
        "_id": "65abc123def456789012",
        "username": "jane_smith",
        "fullName": "Jane Smith",
        "avatar": "https://...",
        "isVerified": false
      },
      "callType": "video",
      "status": "ended",
      "duration": 875,
      "createdAt": "2026-02-06T10:20:30.000Z"
    }
  ],
  "total": 45
}
```

---

### 5. **Get Missed Calls Count**

**Endpoint:** `GET /calls/missed/count`

**Description:** Get the count of missed calls for the authenticated user.

**Headers:**
```
Authorization: Bearer <your_jwt_token>
```

**Response (200 OK):**
```json
{
  "count": 3
}
```

---

### 6. **Get Call Statistics**

**Endpoint:** `GET /calls/stats/summary`

**Description:** Get comprehensive call statistics for the authenticated user.

**Headers:**
```
Authorization: Bearer <your_jwt_token>
```

**Response (200 OK):**
```json
{
  "totalCalls": 127,
  "totalDuration": 45320,  // Total duration in seconds
  "missedCalls": 8,
  "videoCalls": 89,
  "audioCalls": 38
}
```

---

### 7. **Delete Call from History**

**Endpoint:** `DELETE /calls/:callId`

**Description:** Remove a call from your call history (soft delete).

**Headers:**
```
Authorization: Bearer <your_jwt_token>
```

**Response (200 OK):**
```json
{
  "message": "Call deleted from history"
}
```

---

## 📱 Example Usage Flow

### Making a Video Call

**Step 1: Initiate the call**
```bash
curl -X POST http://localhost:3000/calls/initiate \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "receiverId": "65abc123def456789012",
    "callType": "video"
  }'
```

**Step 2: Receiver answers the call**
```bash
curl -X PATCH http://localhost:3000/calls/65call123def456789012/answer \
  -H "Authorization: Bearer RECEIVER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "accept": true
  }'
```

**Step 3: Either party ends the call**
```bash
curl -X PATCH http://localhost:3000/calls/65call123def456789012/end \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## 📊 Call Status Flow

```
INITIATED → ANSWERED → ENDED
         ↓
      REJECTED
         ↓
       MISSED (if not answered within timeout)
```

**Call Statuses:**
- `initiated`: Call has been started but not answered yet
- `answered`: Call has been accepted and is ongoing
- `rejected`: Call was explicitly rejected
- `missed`: Call was not answered (timeout)
- `ended`: Call has been terminated

---

## 🔔 Real-Time Features (WebSocket Recommended)

For production, you should implement WebSocket/Socket.IO for:
- **Real-time call notifications** (incoming call alerts)
- **WebRTC signaling** (SDP offer/answer exchange)
- **ICE candidate exchange** (for peer-to-peer connection)
- **Call status updates** (answered, ended, etc.)

Would you like me to create a WebSocket Gateway for real-time call signaling?

---

## 🛡️ Security Notes

1. All endpoints require JWT authentication via `JwtAuthGuard`
2. Users can only delete their own call history
3. Call participants are verified before operations
4. Sensitive user data is populated selectively

---

## 🧪 Testing with Postman/Thunder Client

1. **Login** to get JWT token
2. Copy the token
3. Use the token in `Authorization: Bearer <token>` header
4. Test the endpoints in this order:
   - POST /calls/initiate
   - PATCH /calls/:id/answer
   - PATCH /calls/:id/end
   - GET /calls/history
