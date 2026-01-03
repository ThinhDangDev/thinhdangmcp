# Telegram Bot Message Collection Feature

## Overview

This MCP server includes Telegram Bot integration to collect and monitor messages from groups, channels, and chats where your bot is a member.

**Key Features:**

- 🤖 Simple bot-based approach (no phone authentication needed)
- 📋 Auto-discovery of all groups/chats bot is in
- 💾 Real-time message storage in memory
- 🔍 Easy message retrieval with pagination
- 📊 Chat statistics and monitoring

## Prerequisites

### 1. Create a Telegram Bot

1. Open Telegram and message [@BotFather](https://t.me/botfather)
2. Send `/newbot` command
3. Follow the prompts to name your bot
4. Copy the **Bot Token** (looks like: `123456789:ABCdefGHIjklMNOpqrsTUVwxyz`)

### 2. Add Bot to Groups

1. Add your bot to the groups/channels you want to monitor
2. (Optional) Make bot an admin to see all messages
3. Without admin rights, bot only sees:
   - Messages that mention the bot
   - Commands sent to the bot
   - Messages in groups where privacy mode is disabled

### 3. Set Environment Variable

Add to your `.env` file:

```bash
TELEGRAM_BOT_TOKEN=123456789:ABCdefGHIjklMNOpqrsTUVwxyz
```

## Usage Workflow

### Step 1: Start Listening

First, start the bot to begin collecting messages:

```javascript
// Call telegram-start-listening tool
{
  "action": "start"
}
```

**Response:**

```json
{
  "success": true,
  "action": "started",
  "message": "Bot is now listening for messages...",
  "instructions": [
    "1. Add the bot to your groups/channels",
    "2. Send some messages in those chats",
    "3. Use telegram-list-chats to see available chats",
    "4. Use telegram-collect-messages to retrieve stored messages"
  ]
}
```

### Step 2: List Available Chats

See all groups/chats the bot has received messages from:

```javascript
// Call telegram-list-chats tool
{
  "autoConnect": true
}
```

**Response:**

```json
{
  "success": true,
  "bot": {
    "id": 123456789,
    "username": "my_bot",
    "firstName": "My Bot",
    "isBot": true
  },
  "chats": [
    {
      "chatId": "-1001234567890",
      "title": "My Group Chat",
      "type": "supergroup",
      "username": "mygroupchat",
      "messageCount": 150
    },
    {
      "chatId": "-1009876543210",
      "title": "Another Channel",
      "type": "channel",
      "messageCount": 75
    }
  ],
  "totalChats": 2,
  "totalStoredMessages": 225
}
```

### Step 3: Collect Messages

Retrieve stored messages from a specific chat:

```javascript
// Call telegram-collect-messages tool
{
  "chatId": "-1001234567890",
  "limit": 50,
  "offset": 0
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "messages": [
      {
        "id": 12345,
        "date": "2026-01-03T14:00:00.000Z",
        "text": "Hello everyone!",
        "sender": {
          "id": "987654321",
          "username": "john_doe",
          "firstName": "John",
          "lastName": "Doe"
        },
        "replyToMsgId": null,
        "forwarded": false,
        "edited": false
      }
    ],
    "totalCollected": 50,
    "chatInfo": {
      "id": "-1001234567890",
      "title": "My Group Chat",
      "type": "supergroup"
    },
    "pagination": {
      "hasMore": true,
      "nextOffset": 50
    }
  }
}
```

## Available Tools

### 1. `telegram-start-listening`

Start/stop the bot or check status.

**Parameters:**

- `action`: "start" | "stop" | "status" (default: "start")

**Actions:**

- **start**: Begin listening for messages
- **stop**: Stop listening (stored messages remain)
- **status**: Check bot status and statistics

**Example:**

```json
{ "action": "status" }
```

### 2. `telegram-list-chats`

List all chats the bot has received messages from.

**Parameters:**

- `autoConnect`: boolean (default: true)

**Returns:**

- Bot information
- List of chats with titles and message counts
- Total statistics

### 3. `telegram-collect-messages`

Retrieve stored messages from a chat.

**Parameters:**

- `chatId`: string (required) - Get from telegram-list-chats
- `limit`: number (1-10000, default: 100)
- `offset`: number (default: 0) - For pagination
- `autoConnect`: boolean (default: true)

**Returns:**

- Array of messages with full metadata
- Chat information
- Pagination info

## Important Notes

### Message Storage

- ✅ Messages are stored in **memory** (RAM)
- ✅ Up to 10,000 messages per chat
- ⚠️ Messages are **lost on server restart**
- ⚠️ Bot only stores messages received **after** it starts listening

### Bot Permissions

**To see all messages**, the bot needs:

1. Be added to the group/channel
2. Either:
   - Be an admin, OR
   - Group has "privacy mode" disabled

**Privacy Mode:**

- Enabled (default): Bot only sees mentions and commands
- Disabled: Bot sees all messages
- To disable: Group Settings → Bots → Privacy Mode OFF

### Rate Limits

- Telegram Bot API: 30 messages/second
- No rate limiting on message retrieval (from memory)

## Pagination Example

Collect all messages from a chat:

```javascript
let offset = 0;
let hasMore = true;
const allMessages = [];

while (hasMore) {
  const result = await callTool("telegram-collect-messages", {
    chatId: "-1001234567890",
    limit: 1000,
    offset,
  });

  allMessages.push(...result.data.messages);
  hasMore = result.data.pagination.hasMore;
  offset = result.data.pagination.nextOffset || 0;
}

console.log(`Collected ${allMessages.length} total messages`);
```

## Resource Access

Messages can also be accessed via MCP resources:

```
telegram://messages/{chatId}
telegram://messages/list
```

Example:

```javascript
const messages = await readResource("telegram://messages/-1001234567890");
const chatList = await readResource("telegram://messages/list");
```

## Troubleshooting

### "No chats found"

**Solution:**

1. Make sure bot is added to groups
2. Send at least one message in each group
3. Ensure bot has started listening (`telegram-start-listening`)

### "No messages found"

**Possible causes:**

- Bot wasn't listening when messages were sent
- Privacy mode is enabled and bot isn't mentioned
- Wrong chatId (use `telegram-list-chats` to verify)

**Solution:**

1. Start listening: `telegram-start-listening`
2. Send new messages in the group
3. Check chat list: `telegram-list-chats`
4. Collect messages: `telegram-collect-messages`

### Bot not seeing all messages

**Solution:**

1. Make bot an admin in the group, OR
2. Disable privacy mode:
   - Group Settings → Bots → Privacy Mode → OFF

### Messages disappear after restart

**Expected behavior** - Messages are stored in memory only.

**Solution for persistence:**

- Export messages before restart
- Implement database storage (future enhancement)

## Comparison: Bot vs User Account

| Feature              | Bot (Current)          | User Account (GramJS)   |
| -------------------- | ---------------------- | ----------------------- |
| Setup                | ✅ Simple (just token) | ❌ Complex (phone auth) |
| Historical messages  | ❌ No                  | ✅ Yes                  |
| Auto-discover groups | ✅ Yes                 | ❌ No                   |
| Privacy              | ✅ Respects settings   | ⚠️ Sees everything      |
| Rate limits          | ✅ Higher              | ⚠️ Lower                |
| Maintenance          | ✅ Easy                | ⚠️ Session management   |

## Architecture

### Files

- `services/telegram-bot.ts` - Bot service singleton
- `tools/telegram-start-listening.ts` - Start/stop listening
- `tools/telegram-list-chats.ts` - List chats
- `tools/telegram-collect-messages.ts` - Retrieve messages
- `resources/telegram-messages.ts` - Resource access
- `types/telegram.ts` - TypeScript interfaces

### Dependencies

- `telegraf` - Modern Telegram Bot framework

## Security

⚠️ **Security Considerations:**

1. **Bot Token = Password** - Keep it secret
2. **Never commit .env** - Add to .gitignore
3. **Memory storage** - Messages not encrypted
4. **Access control** - Anyone with MCP access can read messages
5. **Group privacy** - Respect group rules and privacy

## Future Enhancements

- [ ] Persistent storage (database)
- [ ] Message search and filtering
- [ ] Media file download
- [ ] Export to CSV/JSON
- [ ] Webhook support (instead of polling)
- [ ] Message statistics and analytics
- [ ] Multi-bot support
- [ ] Encrypted storage

## Example: Complete Workflow

```javascript
// 1. Start the bot
await callTool("telegram-start-listening", { action: "start" });

// 2. Wait for messages (or send some in your groups)
// ...

// 3. List available chats
const chats = await callTool("telegram-list-chats", {});
console.log("Available chats:", chats.data.chats);

// 4. Pick a chat and collect messages
const chatId = chats.data.chats[0].chatId;
const messages = await callTool("telegram-collect-messages", {
  chatId,
  limit: 100,
});

console.log(`Collected ${messages.data.totalCollected} messages`);

// 5. Check status anytime
const status = await callTool("telegram-start-listening", { action: "status" });
console.log("Bot status:", status);
```

## Support

For issues or questions:

1. Check Telegram Bot API docs: https://core.telegram.org/bots/api
2. Telegraf documentation: https://telegraf.js.org
3. Review server logs for errors
