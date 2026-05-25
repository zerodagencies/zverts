import { Bell, Check, X, CheckCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { useNotifications, requestBrowserNotificationPermission } from "@/hooks/useNotifications";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { useState } from "react";

const categoryEmoji: Record<string, string> = {
  lesson_completed: "✅",
  module_unlocked: "🔓",
  course_completed: "🏆",
  level_up: "🚀",
  streak_milestone: "🔥",
  streak_risk: "⚠️",
  badge_unlocked: "🏅",
  xp_gain: "✨",
  ai_summary: "🧠",
  ai_quiz: "🧩",
  ai_recommendation: "💡",
  weak_topic: "🎯",
  system_success: "✅",
  system_failure: "⚡",
  payment: "💳",
  subscription: "⏳",
  comeback_1d: "👋",
  comeback_3d: "👋",
  comeback_7d: "👋",
  comeback_14d: "👋",
  morning_push: "☀️",
  afternoon_push: "🌤️",
  evening_push: "🌆",
  night_push: "🌙",
  unfinished_lesson: "📚",
  quiz_reminder: "📝",
  playlist_ready: "🎬",
};

export const NotificationCenter = () => {
  const { items, unread, markRead, markAllRead, dismiss, logClick } = useNotifications();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const handleOpenChange = async (v: boolean) => {
    setOpen(v);
    if (v) await requestBrowserNotificationPermission();
  };

  const handleClick = async (id: string, link: string | null) => {
    await markRead(id);
    if (link) {
      await logClick(id);
      setOpen(false);
      navigate(link);
    }
  };

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" aria-label="Notifications" className="relative">
          <Bell className="h-4 w-4" />
          {unread > 0 && (
            <span
              key={unread}
              className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center animate-in zoom-in-50"
            >
              {unread > 99 ? "99+" : unread}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-[360px] p-0">
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-sm">Notifications</span>
            {unread > 0 && <Badge variant="secondary" className="h-5">{unread} new</Badge>}
          </div>
          {unread > 0 && (
            <Button variant="ghost" size="sm" className="h-7 px-2 text-xs" onClick={markAllRead}>
              <CheckCheck className="h-3.5 w-3.5 mr-1" /> Mark all
            </Button>
          )}
        </div>
        <ScrollArea className="max-h-[440px]">
          {items.length === 0 ? (
            <div className="px-6 py-12 text-center text-sm text-muted-foreground">
              <Bell className="h-8 w-8 mx-auto mb-2 opacity-30" />
              এখনো কোনো notification নাই 😌<br/>
              <span className="text-xs">পড়াশোনা শুরু করেন — alerts আসবে!</span>
            </div>
          ) : (
            <ul className="divide-y">
              {items.map((n) => {
                const emoji = categoryEmoji[n.category] ?? "🔔";
                const isUnread = !n.read_at;
                return (
                  <li
                    key={n.id}
                    className={cn(
                      "group relative flex gap-3 px-4 py-3 hover:bg-muted/50 cursor-pointer transition-colors",
                      isUnread && "bg-primary/5"
                    )}
                    onClick={() => handleClick(n.id, n.deep_link)}
                  >
                    <div className="text-xl leading-none mt-0.5">{emoji}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className={cn("text-sm leading-snug truncate", isUnread && "font-semibold")}>{n.title}</p>
                        {isUnread && <span className="mt-1.5 h-2 w-2 rounded-full bg-primary flex-shrink-0" />}
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">{n.body}</p>
                      <p className="text-[10px] text-muted-foreground/70 mt-1">
                        {formatDistanceToNow(new Date(n.sent_at), { addSuffix: true })}
                      </p>
                    </div>
                    <button
                      aria-label="Dismiss"
                      className="opacity-0 group-hover:opacity-100 transition-opacity self-start p-1 rounded hover:bg-muted"
                      onClick={(e) => { e.stopPropagation(); dismiss(n.id); }}
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
};
