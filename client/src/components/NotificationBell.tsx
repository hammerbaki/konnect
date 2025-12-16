import { Bell, CheckCheck, Trash2, FileText, Target, BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useNotifications, type Notification } from "@/lib/NotificationContext";
import { useLocation } from "wouter";
import { formatDistanceToNow } from "date-fns";
import { ko } from "date-fns/locale";

function NotificationIcon({ type }: { type: string }) {
  switch (type) {
    case "analysis_complete":
      return <BarChart3 className="h-4 w-4 text-blue-500" />;
    case "essay_complete":
      return <FileText className="h-4 w-4 text-violet-500" />;
    case "goal_complete":
      return <Target className="h-4 w-4 text-green-500" />;
    default:
      return <Bell className="h-4 w-4 text-gray-500" />;
  }
}

function NotificationItem({ 
  notification, 
  onRead, 
  onNavigate 
}: { 
  notification: Notification; 
  onRead: (id: string) => void;
  onNavigate: (url: string) => void;
}) {
  const isUnread = notification.isRead === 0;
  
  const handleClick = () => {
    if (isUnread) {
      onRead(notification.id);
    }
    if (notification.linkUrl) {
      onNavigate(notification.linkUrl);
    }
  };

  return (
    <div
      data-testid={`notification-item-${notification.id}`}
      onClick={handleClick}
      className={`flex items-start gap-3 p-3 rounded-lg cursor-pointer transition-colors ${
        isUnread 
          ? "bg-blue-50 hover:bg-blue-100" 
          : "hover:bg-gray-50"
      }`}
    >
      <div className="flex-shrink-0 mt-0.5">
        <NotificationIcon type={notification.type} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className={`text-sm truncate ${isUnread ? "font-semibold text-[#191F28]" : "text-[#4E5968]"}`}>
            {notification.title}
          </p>
          {isUnread && (
            <span className="flex-shrink-0 w-2 h-2 rounded-full bg-blue-500" />
          )}
        </div>
        <p className="text-xs text-[#8B95A1] mt-0.5 line-clamp-2">
          {notification.message}
        </p>
        <p className="text-xs text-[#B0B8C1] mt-1">
          {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true, locale: ko })}
        </p>
      </div>
    </div>
  );
}

export function NotificationBell() {
  const { notifications, unreadCount, isLoading, markAsRead, markAllAsRead } = useNotifications();
  const [, setLocation] = useLocation();

  const handleNavigate = (url: string) => {
    setLocation(url);
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button 
          data-testid="button-notifications"
          variant="ghost" 
          size="icon" 
          className="relative rounded-full h-9 w-9 md:h-10 md:w-10 bg-white text-[#8B95A1] hover:text-[#3182F6] shadow-sm hover:bg-white"
        >
          <Bell className="h-4 w-4 md:h-5 md:w-5" />
          {unreadCount > 0 && (
            <span 
              data-testid="badge-unread-count"
              className="absolute -top-1 -right-1 flex items-center justify-center min-w-[18px] h-[18px] text-[10px] font-bold text-white bg-red-500 rounded-full px-1"
            >
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
          <span className="sr-only">알림 ({unreadCount}개 읽지 않음)</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent 
        align="end" 
        className="w-80 md:w-96 p-0 rounded-xl border-none shadow-[0_8px_30px_rgba(0,0,0,0.12)]"
      >
        <div className="flex items-center justify-between p-4 border-b border-gray-100">
          <h3 className="font-bold text-[#191F28]">알림</h3>
          {unreadCount > 0 && (
            <Button
              data-testid="button-mark-all-read"
              variant="ghost"
              size="sm"
              onClick={markAllAsRead}
              className="text-xs text-[#3182F6] hover:text-[#1B64DA] hover:bg-blue-50 h-7 px-2"
            >
              <CheckCheck className="h-3.5 w-3.5 mr-1" />
              모두 읽음
            </Button>
          )}
        </div>
        <ScrollArea className="max-h-[400px]">
          {isLoading ? (
            <div className="p-4 text-center text-sm text-[#8B95A1]">
              로딩 중...
            </div>
          ) : notifications.length === 0 ? (
            <div className="p-8 text-center">
              <Bell className="h-10 w-10 text-[#D1D6DB] mx-auto mb-3" />
              <p className="text-sm text-[#8B95A1]">알림이 없습니다</p>
            </div>
          ) : (
            <div className="p-2 space-y-1">
              {notifications.map((notification) => (
                <NotificationItem
                  key={notification.id}
                  notification={notification}
                  onRead={markAsRead}
                  onNavigate={handleNavigate}
                />
              ))}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
