import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";
import { telegramBot } from "../services/telegram-bot.js";

// Tool input schema
export const TelegramStartListeningSchema = z.object({
  action: z
    .enum(["start", "stop", "status"])
    .default("start")
    .describe("Action to perform: start, stop, or check status"),
});

// Tool configuration
const name = "telegram-start-listening";
const config = {
  title: "Telegram Start Listening",
  description:
    "Start or stop the bot from listening to messages. When started, the bot will automatically store all incoming messages in memory for later retrieval.",
  inputSchema: TelegramStartListeningSchema,
};

/**
 * Registers the 'telegram-start-listening' tool.
 *
 * Controls the bot's message listening state.
 *
 * @param {McpServer} server - The McpServer instance where the tool will be registered.
 * @returns {void}
 */
export const registerTelegramStartListeningTool = (server: McpServer) => {
  server.registerTool(name, config, async (args): Promise<CallToolResult> => {
    try {
      const validatedArgs = TelegramStartListeningSchema.parse(args);

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

      // Connect bot
      telegramBot.connect(botToken);

      let response: any;

      switch (validatedArgs.action) {
        case "start":
          await telegramBot.startListening();
          response = {
            success: true,
            action: "started",
            message:
              "Bot is now listening for messages. All incoming messages will be stored in memory.",
            instructions: [
              "1. Add the bot to your groups/channels",
              "2. Send some messages in those chats",
              "3. Use telegram-list-chats to see available chats",
              "4. Use telegram-collect-messages to retrieve stored messages",
            ],
          };
          break;

        case "stop":
          await telegramBot.stopListening();
          response = {
            success: true,
            action: "stopped",
            message: "Bot has stopped listening for messages.",
            note: "Stored messages are still available until server restart.",
          };
          break;

        case "status":
          const botInfo = await telegramBot.getBotInfo();
          const chats = telegramBot.listChats();
          response = {
            success: true,
            action: "status",
            bot: {
              id: botInfo.id,
              username: botInfo.username,
              firstName: botInfo.first_name,
            },
            stats: {
              totalChats: chats.length,
              totalStoredMessages: telegramBot.getTotalStoredMessages(),
              chats: chats.map((c) => ({
                chatId: c.chatId,
                messageCount: c.messageCount,
              })),
            },
          };
          break;
      }

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
            text: `Error: ${errorMessage}`,
          },
        ],
        isError: true,
      };
    }
  });
};
