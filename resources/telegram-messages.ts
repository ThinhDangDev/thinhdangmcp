import {
  McpServer,
  ResourceTemplate,
} from "@modelcontextprotocol/sdk/server/mcp.js";
import { ReadResourceResult } from "@modelcontextprotocol/sdk/types.js";

// In-memory storage for collected messages
const messageCache = new Map<string, any>();

/**
 * Store collected messages in cache
 */
export const storeTelegramMessages = (chatId: string, data: any): void => {
  messageCache.set(chatId, {
    data,
    timestamp: new Date().toISOString(),
  });
};

/**
 * Get stored messages from cache
 */
export const getTelegramMessages = (chatId: string): any | null => {
  return messageCache.get(chatId) || null;
};

/**
 * Clear message cache
 */
export const clearTelegramMessages = (chatId?: string): void => {
  if (chatId) {
    messageCache.delete(chatId);
  } else {
    messageCache.clear();
  }
};

/**
 * Register Telegram messages resource
 *
 * Provides URI-based access to collected Telegram messages:
 * - telegram://messages/{chatId} - Get messages for a specific chat
 */
export const registerTelegramMessagesResource = (server: McpServer) => {
  // Register resource template for Telegram messages
  server.registerResource(
    "Telegram Messages",
    new ResourceTemplate("telegram://messages/{chatId}", {
      list: undefined,
    }),
    {
      mimeType: "application/json",
      description:
        "Access collected messages from a Telegram chat. Use telegram-collect-messages tool first to populate data.",
    },
    async (uri, variables): Promise<ReadResourceResult> => {
      const chatId = String(variables.chatId || "");

      if (!chatId) {
        throw new Error("chatId variable is required");
      }

      if (chatId === "list") {
        // Return list of all cached chats
        const chatList = Array.from(messageCache.keys()).map((id) => ({
          chatId: id,
          timestamp: messageCache.get(id)?.timestamp,
          messageCount: messageCache.get(id)?.data?.totalCollected || 0,
        }));

        return {
          contents: [
            {
              uri: uri.toString(),
              mimeType: "application/json",
              text: JSON.stringify({ chats: chatList }, null, 2),
            },
          ],
        };
      }

      // Get messages for specific chat
      const cached = getTelegramMessages(chatId);
      if (!cached) {
        throw new Error(
          `No messages found for chat: ${chatId}. Use telegram-collect-messages tool first.`
        );
      }

      return {
        contents: [
          {
            uri: uri.toString(),
            mimeType: "application/json",
            text: JSON.stringify(cached, null, 2),
          },
        ],
      };
    }
  );
};
