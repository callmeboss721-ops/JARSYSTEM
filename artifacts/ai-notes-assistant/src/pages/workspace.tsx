import { useEffect, useMemo, useRef, useState, type FormEvent, type KeyboardEvent } from "react";
import { Link, useLocation } from "wouter";
import { useNoteSession, type NoteUser } from "@/lib/note-session";
import type { AiNoteConversationSummary, AiNoteMessage, AiNoteMode } from "@workspace/api-client-react";
import {
  ArrowDown,
  ArrowRight,
  Check,
  ChevronDown,
  ChevronsLeft,
  ChevronsRight,
  CircleHelp,
  Copy,
  FileText,
  Lightbulb,
  LoaderCircle,
  Menu,
  MessageSquareText,
  Moon,
  MoreHorizontal,
  PanelLeft,
  Plus,
  Search,
  Send,
  Sparkles,
  Sun,
  Trash2,
  X,
} from "lucide-react";
import { Button } from "@workspace/jaguar-spk-design-system/components/ui/button";
import { Input } from "@workspace/jaguar-spk-design-system/components/ui/input";
import { Textarea } from "@workspace/jaguar-spk-design-system/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@workspace/jaguar-spk-design-system/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@workspace/jaguar-spk-design-system/components/ui/sheet";
import { Skeleton } from "@workspace/jaguar-spk-design-system/components/ui/skeleton";
import { toast } from "@workspace/jaguar-spk-design-system/hooks/use-toast";
import { MarkdownMessage } from "@/components/markdown-message";
import { useTheme } from "@/components/theme-provider";
import { streamAiNoteResponse, useAiNotes } from "@/hooks/use-ai-notes";

const MODES: { id: AiNoteMode; title: string; short: string; icon: typeof MessageSquareText; description: string }[] = [
  { id: "chat", title: "Chat", short: "Talk it through", icon: MessageSquareText, description: "A thoughtful conversation, at your pace." },
  { id: "summarize", title: "Summarize", short: "Find the signal", icon: FileText, description: "A clear summary from a long note." },
  { id: "action_items", title: "Action Items", short: "Find a next step", icon: Lightbulb, description: "Turn a thought into doable next steps." },
];

function relativeDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const now = new Date();
  if (date.toDateString() === now.toDateString()) return "Today";
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (date.toDateString() === yesterday.toDateString()) return "Yesterday";
  return new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric" }).format(date);
}

function displayName(user: NoteUser | null) {
  return user?.name || "Your space";
}

function HistoryItem({
  item,
  selected,
  onSelect,
  onRename,
  onDelete,
}: {
  item: AiNoteConversationSummary;
  selected: boolean;
  onSelect: (id: string) => void;
  onRename: (item: AiNoteConversationSummary) => void;
  onDelete: (item: AiNoteConversationSummary) => void;
}) {
  const [actionsOpen, setActionsOpen] = useState(false);
  return (
    <div className={`history-item ${selected ? "is-selected" : ""}`} data-testid={`row-conversation-${item.id}`}>
      <Button
        type="button"
        variant="ghost"
        className="history-item__select"
        onClick={() => onSelect(item.id)}
        aria-current={selected ? "page" : undefined}
        data-testid={`button-open-conversation-${item.id}`}
      >
        <span className="history-item__icon" aria-hidden="true"><MessageSquareText /></span>
        <span className="min-w-0 flex-1">
          <span className="history-item__title">{item.title || "Untitled note"}</span>
          <span className="history-item__preview">{item.preview || "A quiet thought, waiting here"}</span>
          <span className="history-item__meta">{relativeDate(item.updated_at)} <span aria-hidden="true">·</span> {item.message_count} messages</span>
        </span>
      </Button>
      <div className="history-item__actions">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          aria-label={`Actions for ${item.title || "untitled note"}`}
          aria-expanded={actionsOpen}
          onClick={() => setActionsOpen((open) => !open)}
          data-testid={`button-conversation-actions-${item.id}`}
        >
          <MoreHorizontal aria-hidden="true" />
        </Button>
        {actionsOpen ? (
          <div className="history-menu" role="group" aria-label="Conversation actions">
            <Button type="button" variant="ghost" size="sm" className="history-menu__item" onClick={() => { setActionsOpen(false); onRename(item); }} data-testid={`button-rename-${item.id}`}>Rename</Button>
            <Button type="button" variant="ghost" size="sm" className="history-menu__item history-menu__danger" onClick={() => { setActionsOpen(false); onDelete(item); }} data-testid={`button-delete-${item.id}`}>Delete</Button>
          </div>
        ) : null}
      </div>
    </div>
  );
}

function HistoryContents({
  items,
  selectedId,
  loading,
  error,
  onRetry,
  onSelect,
  onRename,
  onDelete,
  onNew,
  onClose,
  onSearch,
  onCollapse,
  searchValue,
}: {
  items: AiNoteConversationSummary[];
  selectedId: string | null;
  loading: boolean;
  error: boolean;
  onRetry: () => void;
  onSelect: (id: string) => void;
  onRename: (item: AiNoteConversationSummary) => void;
  onDelete: (item: AiNoteConversationSummary) => void;
  onNew: () => void;
  onClose?: () => void;
  onSearch: (value: string) => void;
  onCollapse?: () => void;
  searchValue: string;
}) {
  return (
    <>
      <div className="history-heading">
        <div><p className="history-overline">YOUR NOTEBOOK</p><h2>Conversations</h2></div>
        <Button type="button" variant="ghost" size="icon" className="history-collapse" aria-label="Collapse history" onClick={onCollapse} data-testid="button-collapse-history">
          <PanelLeft aria-hidden="true" />
        </Button>
      </div>
      <Button type="button" variant="outline" className="new-note-button w-full justify-start" onClick={() => { onNew(); onClose?.(); }} data-testid="button-new-conversation">
        <Plus aria-hidden="true" /> New conversation <span className="new-note-shortcut">N</span>
      </Button>
      <label className="history-search">
        <Search aria-hidden="true" />
        <Input value={searchValue} onChange={(event) => onSearch(event.target.value)} placeholder="Search your notes" aria-label="Search conversations" data-testid="input-search-conversations" />
      </label>
      <div className="history-section-label"><span>RECENT</span><span>{items.length}</span></div>
      <div className="history-list" data-testid="list-conversations">
        {loading ? (
          <div className="flex flex-col gap-2 p-2" aria-label="Loading conversations" data-testid="skeleton-conversations">
            {[0, 1, 2, 3].map((row) => <div key={row} className="flex gap-3 rounded-lg p-3"><Skeleton className="h-9 w-9 rounded-lg" /><div className="flex flex-1 flex-col gap-2"><Skeleton className="h-3 w-3/4" /><Skeleton className="h-3 w-full" /></div></div>)}
          </div>
        ) : error ? (
          <div className="history-state" role="alert">
            <p>Your notebook didn’t load.</p>
            <Button type="button" variant="link" size="sm" onClick={onRetry} data-testid="button-retry-conversations">Try again</Button>
          </div>
        ) : items.length ? (
          items.map((item) => (
            <HistoryItem key={item.id} item={item} selected={selectedId === item.id} onSelect={(id) => { onSelect(id); onClose?.(); }} onRename={onRename} onDelete={onDelete} />
          ))
        ) : (
          <div className="history-empty" data-testid="empty-conversations">
            <span className="history-empty__icon"><FileText aria-hidden="true" /></span>
            <p>{searchValue ? "No notes match that search." : "Your first conversation can start with anything."}</p>
            <Button type="button" variant="link" size="sm" onClick={() => { onNew(); onClose?.(); }} data-testid="button-empty-create">Start a note <ArrowRight aria-hidden="true" /></Button>
          </div>
        )}
      </div>
      <p className="history-private"><span className="privacy-dot" aria-hidden="true" /> Only you can see your notes.</p>
    </>
  );
}

export default function Workspace() {
  const { user, signOut } = useNoteSession();
  const [, setLocation] = useLocation();
  const { theme, toggleTheme } = useTheme();
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [mode, setMode] = useState<AiNoteMode>("chat");
  const [prompt, setPrompt] = useState("");
  const [streamText, setStreamText] = useState("");
  const [streamTitle, setStreamTitle] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamError, setStreamError] = useState("");
  const [historyOpen, setHistoryOpen] = useState(false);
  const [historyCollapsed, setHistoryCollapsed] = useState(false);
  const [renameItem, setRenameItem] = useState<AiNoteConversationSummary | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [deleteItem, setDeleteItem] = useState<AiNoteConversationSummary | null>(null);
  const [optimisticMessages, setOptimisticMessages] = useState<AiNoteMessage[]>([]);
  const [showScrollDown, setShowScrollDown] = useState(false);
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);
  const streamController = useRef<AbortController | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const transcriptRef = useRef<HTMLDivElement>(null);
  const notes = useAiNotes(search, selectedId);
  const items = notes.conversations.data ?? [];
  const current = notes.conversation.data;
  const overview = notes.overview.data;
  const selectedSummary: AiNoteConversationSummary | undefined = items.find((item) => item.id === selectedId) ?? (current ? {
    id: current.id,
    title: current.title,
    mode: current.mode,
    preview: current.messages.at(-1)?.content.slice(0, 240) ?? "",
    message_count: current.messages.length,
    created_at: current.created_at,
    updated_at: current.updated_at,
  } : undefined);
  const activeMode = MODES.find((item) => item.id === mode) ?? MODES[0];
  const messages = useMemo(() => {
    const saved = current?.messages ?? [];
    const unsaved = optimisticMessages.filter((local) => !saved.some(
      (message) => message.id === local.id,
    ));
    return [...saved, ...unsaved];
  }, [current?.messages, optimisticMessages]);

  useEffect(() => {
    setOptimisticMessages([]);
    setStreamText("");
    setStreamTitle("");
    setStreamError("");
  }, [selectedId]);

  useEffect(() => {
    const element = transcriptRef.current;
    if (!element) return;
    const nearBottom = element.scrollHeight - element.scrollTop - element.clientHeight < 140;
    if (nearBottom || isStreaming) element.scrollTo({ top: element.scrollHeight, behavior: "smooth" });
  }, [messages, streamText, isStreaming]);

  useEffect(() => () => streamController.current?.abort(), []);

  useEffect(() => {
    const onShortcut = (event: globalThis.KeyboardEvent) => {
      if (event.key.toLowerCase() !== "n" || event.metaKey || event.ctrlKey || event.altKey) return;
      const target = event.target;
      if (target instanceof HTMLElement && (target.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName))) return;
      event.preventDefault();
      void startNew();
    };
    window.addEventListener("keydown", onShortcut);
    return () => window.removeEventListener("keydown", onShortcut);
  });

  const createConversation = async (conversationMode: AiNoteMode = mode) => {
    try {
      const created = await notes.createConversation.mutateAsync({ data: { mode: conversationMode } });
      setSelectedId(created.id);
      setOptimisticMessages([]);
      notes.refreshCollection();
      return created.id;
    } catch {
      toast({ title: "Could not start a conversation", description: "Please try again in a moment." });
      return null;
    }
  };

  const startNew = async () => {
    streamController.current?.abort();
    setIsStreaming(false);
    setStreamText("");
    setPrompt("");
    setMode("chat");
    await createConversation("chat");
  };

  const submitMessage = async (event?: FormEvent) => {
    event?.preventDefault();
    const content = prompt.trim();
    if (!content || isStreaming) return;
    if (content.length > 16000) {
      toast({ title: "That note is a little long", description: "Keep your message under 16,000 characters." });
      return;
    }
    setPrompt("");
    setStreamError("");
    let id = selectedId;
    if (!id) id = await createConversation();
    if (!id) {
      setPrompt(content);
      return;
    }

    const now = new Date().toISOString();
    const userMessage: AiNoteMessage = {
      id: `local-user-${Date.now()}`,
      role: "user",
      mode,
      content,
      status: "complete",
      created_at: now,
    };
    setOptimisticMessages((existing) => [...existing, userMessage]);
    setStreamText("");
    setStreamTitle("");
    setIsStreaming(true);
    const controller = new AbortController();
    streamController.current = controller;
    let persistedUserMessage = userMessage;
    try {
      await streamAiNoteResponse({
        conversationId: id,
        mode,
        prompt: content,
        signal: controller.signal,
        onText: setStreamText,
        onStart: (savedUserMessage, title) => {
          persistedUserMessage = savedUserMessage;
          setStreamTitle(title);
          setOptimisticMessages([savedUserMessage]);
        },
        onComplete: (assistantMessage) => {
          setStreamText("");
          setOptimisticMessages([persistedUserMessage, assistantMessage]);
        },
      });
      await notes.refreshConversation(id);
      notes.refreshCollection();
      setOptimisticMessages([]);
    } catch (error) {
      if (!controller.signal.aborted) {
        const message = error instanceof Error ? error.message : "The response could not be completed.";
        setStreamError(message);
        toast({ title: "Your response paused", description: message });
      }
      await notes.refreshConversation(id);
    } finally {
      setIsStreaming(false);
      streamController.current = null;
    }
  };

  const stopStreaming = () => streamController.current?.abort();

  const rename = async () => {
    if (!renameItem || !renameValue.trim()) return;
    try {
      await notes.updateConversation.mutateAsync({ id: renameItem.id, data: { title: renameValue.trim() } });
      notes.refreshCollection();
      await notes.refreshConversation(renameItem.id);
      toast({ title: "Conversation renamed" });
      setRenameItem(null);
    } catch {
      toast({ title: "Could not rename", description: "Please try again." });
    }
  };

  const remove = async () => {
    if (!deleteItem) return;
    if (deleteItem.id === selectedId && isStreaming) {
      streamController.current?.abort();
      setIsStreaming(false);
    }
    try {
      await notes.deleteConversation.mutateAsync({ id: deleteItem.id });
      if (selectedId === deleteItem.id) setSelectedId(null);
      notes.refreshCollection();
      setDeleteItem(null);
      toast({ title: "Conversation deleted", description: "It’s been removed from your notebook." });
    } catch {
      toast({ title: "Could not delete this conversation", description: "Please try again." });
    }
  };

  const copyReply = async (messageId: string, content: string) => {
    try {
      await navigator.clipboard.writeText(content);
      setCopiedMessageId(messageId);
      toast({ title: "Reply copied", description: "The response is on your clipboard." });
      window.setTimeout(() => {
        setCopiedMessageId((current) => current === messageId ? null : current);
      }, 1600);
    } catch {
      toast({ title: "Could not copy", description: "Please select and copy the reply manually." });
    }
  };

  const handleComposerKeys = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) {
      event.preventDefault();
      void submitMessage();
    }
  };

  const handleTranscriptScroll = () => {
    const el = transcriptRef.current;
    if (el) setShowScrollDown(el.scrollHeight - el.scrollTop - el.clientHeight > 160);
  };
  const scrollToBottom = () => transcriptRef.current?.scrollTo({ top: transcriptRef.current.scrollHeight, behavior: "smooth" });
  const retryHistory = () => void notes.conversations.refetch();
  const openRename = (item: AiNoteConversationSummary) => { setRenameItem(item); setRenameValue(item.title); };
  const startFromSuggestion = (text: string) => { setPrompt(text); textareaRef.current?.focus(); };

  const sideContent = (
    <HistoryContents
      items={items}
      selectedId={selectedId}
      loading={notes.conversations.isLoading}
      error={notes.conversations.isError}
      onRetry={retryHistory}
      onSelect={(id) => {
        if (id !== selectedId && isStreaming) {
          streamController.current?.abort();
          setIsStreaming(false);
        }
        setSelectedId(id);
        const match = items.find((item) => item.id === id);
        if (match) setMode(match.mode);
      }}
      onRename={openRename}
      onDelete={setDeleteItem}
      onNew={() => void startNew()}
      onClose={() => setHistoryOpen(false)}
      searchValue={search}
      onSearch={setSearch}
      onCollapse={() => setHistoryCollapsed(true)}
    />
  );

  const isEmpty = !current && !optimisticMessages.length && !streamText;
  const isLoadingConversation = Boolean(selectedId) && notes.conversation.isLoading;

  return (
    <main className="workspace-shell min-h-[100dvh] bg-background text-foreground" data-testid="page-workspace">
      <aside className={`desktop-history ${historyCollapsed ? "is-collapsed" : ""}`} aria-label="Conversation history">
        {!historyCollapsed ? sideContent : (
          <div className="collapsed-history">
            <Link href="/workspace" className="brand-lockup brand-lockup--compact" aria-label="Stillnote workspace"><span className="brand-mark" aria-hidden="true"><span /></span></Link>
            <Button type="button" variant="outline" size="icon" aria-label="New conversation" onClick={() => void startNew()} data-testid="button-new-conversation-collapsed"><Plus aria-hidden="true" /></Button>
            <Button type="button" variant="ghost" size="icon" aria-label="Expand history" onClick={() => setHistoryCollapsed(false)} data-testid="button-expand-history"><ChevronsRight aria-hidden="true" /></Button>
          </div>
        )}
        {!historyCollapsed ? (
          <Button type="button" variant="ghost" size="icon" className="desktop-history-collapse-control" aria-label="Collapse history" onClick={() => setHistoryCollapsed(true)} data-testid="button-sidebar-collapse"><ChevronsLeft aria-hidden="true" /></Button>
        ) : null}
      </aside>

      <div className="workspace-main">
        <header className="workspace-topbar">
          <div className="workspace-topbar__left">
            <Button type="button" variant="ghost" size="icon" className="mobile-history-trigger" aria-label="Open conversation history" onClick={() => setHistoryOpen(true)} data-testid="button-open-history">
              <Menu aria-hidden="true" />
            </Button>
            <Link href="/workspace" className="brand-lockup workspace-brand" aria-label="Stillnote workspace">
              <span className="brand-mark" aria-hidden="true"><span /></span><span>stillnote</span>
            </Link>
            <span className="topbar-divider" aria-hidden="true" />
            <div className="workspace-breadcrumb"><span>My notebook</span><ChevronDown aria-hidden="true" /></div>
          </div>
          <div className="workspace-topbar__right">
            <span className="private-indicator"><span className="privacy-dot" aria-hidden="true" /> Private space</span>
            <Button type="button" variant="ghost" size="icon" aria-label={`Switch to ${theme === "light" ? "dark" : "light"} mode`} onClick={toggleTheme} data-testid="button-theme-toggle">
              {theme === "light" ? <Moon aria-hidden="true" /> : <Sun aria-hidden="true" />}
            </Button>
            <div className="user-menu">
              <span className="user-avatar" aria-hidden="true">{displayName(user).slice(0, 1).toUpperCase()}</span>
              <span className="user-name">{displayName(user)}</span>
              <Button type="button" variant="ghost" size="sm" className="sign-out-button" onClick={() => { void signOut().then(() => setLocation("/")); }} data-testid="button-sign-out">Sign out</Button>
            </div>
          </div>
        </header>

        <div className="workspace-content">
          <div className="conversation-topline">
            <div className="conversation-title-wrap">
              {selectedId ? (
                <>
                  <p className="conversation-context">YOUR NOTEBOOK <span>/</span> CONVERSATION</p>
                  <h1 data-testid="text-conversation-title">{current?.title || streamTitle || "A new thought"}</h1>
                </>
              ) : (
                <>
                  <p className="conversation-context">A QUIET PLACE TO THINK</p>
                  <h1 data-testid="text-workspace-greeting">Good to see you, {displayName(user)}.</h1>
                </>
              )}
            </div>
            {selectedId ? (
              <div className="conversation-actions">
                <Button type="button" variant="outline" size="sm" onClick={() => {
                  if (selectedSummary) openRename(selectedSummary);
                }} data-testid="button-rename-current">Rename</Button>
                <Button type="button" variant="ghost" size="icon" aria-label="Delete this conversation" onClick={() => {
                  if (selectedSummary) setDeleteItem(selectedSummary);
                }} data-testid="button-delete-current"><Trash2 aria-hidden="true" /></Button>
              </div>
            ) : null}
          </div>

          <div className="assistant-stage">
            {isLoadingConversation ? (
              <div className="transcript-skeleton" aria-label="Loading conversation" data-testid="skeleton-conversation">
                <Skeleton className="h-20 w-3/4 self-end rounded-2xl" />
                <Skeleton className="h-32 w-full rounded-2xl" />
                <Skeleton className="h-20 w-2/3 self-end rounded-2xl" />
              </div>
            ) : notes.conversation.isError ? (
              <div className="conversation-error" role="alert" data-testid="error-conversation">
                <span><CircleHelp aria-hidden="true" /></span>
                <h2>This conversation couldn’t be opened.</h2>
                <p>Your saved notes are still safe. Try loading this one again.</p>
                <Button type="button" variant="outline" onClick={() => void notes.conversation.refetch()} data-testid="button-retry-conversation">Try again</Button>
              </div>
            ) : isEmpty ? (
              <div className="empty-assistant" data-testid="empty-assistant">
                <div className="empty-mark"><Sparkles aria-hidden="true" /></div>
                <p className="empty-kicker">{selectedId ? "A FRESH PAGE" : "YOUR MIND, UNRUSHED"}</p>
                <h2>{selectedId ? "What would you like to explore?" : "What’s on your mind?"}</h2>
                <p className="empty-description">{activeMode.description} Start with a note, a question, or a thought in progress.</p>
                <div className="suggestion-list">
                  {[
                    "Help me untangle what’s taking up space in my head",
                    "Summarize a thought I’ve been carrying",
                    "Help me choose one small next step",
                  ].map((suggestion, index) => (
                    <Button type="button" variant="outline" className="suggestion-card" key={suggestion} onClick={() => startFromSuggestion(suggestion)} data-testid={`button-suggestion-${index}`}>
                      <span>{suggestion}</span><ArrowRight aria-hidden="true" />
                    </Button>
                  ))}
                </div>
                {overview ? (
                  <p className="quiet-stat" data-testid="text-overview-count">{overview.conversation_count} conversations saved <span aria-hidden="true">·</span> {overview.message_count} thoughts shared</p>
                ) : null}
              </div>
            ) : (
              <div className="transcript" ref={transcriptRef} onScroll={handleTranscriptScroll} role="log" aria-live="polite" aria-label="Conversation messages" data-testid="list-messages">
                {messages.map((message) => (
                  <article className={`message-row ${message.role === "user" ? "message-row--user" : "message-row--assistant"}`} key={message.id} data-testid={`message-${message.role}-${message.id}`}>
                    {message.role === "assistant" ? <span className="assistant-avatar" aria-hidden="true"><Sparkles /></span> : null}
                    <div className="message-content">
                      {message.role === "assistant" ? <p className="message-author">stillnote <span>{MODES.find((m) => m.id === message.mode)?.title}</span></p> : null}
                      <div className={message.role === "user" ? "user-message-bubble" : "assistant-message-body"}>
                        <MarkdownMessage content={message.content} />
                      </div>
                      <div className="message-meta">
                        <time className="message-time">{new Intl.DateTimeFormat(undefined, { hour: "numeric", minute: "2-digit" }).format(new Date(message.created_at))}</time>
                        {message.role === "assistant" && message.content ? (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="message-copy"
                            onClick={() => void copyReply(message.id, message.content)}
                            aria-label="Copy reply"
                            data-testid={`button-copy-reply-${message.id}`}
                          >
                            {copiedMessageId === message.id ? <Check aria-hidden="true" /> : <Copy aria-hidden="true" />}
                            {copiedMessageId === message.id ? "Copied" : "Copy reply"}
                          </Button>
                        ) : null}
                      </div>
                    </div>
                  </article>
                ))}
                {isStreaming && !optimisticMessages.some((message) => message.role === "assistant") ? (
                  <article className="message-row message-row--assistant" data-testid="status-streaming">
                    <span className="assistant-avatar" aria-hidden="true"><Sparkles /></span>
                    <div className="message-content">
                      <p className="message-author">stillnote <span>{activeMode.title}</span></p>
                      <div className="assistant-message-body">
                        {streamText ? <MarkdownMessage content={streamText} /> : <div className="typing-shimmer"><span /><span /><span /></div>}
                      </div>
                    </div>
                  </article>
                ) : null}
                {streamError ? <p className="stream-error" role="alert" data-testid="error-stream">{streamError}</p> : null}
              </div>
            )}
            {showScrollDown && !isEmpty ? (
              <Button type="button" variant="outline" size="icon" className="scroll-to-bottom" aria-label="Scroll to latest message" onClick={scrollToBottom} data-testid="button-scroll-latest"><ArrowDown aria-hidden="true" /></Button>
            ) : null}
          </div>

          <section className="composer-area" aria-label="Write a message">
            <div className="mode-selector" role="group" aria-label="Choose assistant mode" data-testid="group-mode-selector">
              {MODES.map(({ id, title, icon: Icon }) => (
                <Button
                  key={id}
                  type="button"
                  variant="ghost"
                  size="sm"
                  className={`mode-option ${mode === id ? "is-active" : ""}`}
                  aria-pressed={mode === id}
                  onClick={() => setMode(id)}
                  data-testid={`button-mode-${id}`}
                >
                  <Icon aria-hidden="true" />{title}
                </Button>
              ))}
            </div>
            <form className="composer" onSubmit={(event) => void submitMessage(event)}>
              <Textarea
                ref={textareaRef}
                value={prompt}
                onChange={(event) => setPrompt(event.target.value)}
                onKeyDown={handleComposerKeys}
                maxLength={16000}
                rows={1}
                placeholder={mode === "summarize" ? "Paste a note you’d like to make clearer…" : mode === "action_items" ? "What would you like to take action on?" : "Write whatever is on your mind…"}
                aria-label="Your message"
                aria-describedby="composer-help"
                disabled={isStreaming}
                data-testid="input-message"
              />
              <div className="composer-footer">
                <span id="composer-help" className="composer-hint">Shift + Enter for a new line <span aria-hidden="true">·</span> {prompt.length.toLocaleString()} / 16,000</span>
                {isStreaming ? (
                  <Button type="button" variant="outline" size="sm" onClick={stopStreaming} data-testid="button-stop-response"><X aria-hidden="true" /> Stop</Button>
                ) : (
                  <Button type="submit" size="sm" className="send-button" disabled={!prompt.trim()} data-testid="button-send-message">
                    <span>Send</span><Send aria-hidden="true" />
                  </Button>
                )}
              </div>
            </form>
            <p className="composer-disclaimer">Saved notes stay separated by account. Your prompt and recent context are sent to Google Gemini to generate a reply. AI can make mistakes.</p>
          </section>
        </div>
        <footer className="workspace-footer">
          <span>{overview ? `AI requests today: ${overview.requests_today} / ${overview.daily_limit}` : "A little room to think."}</span>
          <span className="workspace-footer__right"><span className="privacy-dot" aria-hidden="true" /> Private to your account</span>
        </footer>
      </div>

      <Sheet open={historyOpen} onOpenChange={setHistoryOpen}>
        <SheetContent side="left" className="mobile-history-sheet">
          <SheetHeader className="sr-only">
            <SheetTitle>Your conversations</SheetTitle>
            <SheetDescription>Browse and search your saved private conversations.</SheetDescription>
          </SheetHeader>
          <div className="mobile-history-sheet__inner">{sideContent}</div>
        </SheetContent>
      </Sheet>

      <Dialog open={Boolean(renameItem)} onOpenChange={(open) => { if (!open) setRenameItem(null); }}>
        <DialogContent className="editorial-dialog" data-testid="dialog-rename">
          <DialogHeader>
            <DialogTitle>Give this conversation a name</DialogTitle>
            <DialogDescription>A small title makes it easier to find again.</DialogDescription>
          </DialogHeader>
          <label className="dialog-field-label" htmlFor="rename-title">Conversation title</label>
          <Input id="rename-title" value={renameValue} maxLength={120} autoFocus onChange={(event) => setRenameValue(event.target.value)} data-testid="input-rename-title" />
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setRenameItem(null)} data-testid="button-cancel-rename">Cancel</Button>
            <Button type="button" disabled={!renameValue.trim() || notes.updateConversation.isPending} onClick={() => void rename()} data-testid="button-save-rename">
              {notes.updateConversation.isPending ? <LoaderCircle className="animate-spin" aria-hidden="true" /> : <Check aria-hidden="true" />} Save name
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(deleteItem)} onOpenChange={(open) => { if (!open) setDeleteItem(null); }}>
        <DialogContent className="editorial-dialog" data-testid="dialog-delete">
          <DialogHeader>
            <DialogTitle>Delete this conversation?</DialogTitle>
            <DialogDescription>“{deleteItem?.title || "Untitled note"}” and its messages will be removed from your notebook. This can’t be undone.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setDeleteItem(null)} data-testid="button-cancel-delete">Keep it</Button>
            <Button type="button" variant="destructive" disabled={notes.deleteConversation.isPending} onClick={() => void remove()} data-testid="button-confirm-delete">
              {notes.deleteConversation.isPending ? <LoaderCircle className="animate-spin" aria-hidden="true" /> : <Trash2 aria-hidden="true" />} Delete conversation
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  );
}
