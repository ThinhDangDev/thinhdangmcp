import { Telegraf, Context } from "telegraf";
import { Message, Update, Chat } from "telegraf/types";
import {
  TelegramMessage,
  TelegramChatInfo,
  CollectMessagesResult,
} from "../types/telegram.js";

/**
 * Singleton Telegram Bot Service
 * Manages bot connection and message collection
 */
class TelegramBotService {
  private bot: Telegraf | null = null;
  private messageStore: Map<string, TelegramMessage[]> = new Map();
  private isListening = false;

  /**
   * Initialize bot with token
   */
  connect(token: string): void {
    if (this.bot) {
      return;
    }

    this.bot = new Telegraf(token);
    console.log("✅ Telegram bot initialized");
  }

  /**
   * Get bot instance
   */
  getBot(): Telegraf {
    if (!this.bot) {
      throw new Error(
        "Bot not initialized. Call connect() with BOT_TOKEN first."
      );
    }
    return this.bot;
  }

  /**
   * Start listening to messages (stores them in memory)
   */
  async startListening(): Promise<void> {
    if (this.isListening) {
      return;
    }

    const bot = this.getBot();

    // Listen to all messages
    bot.on("message", (ctx) => {
      const msg = ctx.message;
      const chatId = msg.chat.id.toString();

      // Parse and store message
      const parsedMsg = this.parseMessage(msg);

      if (!this.messageStore.has(chatId)) {
        this.messageStore.set(chatId, []);
      }

      const messages = this.messageStore.get(chatId)!;
      messages.push(parsedMsg);

      // Keep only last 10000 messages per chat
      if (messages.length > 10000) {
        messages.shift();
      }

      const chatName =
        "title" in msg.chat ? msg.chat.title : `Chat ${msg.chat.id}`;
      console.log(
        `📨 Stored message from ${chatName}: ${
          parsedMsg.text?.substring(0, 50) || "[media]"
        }`
      );
    });

    // Start bot
    await bot.launch();
    this.isListening = true;
    console.log("🤖 Bot is now listening for messages...");

    // Enable graceful stop
    process.once("SIGINT", () => bot.stop("SIGINT"));
    process.once("SIGTERM", () => bot.stop("SIGTERM"));
  }

  /**
   * Stop listening
   */
  async stopListening(): Promise<void> {
    if (this.bot && this.isListening) {
      await this.bot.stop();
      this.isListening = false;
      console.log("🛑 Bot stopped listening");
    }
  }

  /**
   * Get bot info
   */
  async getBotInfo(): Promise<any> {
    const bot = this.getBot();
    return await bot.telegram.getMe();
  }

  /**
   * List all chats bot has received messages from
   */
  listChats(): Array<{ chatId: string; messageCount: number }> {
    return Array.from(this.messageStore.entries()).map(
      ([chatId, messages]) => ({
        chatId,
        messageCount: messages.length,
      })
    );
  }

  /**
   * Get chat info
   */
  async getChatInfo(chatId: string | number): Promise<TelegramChatInfo> {
    const bot = this.getBot();
    const chat = await bot.telegram.getChat(chatId);

    return this.parseChatInfo(chat);
  }

  /**
   * Get stored messages for a chat
   */
  getStoredMessages(
    chatId: string,
    limit = 100,
    offset = 0
  ): CollectMessagesResult {
    const messages = this.messageStore.get(chatId) || [];

    // Get slice with pagination
    const sliced = messages.slice(offset, offset + limit);

    return {
      messages: sliced,
      totalCollected: sliced.length,
      chatInfo: {
        id: chatId,
        type: "chat",
      },
      hasMore: offset + limit < messages.length,
      nextOffsetId:
        offset + limit < messages.length ? offset + limit : undefined,
    };
  }

  /**
   * Fetch recent messages from a chat using getUpdates
   * Note: This only works for messages the bot has access to
   */
  async fetchRecentMessages(
    chatId: string | number,
    limit = 100
  ): Promise<CollectMessagesResult> {
    const bot = this.getBot();

    try {
      // Get chat info
      const chatInfo = await this.getChatInfo(chatId);
      console.log("chatId", chatId);
      console.log("limit", limit);
      console.log("chatInfo", chatInfo);

      // Try to get stored messages first
      const stored = this.getStoredMessages(chatId.toString(), limit);

      if (stored.messages.length > 0) {
        stored.chatInfo = chatInfo;
        return stored;
      }

      // If no stored messages, return empty with chat info
      return {
        messages: [],
        totalCollected: 0,
        chatInfo,
        hasMore: false,
      };
    } catch (error) {
      throw new Error(
        `Failed to fetch messages: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    }
  }

  /**
   * Parse Telegram message to our format
   */
  private parseMessage(msg: Message): TelegramMessage {
    console.log("msg", msg);
    const message: TelegramMessage = {
      id: msg.message_id,
      date: new Date(msg.date * 1000),
    };

    // Extract text
    if ("text" in msg) {
      message.text = msg.text;
    } else if ("caption" in msg) {
      message.text = msg.caption;
    }

    // Extract sender info
    if ("from" in msg && msg.from) {
      message.senderId = msg.from.id.toString();
      message.senderUsername = msg.from.username;
      message.senderFirstName = msg.from.first_name;
      message.senderLastName = msg.from.last_name;
    }

    // Extract reply info
    if ("reply_to_message" in msg && msg.reply_to_message) {
      message.replyToMsgId = msg.reply_to_message.message_id;
    }

    // Extract media info
    if ("photo" in msg) {
      message.mediaType = "photo";
    } else if ("video" in msg) {
      message.mediaType = "video";
    } else if ("document" in msg) {
      message.mediaType = "document";
      message.mediaFileName = msg.document.file_name;
    } else if ("audio" in msg) {
      message.mediaType = "audio";
    } else if ("voice" in msg) {
      message.mediaType = "voice";
    } else if ("sticker" in msg) {
      message.mediaType = "sticker";
    }

    // Check if forwarded or edited
    if ("forward_date" in msg) {
      message.forwarded = true;
    }
    if ("edit_date" in msg) {
      message.edited = true;
    }

    return message;
  }

  /**
   * Parse chat info
   */
  private parseChatInfo(chat: Chat): TelegramChatInfo {
    const info: TelegramChatInfo = {
      id: chat.id.toString(),
      type: chat.type as "user" | "chat" | "channel",
    };

    if ("title" in chat) {
      info.title = chat.title;
    }
    if ("username" in chat) {
      info.username = chat.username;
    }

    return info;
  }

  /**
   * Clear stored messages
   */
  clearMessages(chatId?: string): void {
    if (chatId) {
      this.messageStore.delete(chatId);
    } else {
      this.messageStore.clear();
    }
  }

  /**
   * Get total stored messages count
   */
  getTotalStoredMessages(): number {
    let total = 0;
    for (const messages of this.messageStore.values()) {
      total += messages.length;
    }
    return total;
  }
}

// Export singleton instance
export const telegramBot = new TelegramBotService();
