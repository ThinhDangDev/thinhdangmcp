import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";
import { telegramBot } from "../services/telegram-bot.js";

// Tool input schema
export const TelegramListChatsSchema = z.object({
  autoConnect: z
    .boolean()
    .default(true)
    .describe("Automatically connect if not connected"),
});

// Tool configuration
const name = "telegram-list-chats";
const config = {
  title: "Telegram List Chats",
  description:
    "Lists all chats/groups that the bot has received messages from. Shows chat IDs and message counts.",
  inputSchema: TelegramListChatsSchema,
};

/**
 * Registers the 'telegram-list-chats' tool.
 *
 * Lists all chats the bot has interacted with.
 *
 * @param {McpServer} server - The McpServer instance where the tool will be registered.
 * @returns {void}
 */
export const registerTelegramListChatsTool = (server: McpServer) => {
  server.registerTool(name, config, async (args): Promise<CallToolResult> => {
    try {
      const validatedArgs = TelegramListChatsSchema.parse(args);

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

      // Get bot info
      const botInfo = await telegramBot.getBotInfo();

      // List chats
      const chats = telegramBot.listChats();

      // Get detailed info for each chat
      const chatsWithInfo = await Promise.all(
        chats.map(async (chat) => {
          try {
            const info = await telegramBot.getChatInfo(chat.chatId);
            return {
              chatId: chat.chatId,
              title: info.title || "Private Chat",
              type: info.type,
              username: info.username,
              messageCount: chat.messageCount,
            };
          } catch (error) {
            return {
              chatId: chat.chatId,
              title: "Unknown",
              type: "unknown",
              messageCount: chat.messageCount,
              error: "Failed to fetch chat info",
            };
          }
        })
      );

      const response = {
        success: true,
        bot: {
          id: botInfo.id,
          username: botInfo.username,
          firstName: botInfo.first_name,
          isBot: botInfo.is_bot,
        },
        chats: chatsWithInfo,
        totalChats: chats.length,
        totalStoredMessages: telegramBot.getTotalStoredMessages(),
        note:
          chats.length === 0
            ? "No chats found. The bot needs to receive at least one message from a chat to track it. Make sure the bot is added to groups and has received messages."
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
            text: `Error listing Telegram chats: ${errorMessage}`,
          },
        ],
        isError: true,
      };
    }
  });
};
