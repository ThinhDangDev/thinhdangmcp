# Demo MCP Server
This is a demo MCP Server for Thinh Dang for 3 connection types: stdio, sse, and streamableHttp.

## Features

### 🆕 Telegram Bot Integration
Monitor and collect messages from Telegram groups using a bot.

- **Tools**:
  - `telegram-start-listening` - Start/stop bot message collection
  - `telegram-list-chats` - Auto-discover all groups bot is in
  - `telegram-collect-messages` - Retrieve stored messages
- **Resource**: `telegram://messages/{chatId}` - Access via MCP resources
- **Features**: Real-time collection, auto-discovery, in-memory storage, pagination

[📖 Full Documentation](./docs/telegram-bot-feature.md)

### Other Tools
- Echo, environment variables, resource management
- Long-running operations with progress
- File compression (gzip)
- And more...