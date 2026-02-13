# Quick Test Examples for Calls API

## Prerequisites
1. Have two user accounts (or create them)
2. Get JWT tokens for both users
3. Use a REST client (Postman, Thunder Client, or curl)

---

## Example 1: Video Call Between Two Users

### User A (Caller) - Initiate Video Call

```bash
POST http://localhost:3000/calls/initiate
Authorization: Bearer <USER_A_TOKEN>
Content-Type: application/json

{
  "receiverId": "<USER_B_ID>",
  "callType": "video"
}
```

**Expected Response:**
```json
{
  "message": "Call initiated",
  "call": {
    "_id": "65d1234567890abcdef",
    "callerId": "<USER_A_ID>",
    "receiverId": "<USER_B_ID>",
    "callType": "video",
    "status": "initiated",
    "createdAt": "2026-02-06T10:20:30.000Z"
  }
}
```

**Save the `call._id` for next steps!**

---

### User B (Receiver) - Answer the Call

```bash
PATCH http://localhost:3000/calls/<CALL_ID>/answer
Authorization: Bearer <USER_B_TOKEN>
Content-Type: application/json

{
  "accept": true
}
```

**Expected Response:**
```json
{
  "message": "Call answered",
  "call": {
    "_id": "65d1234567890abcdef",
    "status": "answered",
    "startedAt": "2026-02-06T10:20:45.000Z"
  }
}
```

---

### User A or B - End the Call

```bash
PATCH http://localhost:3000/calls/<CALL_ID>/end
Authorization: Bearer <USER_A_TOKEN_OR_USER_B_TOKEN>
```

**Expected Response:**
```json
{
  "message": "Call ended",
  "call": {
    "_id": "65d1234567890abcdef",
    "status": "ended",
    "duration": 120,
    "endedAt": "2026-02-06T10:22:45.000Z"
  }
}
```

---

## Example 2: Audio Call (Rejected)

### User A - Initiate Audio Call

```bash
POST http://localhost:3000/calls/initiate
Authorization: Bearer <USER_A_TOKEN>
Content-Type: application/json

{
  "receiverId": "<USER_B_ID>",
  "callType": "audio"
}
```

---

### User B - Reject the Call

```bash
PATCH http://localhost:3000/calls/<CALL_ID>/answer
Authorization: Bearer <USER_B_TOKEN>
Content-Type: application/json

{
  "accept": false
}
```

**Expected Response:**
```json
{
  "message": "Call rejected",
  "call": {
    "_id": "65d1234567890abcdef",
    "status": "rejected"
  }
}
```

---

## Example 3: Check Call History

```bash
GET http://localhost:3000/calls/history?page=1&limit=10
Authorization: Bearer <YOUR_TOKEN>
```

**Expected Response:**
```json
{
  "calls": [
    {
      "_id": "65d1234567890abcdef",
      "callerId": {
        "username": "john_doe",
        "fullName": "John Doe",
        "avatar": "https://..."
      },
      "receiverId": {
        "username": "jane_smith",
        "fullName": "Jane Smith"
      },
      "callType": "video",
      "status": "ended",
      "duration": 120,
      "createdAt": "2026-02-06T10:20:30.000Z"
    }
  ],
  "total": 5
}
```

---

## Example 4: Get Call Statistics

```bash
GET http://localhost:3000/calls/stats/summary
Authorization: Bearer <YOUR_TOKEN>
```

**Expected Response:**
```json
{
  "totalCalls": 15,
  "totalDuration": 2340,
  "missedCalls": 2,
  "videoCalls": 10,
  "audioCalls": 5
}
```

---

## Example 5: Get Missed Calls Count

```bash
GET http://localhost:3000/calls/missed/count
Authorization: Bearer <YOUR_TOKEN>
```

**Expected Response:**
```json
{
  "count": 2
}
```

---

## Testing with curl

### 1. Login First
```bash
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "yourpassword"
  }'
```

Save the `access_token` from response.

### 2. Initiate Call
```bash
curl -X POST http://localhost:3000/calls/initiate \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "receiverId": "RECEIVER_USER_ID",
    "callType": "video"
  }'
```

### 3. Answer Call
```bash
curl -X PATCH http://localhost:3000/calls/CALL_ID/answer \
  -H "Authorization: Bearer RECEIVER_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"accept": true}'
```

### 4. End Call
```bash
curl -X PATCH http://localhost:3000/calls/CALL_ID/end \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

---

## Common Issues & Solutions

### 1. **"Unauthorized" Error**
- Make sure you're sending the JWT token in the Authorization header
- Token format: `Bearer <token>`
- Check if token is expired

### 2. **"Conversation not found" Error**  
- The call was initiated with a non-existent conversationId
- Either omit conversationId or use a valid one

### 3. **"Call not found" Error**
- Double-check the call ID
- The call might have been deleted from history

---

## Next Steps

For a production-ready implementation, you should add:

1. **WebSocket/Socket.IO Gateway** for real-time notifications
2. **WebRTC Signaling** for peer-to-peer audio/video
3. **Push Notifications** for incoming calls
4. **Call Timeout Logic** (mark as missed after X seconds)
5. **Busy Status** (can't receive call if already in one)
