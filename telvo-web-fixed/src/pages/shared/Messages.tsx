import type { FormEvent } from 'react';
import { useEffect, useState, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Send } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { useAuth } from '@/contexts/AuthContext';
import { listenToThreads, listenToMessages, sendMessage, ensureChatThread, markThreadAsRead } from '@/services/chatService';
import { getUserById } from '@/services/userService';
import type { ChatThread, ChatMessage, TelvoUser } from '@/types';
import { timeAgo } from '@/utils/format';
import { MessageCircle } from 'lucide-react';

export function Messages() {
  const { profile } = useAuth();
  const [params] = useSearchParams();
  const withUserId = params.get('with');
  const chatIdParam = params.get('chat');
  const [threads, setThreads] = useState<ChatThread[] | null>(null);
  const [participants, setParticipants] = useState<Record<string, TelvoUser>>({});
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [text, setText] = useState('');
  const [search, setSearch] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!profile) return;
    return listenToThreads(profile.id, setThreads);
  }, [profile]);

  useEffect(() => {
    if (!threads && !withUserId) return;
    const otherIds = new Set<string>();
    threads?.forEach((t) => t.participantIds.forEach((p) => p !== profile?.id && otherIds.add(p)));
    if (withUserId) otherIds.add(withUserId);
    otherIds.forEach((id) => {
      if (!participants[id]) getUserById(id).then((u) => u && setParticipants((prev) => ({ ...prev, [id]: u })));
    });
  }, [threads, withUserId, participants]);

  useEffect(() => {
    if (!profile) return;
    if (chatIdParam) {
      setActiveChatId(chatIdParam);
      return;
    }
    if (withUserId) {
      ensureChatThread(profile.id, withUserId).then(setActiveChatId);
      return;
    }
    if (threads === null) return;
    if (threads.length > 0) {
      setActiveChatId((prev) => prev || threads[0].id);
    } else {
      setActiveChatId(null);
    }
  }, [chatIdParam, withUserId, threads, profile]);

  const currentUserId = profile?.id;
  if (!profile || !currentUserId) return null;

  const threadList = threads ?? [];
  const pendingThread = withUserId && activeChatId && !threadList.some((t) => t.id === activeChatId)
    ? { id: activeChatId, participantIds: [currentUserId, withUserId], jobId: undefined, lastMessage: 'Starting a conversation...', lastMessageAt: null } as ChatThread
    : undefined;
  const displayedThreads = pendingThread ? [pendingThread, ...threadList] : threadList;
  const filteredThreads = displayedThreads.filter((thread) => {
    const otherId = thread.participantIds.find((p) => p !== currentUserId) ?? '';
    const other = participants[otherId];
    const otherName = other?.fullName ?? 'Unknown';
    const lastMessage = thread.lastMessage ?? '';
    const query = search.trim().toLowerCase();
    if (query.length === 0) return true;
    return otherName.toLowerCase().includes(query) || lastMessage.toLowerCase().includes(query);
  });

  useEffect(() => {
    if (!activeChatId) return;
    return listenToMessages(activeChatId, setMessages);
  }, [activeChatId]);

  useEffect(() => {
    if (!activeChatId || !profile) return;
    const unread = messages.some((m) => m.receiverId === profile.id && !m.isRead);
    if (!unread) return;
    markThreadAsRead(activeChatId, profile.id).catch((error) => {
      console.error('[TELVO] Failed to mark chat messages as read:', error);
    });
  }, [activeChatId, profile, messages]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const activeThread = activeChatId ? displayedThreads.find((t) => t.id === activeChatId) : undefined;
  const activeOtherId = activeThread ? activeThread.participantIds.find((p) => p !== profile?.id) : withUserId;

  const handleSend = async (e: FormEvent) => {
    e.preventDefault();
    if (!profile || !activeChatId || !text.trim()) return;
    const otherId = threads?.find((t) => t.id === activeChatId)?.participantIds.find((p) => p !== profile.id) || withUserId;
    if (!otherId) return;
    await sendMessage(activeChatId, profile.id, otherId, text.trim());
    setText('');
  };

  return (
    <div className="h-[calc(100vh-8rem)] flex gap-4">
      <Card className="w-full sm:w-72 flex-shrink-0 overflow-hidden hidden sm:flex flex-col">
        <div className="p-4 border-b border-ink-100">
          <div className="text-sm font-semibold text-ink-900">Messages</div>
          <div className="text-xs text-ink-500">Chats with customers, professionals, and businesses.</div>
        </div>
        <div className="p-3">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search conversations..."
            className="w-full rounded-full border border-ink-200 px-4 py-2 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
          />
        </div>
        <div className="flex-1 overflow-y-auto">
          {threads === null && <p className="p-4 text-sm text-ink-400">Loading...</p>}
          {threads?.length === 0 && !withUserId && <div className="p-4"><EmptyState icon={<MessageCircle size={32} />} title="No conversations yet" description="Messages with professionals and customers will appear here." /></div>}
          {filteredThreads.map((t) => {
            const otherId = t.participantIds.find((p) => p !== profile.id);
            const other = otherId ? participants[otherId] : undefined;
            const unread = t.unreadCount?.[profile.id] ?? 0;
            return (
              <button
                key={t.id}
                onClick={() => setActiveChatId(t.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 text-left border-b border-ink-100 hover:bg-ink-50 ${activeChatId === t.id ? 'bg-brand-50' : ''}`}
              >
                <span className="w-11 h-11 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center text-sm font-bold flex-shrink-0">
                  {other?.fullName?.[0] || '?'}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-ink-900 truncate">{other?.fullName || 'User'}</p>
                    {unread > 0 && (
                      <span className="ml-auto inline-flex h-6 min-w-[1.5rem] items-center justify-center rounded-full bg-brand-600 px-2 text-[11px] font-semibold text-white">
                        {unread}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-ink-500 truncate">{t.lastMessage || 'No messages yet'}</p>
                </div>
              </button>
            );
          })}
        </div>
      </Card>

      <Card className="flex-1 flex flex-col overflow-hidden">
        {activeChatId ? (
          <>
            <div className="px-4 py-3 border-b border-ink-100">
              <div className="text-base font-semibold text-ink-900">
                {(activeOtherId && participants[activeOtherId]?.fullName) || 'Conversation'}
              </div>
              <div className="text-xs text-ink-500 mt-1">
                {activeOtherId && participants[activeOtherId]
                  ? participants[activeOtherId]!.isOnline
                    ? 'Online'
                    : participants[activeOtherId]!.lastActive
                      ? `Last active ${timeAgo(participants[activeOtherId]!.lastActive)}`
                      : 'Offline'
                  : 'Chat room'}
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages.map((m) => (
                <div key={m.id} className={`flex ${m.senderId === currentUserId ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-sm ${m.senderId === currentUserId ? 'bg-brand-500 text-white' : 'bg-ink-100 text-ink-800'}`}>
                    <div>{m.message}</div>
                    <div className={`mt-1 flex items-center gap-1 text-[10px] ${m.senderId === currentUserId ? 'text-brand-100' : 'text-ink-400'}`}>
                      <span>{timeAgo(m.timestamp)}</span>
                      {m.senderId === currentUserId && (
                        <span className="inline-flex items-center gap-1 text-[10px] text-brand-100">
                          {m.isRead ? 'Read' : 'Sent'}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              <div ref={bottomRef} />
            </div>
            <form onSubmit={handleSend} className="p-3 border-t border-ink-100 flex gap-2">
              <input
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Type a message..."
                className="flex-1 h-11 px-4 rounded-xl border border-ink-200 text-sm outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500"
              />
              <button type="submit" className="w-11 h-11 rounded-xl bg-brand-500 text-white flex items-center justify-center hover:bg-brand-600">
                <Send size={17} />
              </button>
            </form>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-sm text-ink-400">Select a conversation</div>
        )}
      </Card>
    </div>
  );
}
