import { createContext, useCallback, useContext, type ReactNode } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export type NoteUser = {
  id: string;
  name: string;
};

type SessionResponse = {
  authenticated: boolean;
  user: NoteUser | null;
};

type NoteSessionContextValue = {
  isLoading: boolean;
  authenticated: boolean;
  user: NoteUser | null;
  signIn: (name?: string) => Promise<NoteUser>;
  signOut: () => Promise<void>;
  isSubmitting: boolean;
};

const SESSION_QUERY_KEY = ["/api/ai-notes/session"] as const;
const NoteSessionContext = createContext<NoteSessionContextValue | null>(null);

async function fetchSession(): Promise<SessionResponse> {
  const response = await fetch("/api/ai-notes/session", { credentials: "include" });
  if (!response.ok) return { authenticated: false, user: null };
  return (await response.json()) as SessionResponse;
}

export function NoteSessionProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const sessionQuery = useQuery({
    queryKey: SESSION_QUERY_KEY,
    queryFn: fetchSession,
    staleTime: 60_000,
    retry: false,
  });

  const signInMutation = useMutation({
    mutationFn: async (name?: string) => {
      const response = await fetch("/api/ai-notes/session", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name?.trim() || undefined }),
      });
      if (!response.ok) throw new Error("Could not start session");
      const data = (await response.json()) as SessionResponse;
      if (!data.user) throw new Error("Missing session user");
      return data.user;
    },
    onSuccess: (user) => {
      queryClient.setQueryData<SessionResponse>(SESSION_QUERY_KEY, {
        authenticated: true,
        user,
      });
    },
  });

  const signOutMutation = useMutation({
    mutationFn: async () => {
      await fetch("/api/ai-notes/session", {
        method: "DELETE",
        credentials: "include",
      });
    },
    onSettled: () => {
      queryClient.clear();
      queryClient.setQueryData<SessionResponse>(SESSION_QUERY_KEY, {
        authenticated: false,
        user: null,
      });
    },
  });

  const signIn = useCallback(
    (name?: string) => signInMutation.mutateAsync(name),
    [signInMutation],
  );
  const signOut = useCallback(
    () => signOutMutation.mutateAsync(),
    [signOutMutation],
  );

  return (
    <NoteSessionContext.Provider
      value={{
        isLoading: sessionQuery.isLoading,
        authenticated: Boolean(sessionQuery.data?.authenticated && sessionQuery.data?.user),
        user: sessionQuery.data?.user ?? null,
        signIn,
        signOut,
        isSubmitting: signInMutation.isPending || signOutMutation.isPending,
      }}
    >
      {children}
    </NoteSessionContext.Provider>
  );
}

export function useNoteSession(): NoteSessionContextValue {
  const ctx = useContext(NoteSessionContext);
  if (!ctx) throw new Error("useNoteSession must be used inside NoteSessionProvider");
  return ctx;
}
