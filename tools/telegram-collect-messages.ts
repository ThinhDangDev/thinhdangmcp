import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";
import { telegramBot } from "../services/telegram-bot.js";
import { CollectMessagesResult } from "../types/telegram.js";

// Tool input schema
export const TelegramCollectMessagesSchema = z.object({
  chatId: z
    .string()
    .describe("Chat ID (numeric) from telegram-list-chats tool"),
  limit: z
    .number()
    .min(1)
    .max(10000)
    .default(100)
    .describe("Maximum number of messages to retrieve (1-10000)"),
  offset: z
    .number()
    .default(0)
    .describe("Offset for pagination (number of messages to skip)"),
  autoConnect: z
    .boolean()
    .default(true)
    .describe("Automatically connect if not connected"),
});

// Tool configuration
const name = "telegram-collect-messages";
const config = {
  title: "Telegram Collect Messages",
  description:
    "Retrieves stored messages from a Telegram chat. Returns messages that the bot has received since it started listening. Use telegram-list-chats to get available chat IDs.",
  inputSchema: TelegramCollectMessagesSchema,
};

/**
 * Registers the 'telegram-collect-messages' tool.
 *
 * This tool retrieves stored messages from a Telegram chat.
 * It requires TELEGRAM_BOT_TOKEN environment variable to be set.
 *
 * @param {McpServer} server - The McpServer instance where the tool will be registered.
 * @returns {void}
 */
export const registerTelegramCollectMessagesTool = (server: McpServer) => {
  server.registerTool(name, config, async (args): Promise<CallToolResult> => {
    try {
      const validatedArgs = TelegramCollectMessagesSchema.parse(args);

      // Get config from environment
      const botToken = process.env.TELEGRAM_BOT_TOKEN;

      if (!botToken) {
        return {
          content: [
            {
              type: "text",
              text:
                "Error: TELEGRAM_BOT_TOKEN environment variable is required.\n\n" +
                "Get your bot token from @BotFather on Telegram:\n" +
                "1. Message @BotFather\n" +
                "2. Send /newbot or /mybots\n" +
                "3. Copy the bot token",
            },
          ],
          isError: true,
        };
      }

      // Connect bot if needed
      if (validatedArgs.autoConnect) {
        telegramBot.connect(botToken);
      }

      // Collect messages
      const result: CollectMessagesResult =
        await telegramBot.fetchRecentMessages(
          validatedArgs.chatId,
          validatedArgs.limit
        );

      // If using stored messages with pagination
      if (result.messages.length === 0 || validatedArgs.offset > 0) {
        const stored = telegramBot.getStoredMessages(
          validatedArgs.chatId,
          validatedArgs.limit,
          validatedArgs.offset
        );

        // Merge chat info if available
        if (result.chatInfo) {
          stored.chatInfo = result.chatInfo;
        }

        result.messages = stored.messages;
        result.totalCollected = stored.totalCollected;
        result.hasMore = stored.hasMore;
        result.nextOffsetId = stored.nextOffsetId;
      }

      // Format response
      const response = {
        success: true,
        data: {
          messages: result.messages.map((msg) => ({
            id: msg.id,
            date: msg.date.toISOString(),
            text: msg.text || "",
            sender: {
              id: msg.senderId,
              username: msg.senderUsername,
              firstName: msg.senderFirstName,
              lastName: msg.senderLastName,
            },
            media: msg.mediaType
              ? {
                  type: msg.mediaType,
                  fileName: msg.mediaFileName,
                }
              : undefined,
            replyToMsgId: msg.replyToMsgId,
            forwarded: msg.forwarded,
            edited: msg.edited,
          })),
          totalCollected: result.totalCollected,
          chatInfo: result.chatInfo,
          pagination: {
            hasMore: result.hasMore,
            nextOffset: result.nextOffsetId,
          },
        },
        note:
          result.messages.length === 0
            ? "No messages found. Make sure:\n" +
              "1. The bot is added to this chat\n" +
              "2. The bot has received messages (use telegram-start-listening first)\n" +
              "3. The chatId is correct (use telegram-list-chats to see available chats)"
            : undefined,
      };

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(response, null, 2),
          },
        ],
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      return {
        content: [
          {
            type: "text",
            text: `Error collecting Telegram messages: ${errorMessage}`,
          },
        ],
        isError: true,
      };
    }
  });
};
