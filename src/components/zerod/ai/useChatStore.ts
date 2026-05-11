import { useCallback, useEffect, useState } from "react";
import type { StoredChat, Msg, ChatModelId } from "./types";

const key = (userId: string, moduleId: string) => `zvert.chats.${userId}.${moduleId}`;

function read(userId: string, moduleId: string): StoredChat[] {
  try {
    const raw = localStorage.getItem(key(userId, moduleId));
    if (!raw) return [];
    return JSON.parse(raw) as StoredChat[];
  } catch {
    return [];
  }
}
function write(userId: string, moduleId: string, chats: StoredChat[]) {
  try { localStorage.setItem(key(userId, moduleId), JSON.stringify(chats)); } catch { /* noop */ }
}

export function useChatStore(userId: string | null, moduleId: string) {
  const [chats, setChats] = useState<StoredChat[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) return;
    const list = read(userId, moduleId);
    setChats(list);
    setActiveId(list[0]?.id ?? null);
  }, [userId, moduleId]);

  const persist = useCallback((next: StoredChat[]) => {
    setChats(next);
    if (userId) write(userId, moduleId, next);
  }, [userId, moduleId]);

  const newChat = useCallback((model: ChatModelId, language: "en" | "bn") => {
    const id = crypto.randomUUID();
    const chat: StoredChat = {
      id, title: "New chat", messages: [], pinned: false, model, language,
      createdAt: Date.now(), updatedAt: Date.now(),
    };
    persist([chat, ...chats]);
    setActiveId(id);
    return id;
  }, [chats, persist]);

  const updateChat = useCallback((id: string, patch: Partial<StoredChat>) => {
    const next = chats.map((c) => c.id === id ? { ...c, ...patch, updatedAt: Date.now() } : c);
    persist(next);
  }, [chats, persist]);

  const setMessages = useCallback((id: string, messages: Msg[]) => {
    const next = chats.map((c) => {
      if (c.id !== id) return c;
      const title = c.title === "New chat" && messages[0]?.role === "user"
        ? messages[0].content.slice(0, 48)
        : c.title;
      return { ...c, messages, title, updatedAt: Date.now() };
    });
    persist(next);
  }, [chats, persist]);

  const deleteChat = useCallback((id: string) => {
    const next = chats.filter((c) => c.id !== id);
    persist(next);
    if (activeId === id) setActiveId(next[0]?.id ?? null);
  }, [chats, activeId, persist]);

  const togglePin = useCallback((id: string) => {
    const next = chats.map((c) => c.id === id ? { ...c, pinned: !c.pinned } : c);
    persist(next);
  }, [chats, persist]);

  const renameChat = useCallback((id: string, title: string) => {
    updateChat(id, { title });
  }, [updateChat]);

  const active = chats.find((c) => c.id === activeId) ?? null;

  return { chats, active, activeId, setActiveId, newChat, setMessages, updateChat, deleteChat, togglePin, renameChat };
}