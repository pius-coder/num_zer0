'use client'

import { useState, useEffect, useRef } from 'react'
import {
    Search,
    Send,
    MoreVertical,
    CheckCheck,
    Clock,
    Layout,
    MessageCircle
} from 'lucide-react'
import { AdminPageShell } from '../_components/admin-page-shell'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useAdminMessages } from '@/hooks/use-admin'
import { cn } from '@/lib/utils'
import { formatDistanceToNow } from 'date-fns'
import { fr } from 'date-fns/locale'
import { toast } from 'sonner'

export default function AdminMessagesPage() {
    const { messages, isLoading, reply, markRead } = useAdminMessages()
    const [selectedUserId, setSelectedUserId] = useState<string | null>(null)
    const [replyText, setReplyText] = useState('')
    const messagesEndRef = useRef<HTMLDivElement>(null)

    // Group messages by user
    const conversations = (messages || []).reduce((acc: any, msg: any) => {
        const userId = msg.userId
        if (!acc[userId]) {
            acc[userId] = {
                userId,
                userName: msg.user?.name || 'Utilisateur',
                userEmail: msg.user?.email,
                userImage: msg.user?.image,
                messages: [],
                unreadCount: 0,
                lastMessage: msg
            }
        }
        acc[userId].messages.push(msg)
        if (!msg.isRead && msg.direction === 'user_to_admin') {
            acc[userId].unreadCount++
        }
        return acc
    }, {})

    const conversationList = Object.values(conversations).sort((a: any, b: any) =>
        new Date(b.lastMessage.createdAt).getTime() - new Date(a.lastMessage.createdAt).getTime()
    )

    const selectedConversation = selectedUserId ? (conversations as any)[selectedUserId] : null
    const activeMessages = selectedConversation ? [...selectedConversation.messages].sort((a: any, b: any) =>
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    ) : []

    // Auto scroll to bottom using a dummy div at the end
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [activeMessages])

    // Mark as read when selecting conversation
    useEffect(() => {
        if (selectedUserId && (conversations as any)[selectedUserId]?.unreadCount > 0) {
            (conversations as any)[selectedUserId].messages
                .filter((m: any) => !m.isRead && m.direction === 'user_to_admin')
                .forEach((m: any) => markRead.mutate(m.id))
        }
    }, [selectedUserId])

    const handleSend = async () => {
        if (!replyText.trim() || !selectedUserId) return

        // Find the latest message ID from the user to reply to
        const lastUserMsg = activeMessages.filter((m: any) => m.direction === 'user_to_admin').pop()
        if (!lastUserMsg) return

        try {
            await reply.mutateAsync({
                messageId: lastUserMsg.id,
                content: replyText
            })
            setReplyText('')
        } catch (err: any) {
            toast.error(err instanceof Error ? err.message : 'Une erreur est survenue')
        }
    }

    return (
        <AdminPageShell
            title="Messages Support"
            subtitle="Flux centralisé des communications clients. Répondez aux demandes en temps réel."
        >
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 h-[calc(100vh-280px)] min-h-[600px]">
                {/* Sidebar: Message List */}
                <div className="md:col-span-4 flex flex-col rounded-2xl border bg-card/50 backdrop-blur-sm overflow-hidden shadow-sm">
                    <div className="p-4 border-b bg-muted/20">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                            <Input placeholder="Filtrer par nom ou email..." className="pl-9 bg-background/50 border-none shadow-none focus-visible:ring-1" />
                        </div>
                    </div>

                    <ScrollArea className="flex-1">
                        <div className="divide-y divide-border/50">
                            {isLoading ? (
                                Array.from({ length: 5 }).map((_, i) => (
                                    <div key={i} className="p-4 flex items-center gap-3 animate-pulse">
                                        <div className="h-10 w-10 rounded-full bg-muted" />
                                        <div className="flex-1 space-y-2">
                                            <div className="h-3 w-24 bg-muted rounded" />
                                            <div className="h-2 w-full bg-muted rounded" />
                                        </div>
                                    </div>
                                ))
                            ) : conversationList.length === 0 ? (
                                <div className="p-8 text-center flex flex-col items-center gap-3 text-muted-foreground">
                                    <div className="h-12 w-12 rounded-2xl bg-muted flex items-center justify-center opacity-20">
                                        <MessageCircle className="h-6 w-6" />
                                    </div>
                                    <p className="text-sm font-medium">Aucun message pour le moment</p>
                                </div>
                            ) : (
                                conversationList.map((conv: any) => (
                                    <button
                                        key={conv.userId}
                                        onClick={() => setSelectedUserId(conv.userId)}
                                        className={cn(
                                            "w-full p-4 flex items-start gap-3 text-left transition-all hover:bg-muted/30 group relative border-b last:border-0",
                                            selectedUserId === conv.userId && "bg-primary/5"
                                        )}
                                    >
                                        {selectedUserId === conv.userId && (
                                            <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary rounded-r-full" />
                                        )}
                                        <div className="relative">
                                            <Avatar className="h-10 w-10 rounded-xl shadow-inner group-hover:scale-105 transition-transform">
                                                <AvatarImage src={conv.userImage} />
                                                <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold rounded-xl">
                                                    {conv.userName.substring(0, 1)}
                                                </AvatarFallback>
                                            </Avatar>
                                            {conv.unreadCount > 0 && (
                                                <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-black text-white shadow-[0_0_10px_rgba(255,100,0,0.3)] ring-2 ring-card">
                                                    {conv.unreadCount}
                                                </span>
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center justify-between mb-0.5">
                                                <span className="text-sm font-bold truncate pr-2 text-zinc-300 group-hover:text-zinc-100 transition-colors">
                                                    {conv.userName}
                                                </span>
                                                <span className="text-[10px] text-zinc-600 font-medium tabular-nums opacity-60 bg-muted/50 px-1.5 py-0.5 rounded">
                                                    {formatDistanceToNow(new Date(conv.lastMessage.createdAt), { addSuffix: true, locale: fr })}
                                                </span>
                                            </div>
                                            <p className={cn(
                                                "text-xs truncate text-zinc-500",
                                                conv.unreadCount > 0 && "font-bold text-zinc-300"
                                            )}>
                                                {conv.lastMessage.content}
                                            </p>
                                        </div>
                                    </button>
                                ))
                            )}
                        </div>
                    </ScrollArea>
                </div>

                {/* Main: Chat View */}
                <div className="md:col-span-8 flex flex-col rounded-2xl border bg-card/30 backdrop-blur-md overflow-hidden shadow-sm relative">
                    {selectedConversation ? (
                        <>
                            {/* Chat Header */}
                            <div className="p-4 border-b bg-muted/10 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <Avatar className="h-9 w-9 rounded-lg">
                                        <AvatarImage src={selectedConversation.userImage} />
                                        <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold rounded-lg border border-primary/20">
                                            {selectedConversation.userName.substring(0, 1)}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div>
                                        <h3 className="text-sm font-bold text-zinc-200">{selectedConversation.userName}</h3>
                                        <p className="text-[10px] text-zinc-500 tracking-tight font-medium">{selectedConversation.userEmail}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg opacity-40 hover:opacity-100 hover:bg-muted transition-all">
                                        <MoreVertical className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>

                            {/* Chat Viewport */}
                            <ScrollArea className="flex-1 p-6">
                                <div className="space-y-6">
                                    {activeMessages.map((msg: any) => {
                                        const isAdmin = msg.direction === 'admin_to_user'
                                        return (
                                            <div
                                                key={msg.id}
                                                className={cn(
                                                    "flex flex-col max-w-[85%]",
                                                    isAdmin ? "ml-auto items-end" : "mr-auto items-start"
                                                )}
                                            >
                                                <div className={cn(
                                                    "px-4 py-3 rounded-2xl text-[13px] shadow-sm relative group/msg transition-all",
                                                    isAdmin
                                                        ? "bg-primary text-primary-foreground rounded-tr-none shadow-primary/10"
                                                        : "bg-muted/40 backdrop-blur-sm border border-zinc-500/10 rounded-tl-none font-medium"
                                                )}>
                                                    <p className="leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                                                    <div className={cn(
                                                        "absolute top-0 flex items-center gap-1 opacity-0 group-hover/msg:opacity-100 transition-opacity whitespace-nowrap px-2 py-1 bg-black/80 rounded-full text-[9px] text-zinc-400 z-10",
                                                        isAdmin ? "right-full mr-2" : "left-full ml-2"
                                                    )}>
                                                        <Clock className="h-2.5 w-2.5" />
                                                        {new Date(msg.createdAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                                                    </div>
                                                </div>
                                                <div className="mt-1 flex items-center gap-2 px-1">
                                                    <span className="text-[9px] text-zinc-700 uppercase font-black tracking-widest opacity-60">
                                                        {formatDistanceToNow(new Date(msg.createdAt), { addSuffix: true, locale: fr })}
                                                    </span>
                                                    {isAdmin && (
                                                        <CheckCheck className={cn("h-3 w-3", msg.isRead ? "text-cyan-500" : "text-zinc-800")} />
                                                    )}
                                                </div>
                                            </div>
                                        )
                                    })}
                                    <div ref={messagesEndRef} />
                                </div>
                            </ScrollArea>

                            {/* Chat Input */}
                            <div className="p-4 border-t bg-muted/10 backdrop-blur-xl">
                                <div className="relative flex items-end gap-2 bg-background/50 border rounded-2xl p-2 focus-within:ring-1 focus-within:ring-primary/20 focus-within:border-primary/50 transition-all shadow-inner">
                                    <textarea
                                        rows={1}
                                        value={replyText}
                                        onChange={(e) => setReplyText(e.target.value)}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter' && !e.shiftKey) {
                                                e.preventDefault()
                                                handleSend()
                                            }
                                        }}
                                        placeholder="Tapez votre réponse ici..."
                                        className="flex-1 bg-transparent border-none focus:ring-0 resize-none py-2 px-3 text-sm min-h-[40px] max-h-32 text-zinc-300 font-medium placeholder:text-zinc-700"
                                    />
                                    <Button
                                        size="icon"
                                        className="h-10 w-10 shrink-0 rounded-xl shadow-lg transition-all active:scale-95"
                                        onClick={handleSend}
                                        disabled={!replyText.trim() || reply.isPending}
                                    >
                                        <Send className={cn("h-4 w-4", reply.isPending && "animate-pulse")} />
                                    </Button>
                                </div>
                                <div className="mt-2 flex items-center justify-center gap-1 opacity-20 group-hover:opacity-40 transition-opacity">
                                    <span className="h-1 w-1 rounded-full bg-zinc-500" />
                                    <p className="text-[9px] font-black uppercase tracking-[0.2em] text-zinc-500">
                                        Système de Réponse NumZero
                                    </p>
                                    <span className="h-1 w-1 rounded-full bg-zinc-500" />
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center p-12 text-center text-muted-foreground relative">
                            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/5 to-transparent opacity-50" />
                            <div className="h-20 w-20 rounded-[2.5rem] bg-zinc-900 border border-zinc-800 flex items-center justify-center mb-8 relative group active:scale-90 transition-all duration-500 shadow-2xl">
                                <div className="absolute inset-0 rounded-[2.5rem] bg-primary animate-ping opacity-10 group-hover:opacity-20 transition-opacity" />
                                <Layout className="h-10 w-10 text-primary relative" />
                            </div>
                            <h3 className="text-xl font-black tracking-tight text-white mb-2">Centre de Support</h3>
                            <p className="max-w-xs text-xs text-zinc-500 font-medium leading-relaxed">
                                Connectez-vous avec vos utilisateurs. Sélectionnez une conversation pour commencer l'assistance.
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </AdminPageShell>
    )
}
