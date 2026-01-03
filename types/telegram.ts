export interface TelegramMessage {
  id: number;
  date: Date;
  text?: string;
  senderId?: string;
  senderUsername?: string;
  senderFirstName?: string;
  senderLastName?: string;
  replyToMsgId?: number;
  mediaType?: "photo" | "video" | "document" | "audio" | "voice" | "sticker";
  mediaFileId?: string;
  mediaFileName?: string;
  forwarded?: boolean;
  edited?: boolean;
}

export interface TelegramChatInfo {
  id: string;
  title?: string;
  type: "user" | "chat" | "channel";
  username?: string;
  memberCount?: number;
}

export interface CollectMessagesResult {
  messages: TelegramMessage[];
  totalCollected: number;
  chatInfo: TelegramChatInfo;
  hasMore: boolean;
  nextOffsetId?: number;
}

export interface TelegramClientConfig {
  apiId: number;
  apiHash: string;
  sessionString?: string;
}
