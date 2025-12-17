import { createContext, useContext, ReactNode } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getAuthHeaders } from "@/lib/queryClient";

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
      const authHeaders = await getAuthHeaders();
      const res = await fetch("/api/notifications?limit=20", { 
        credentials: "include",
        headers: authHeaders,
      });
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
      const authHeaders = await getAuthHeaders();
      const res = await fetch("/api/notifications/unread-count", { 
        credentials: "include",
        headers: authHeaders,
      });
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
      const authHeaders = await getAuthHeaders();
      const res = await fetch(`/api/notifications/${id}/read`, {
        method: "PATCH",
        credentials: "include",
        headers: authHeaders,
      });
      if (!res.ok) throw new Error("Failed to mark as read");
      return res.json();
    },
    onMutate: async (id: string) => {
      // Optimistic update - immediately update UI
      await queryClient.cancelQueries({ queryKey: ["/api/notifications"] });
      
      const previousNotifications = queryClient.getQueryData<Notification[]>(["/api/notifications"]);
      const previousCount = queryClient.getQueryData<{ count: number }>(["/api/notifications/unread-count"]);
      
      // Immediately mark this notification as read
      if (previousNotifications) {
        queryClient.setQueryData<Notification[]>(["/api/notifications"], 
          previousNotifications.map(n => n.id === id ? { ...n, isRead: 1 } : n)
        );
      }
      // Decrement count
      if (previousCount && previousCount.count > 0) {
        queryClient.setQueryData(["/api/notifications/unread-count"], { count: previousCount.count - 1 });
      }
      
      return { previousNotifications, previousCount };
    },
    onError: (err, id, context) => {
      // Rollback on error
      if (context?.previousNotifications) {
        queryClient.setQueryData(["/api/notifications"], context.previousNotifications);
      }
      if (context?.previousCount) {
        queryClient.setQueryData(["/api/notifications/unread-count"], context.previousCount);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
      queryClient.invalidateQueries({ queryKey: ["/api/notifications/unread-count"] });
    },
  });

  const markAllAsReadMutation = useMutation({
    mutationFn: async () => {
      const authHeaders = await getAuthHeaders();
      const res = await fetch("/api/notifications/read-all", {
        method: "PATCH",
        credentials: "include",
        headers: authHeaders,
      });
      if (!res.ok) throw new Error("Failed to mark all as read");
      return res.json();
    },
    onMutate: async () => {
      // Optimistic update - immediately update UI
      await queryClient.cancelQueries({ queryKey: ["/api/notifications"] });
      await queryClient.cancelQueries({ queryKey: ["/api/notifications/unread-count"] });
      
      const previousNotifications = queryClient.getQueryData<Notification[]>(["/api/notifications"]);
      const previousCount = queryClient.getQueryData<{ count: number }>(["/api/notifications/unread-count"]);
      
      // Immediately update notifications to show as read
      if (previousNotifications) {
        queryClient.setQueryData<Notification[]>(["/api/notifications"], 
          previousNotifications.map(n => ({ ...n, isRead: 1 }))
        );
      }
      // Immediately set count to 0
      queryClient.setQueryData(["/api/notifications/unread-count"], { count: 0 });
      
      return { previousNotifications, previousCount };
    },
    onError: (err, variables, context) => {
      // Rollback on error
      if (context?.previousNotifications) {
        queryClient.setQueryData(["/api/notifications"], context.previousNotifications);
      }
      if (context?.previousCount) {
        queryClient.setQueryData(["/api/notifications/unread-count"], context.previousCount);
      }
    },
    onSettled: () => {
      // Refetch to ensure consistency
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
