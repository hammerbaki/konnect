import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

export interface BookmarkItem {
  id: number;
  bookmarkType: string;
  targetId: number;
  targetName: string;
  memo?: string | null;
  createdAt: string;
}

const QUERY_KEY = ["/api/bookmarks"] as const;

interface UseBookmarksOptions {
  enabled?: boolean;
}

export function useBookmarks({ enabled = true }: UseBookmarksOptions = {}) {
  const queryClient = useQueryClient();

  const { data: bookmarkList = [] } = useQuery<BookmarkItem[]>({
    queryKey: QUERY_KEY,
    staleTime: 1000 * 60 * 2,
    enabled,
  });

  const addBookmark = useMutation<
    BookmarkItem | null,
    Error,
    { bookmarkType: string; targetId: number; targetName: string },
    { previous: BookmarkItem[] }
  >({
    mutationFn: async (data) => {
      const res = await apiRequest("POST", "/api/bookmarks", data);
      if (res.status === 409) return null;
      return res.json();
    },
    onMutate: async (data) => {
      await queryClient.cancelQueries({ queryKey: QUERY_KEY });
      const previous = queryClient.getQueryData<BookmarkItem[]>(QUERY_KEY) ?? [];
      const optimistic: BookmarkItem = {
        id: -Date.now(),
        bookmarkType: data.bookmarkType,
        targetId: data.targetId,
        targetName: data.targetName,
        memo: null,
        createdAt: new Date().toISOString(),
      };
      queryClient.setQueryData<BookmarkItem[]>(QUERY_KEY, [optimistic, ...previous]);
      return { previous };
    },
    onError: (_err, _data, ctx) => {
      if (ctx) queryClient.setQueryData<BookmarkItem[]>(QUERY_KEY, ctx.previous);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
    },
  });

  const removeBookmark = useMutation<
    void,
    Error,
    number,
    { previous: BookmarkItem[] }
  >({
    mutationFn: async (id) => {
      if (id < 0) return;
      await apiRequest("DELETE", `/api/bookmarks/${id}`);
    },
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: QUERY_KEY });
      const previous = queryClient.getQueryData<BookmarkItem[]>(QUERY_KEY) ?? [];
      queryClient.setQueryData<BookmarkItem[]>(
        QUERY_KEY,
        previous.filter((b) => b.id !== id),
      );
      return { previous };
    },
    onError: (_err, _id, ctx) => {
      if (ctx) queryClient.setQueryData<BookmarkItem[]>(QUERY_KEY, ctx.previous);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
    },
  });

  const getBookmark = (type: string, name: string) =>
    bookmarkList.find((b) => b.bookmarkType === type && b.targetName === name);

  const toggleBookmark = (type: string, targetId: number, name: string) => {
    const existing = getBookmark(type, name);
    if (existing) {
      if (existing.id < 0) {
        queryClient.setQueryData<BookmarkItem[]>(
          QUERY_KEY,
          (old) => (old ?? []).filter((b) => !(b.bookmarkType === type && b.targetName === name)),
        );
      } else {
        removeBookmark.mutate(existing.id);
      }
    } else {
      addBookmark.mutate({ bookmarkType: type, targetId, targetName: name });
    }
  };

  return {
    bookmarkList,
    addBookmark,
    removeBookmark,
    getBookmark,
    toggleBookmark,
  };
}
