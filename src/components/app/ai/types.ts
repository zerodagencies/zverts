export type Msg = { role: "user" | "assistant"; content: string };

export type ChatModelId = "fast" | "smart" | "pro" | "reasoning";

export type StoredChat = {
  id: string;
  title: string;
  messages: Msg[];
  pinned: boolean;
  model: ChatModelId;
  language: "en" | "bn";
  createdAt: number;
  updatedAt: number;
};

export const MODELS: { id: ChatModelId; label: string; description: string }[] = [
  { id: "fast", label: "ZverT Fast", description: "Quick answers" },
  { id: "smart", label: "ZverT Smart", description: "Balanced (default)" },
  { id: "pro", label: "ZverT Pro", description: "Deepest knowledge" },
  { id: "reasoning", label: "ZverT Reasoning", description: "Step-by-step logic" },
];