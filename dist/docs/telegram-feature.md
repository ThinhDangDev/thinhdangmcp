# Telegram Message Collection Feature

## Overview

This MCP server now includes the ability to collect messages from Telegram group chats, channels, and private conversations using the Telegram API (GramJS).

## Prerequisites

### 1. Get Telegram API Credentials

1. Visit https://my.telegram.org/apps
2. Login with your phone number
3. Click "API development tools"
4. Create a new application to get:
   - `API_ID` (numeric)
   - `API_HASH` (string)

### 2. Set Environment Variables

Add these to your `.env` file:

```bash
TELEGRAM_API_ID=12345678
TELEGRAM_API_HASH=your_api_hash_here
TELEGRAM_SESSION_STRING=  # Leave empty on first run
```

### 3. First-Time Authentication

On the first run, you'll be prompted to:

1. Enter your phone number (with country code, e.g., +1234567890)
2. Enter the verification code sent to your Telegram app
3. Enter your 2FA password (if enabled)

After successful authentication, a session string will be printed to the console. **Save this to your `TELEGRAM_SESSION_STRING` environment variable** to avoid re-authenticating in the future.

## Usage

### Tool: `telegram-collect-messages`

Collects messages from a Telegram chat.

#### Parameters

```typescript
{
  chatId: string,          // Required: @username, phone number, or numeric ID
  limit: number,           // Optional: 1-1000, default 100
  offsetId: number,        // Optional: Message ID to start from (for pagination)
  autoConnect: boolean     // Optional: Auto-connect if not connected, default true
}
```

#### Example Call

```javascript
// Collect last 100 messages from a channel
{
  "chatId": "@mychannel",
  "limit": 100
}

// Collect with pagination
{
  "chatId": "@mychannel",
  "limit": 100,
  "offsetId": 12345  // Start from message ID 12345
}

// Collect from private chat
{
  "chatId": "+1234567890",
  "limit": 50
}
```

#### Response Format

```json
{
  "success": true,
  "data": {
    "messages": [
      {
        "id": 12345,
        "date": "2026-01-03T14:00:00.000Z",
        "text": "Hello world!",
        "sender": {
          "id": "123456789",
          "username": "johndoe",
          "firstName": "John",
          "lastName": "Doe"
        },
        "media": {
          "type": "photo",
          "fileName": "image.jpg"
        },
        "replyToMsgId": 12344,
        "forwarded": false,
        "edited": false
      }
    ],
    "totalCollected": 100,
    "chatInfo": {
      "id": "1234567890",
      "title": "My Channel",
      "type": "channel",
      "username": "mychannel",
      "memberCount": 5000
    },
    "pagination": {
      "hasMore": true,
      "nextOffsetId": 12245
    }
  }
}
```

### Resource: `telegram://messages/{chatId}`

Access collected messages via MCP resources.

#### URI Format

```
telegram://messages/{chatId}
telegram://messages/list  # List all cached chats
```

#### Example

```javascript
// After collecting messages with the tool, access them via resource
const resource = await readResource("telegram://messages/@mychannel");

// List all cached chats
const list = await readResource("telegram://messages/list");
```

## Message Types

The tool recognizes these media types:

- `photo` - Images
- `video` - Video files
- `audio` - Audio files
- `document` - Documents and files
- `voice` - Voice messages
- `sticker` - Stickers

## Pagination

To collect more than 1000 messages, use pagination:

```javascript
let offsetId = 0;
let hasMore = true;
const allMessages = [];

while (hasMore) {
  const result = await callTool("telegram-collect-messages", {
    chatId: "@mychannel",
    limit: 1000,
    offsetId,
  });

  allMessages.push(...result.data.messages);
  hasMore = result.data.pagination.hasMore;
  offsetId = result.data.pagination.nextOffsetId;
}
```

## Rate Limits

Telegram API has rate limits:

- Max 20 requests per second
- Large message batches may take time
- The tool automatically handles connection management

## Permissions

You must have permission to access the chat:

- **Public channels**: Must be subscribed
- **Private groups**: Must be a member
- **Private chats**: Must have conversation history

## Troubleshooting

### Error: "TELEGRAM_API_ID and TELEGRAM_API_HASH environment variables are required"

Set the environment variables in your `.env` file.

### Error: "Telegram client not connected"

Set `autoConnect: true` (default) or manually connect before calling.

### Error: "CHANNEL_PRIVATE: You haven't joined this channel/supergroup"

Join the channel/group first, then try again.

### Error: "PEER_ID_INVALID: The provided peer id is invalid"

Check the chatId format:

- Use `@username` for public channels/groups
- Use phone number with country code for users
- Ensure you have access to the chat

### Session String Not Saving

After first authentication, copy the session string from console output and add it to your `.env`:

```bash
TELEGRAM_SESSION_STRING=your_long_session_string_here
```

## Architecture

### Files Created

- `types/telegram.ts` - TypeScript interfaces
- `types/input.d.ts` - Type definitions for input library
- `services/telegram-client.ts` - Telegram client singleton service
- `tools/telegram-collect-messages.ts` - MCP tool implementation
- `resources/telegram-messages.ts` - MCP resource for cached messages

### Dependencies Added

- `telegram` (GramJS) - Telegram API client
- `input` - Interactive CLI prompts for authentication

## Security Notes

⚠️ **Important Security Considerations:**

1. **Never commit your `.env` file** - It contains sensitive credentials
2. **Session strings are like passwords** - Keep them secure
3. **API credentials are personal** - Don't share them
4. **Messages are cached in memory** - They're cleared when the server restarts
5. **No encryption at rest** - Don't use for sensitive data storage

## Future Enhancements

Potential improvements:

- [ ] Media file download support
- [ ] Export to CSV/JSON files
- [ ] Message filtering (by date, sender, content)
- [ ] Real-time message streaming
- [ ] Message search functionality
- [ ] Persistent storage (database)
- [ ] Multiple account support
