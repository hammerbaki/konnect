import { createContext, useContext, ReactNode } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export interface Notification {
  id: string;
  userId: string;
  type: string;
  title: string;
  message: string;
  linkUrl?: string | null;
  sourceJobId?: string | null;
  isRead: number;
  readAt?: string | null;
  createdAt: string;
}

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  isLoading: boolean;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  refetch: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();

  const { data: notifications = [], isLoading: notificationsLoading, refetch: refetchNotifications } = useQuery<Notification[]>({
    queryKey: ["/api/notifications"],
    queryFn: async () => {
      const res = await fetch("/api/notifications?limit=20", { credentials: "include" });
      if (!res.ok) {
        if (res.status === 401) return [];
        throw new Error("Failed to fetch notifications");
      }
      return res.json();
    },
    refetchInterval: 15000,
    refetchIntervalInBackground: true,
    staleTime: 10000,
  });

  const { data: unreadCountData, refetch: refetchUnreadCount } = useQuery<{ count: number }>({
    queryKey: ["/api/notifications/unread-count"],
    queryFn: async () => {
      const res = await fetch("/api/notifications/unread-count", { credentials: "include" });
      if (!res.ok) {
        if (res.status === 401) return { count: 0 };
        throw new Error("Failed to fetch unread count");
      }
      return res.json();
    },
    refetchInterval: 15000,
    refetchIntervalInBackground: true,
    staleTime: 10000,
  });

  const markAsReadMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/notifications/${id}/read`, {
        method: "PATCH",
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to mark as read");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
      queryClient.invalidateQueries({ queryKey: ["/api/notifications/unread-count"] });
    },
  });

  const markAllAsReadMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/notifications/read-all", {
        method: "PATCH",
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to mark all as read");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
      queryClient.invalidateQueries({ queryKey: ["/api/notifications/unread-count"] });
    },
  });

  const refetch = () => {
    refetchNotifications();
    refetchUnreadCount();
  };

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount: unreadCountData?.count ?? 0,
        isLoading: notificationsLoading,
        markAsRead: (id: string) => markAsReadMutation.mutate(id),
        markAllAsRead: () => markAllAsReadMutation.mutate(),
        refetch,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error("useNotifications must be used within a NotificationProvider");
  }
  return context;
}
