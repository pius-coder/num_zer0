'use client'

import { useState, useRef, useMemo, useEffect } from 'react'
import {
    Search,
    Send,
    CheckCheck,
    Clock,
    MessageCircle,
    User,
    ArrowRight
} from 'lucide-react'
import Link from 'next/link'
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
import {
    Table,
    TableHeader,
    TableRow,
    TableHead,
    TableBody,
    TableCell,
} from '@/components/ui/table'
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetPanel,
    SheetFooter,
} from '@/components/ui/sheet'

export default function AdminMessagesPage() {
    const { messages, isLoading, reply, markRead } = useAdminMessages()
    const [selectedUserId, setSelectedUserId] = useState<string | null>(null)
    const [isSheetOpen, setIsSheetOpen] = useState(false)
    const [replyText, setReplyText] = useState('')
    const [searchQuery, setSearchQuery] = useState('')
    const messagesEndRef = useRef<HTMLDivElement>(null)

    // Group messages by user
    const conversations = useMemo(() => {
        return (messages || []).reduce((acc: any, msg: any) => {
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
    }, [messages])

    const conversationList = useMemo(() => {
        let list = Object.values(conversations).sort((a: any, b: any) =>
            new Date(b.lastMessage.createdAt).getTime() - new Date(a.lastMessage.createdAt).getTime()
        )
        if (searchQuery) {
            const q = searchQuery.toLowerCase()
            list = list.filter((c: any) =>
                c.userName.toLowerCase().includes(q) ||
                c.userEmail?.toLowerCase().includes(q)
            )
        }
        return list
    }, [conversations, searchQuery])

    const selectedConversation = selectedUserId ? (conversations as any)[selectedUserId] : null
    const activeMessages = selectedConversation ? [...selectedConversation.messages].sort((a: any, b: any) =>
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    ) : []

    // Auto scroll to bottom using a dummy div at the end
    useEffect(() => {
        if (isSheetOpen) {
            setTimeout(() => {
                messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
            }, 100)
        }
    }, [activeMessages, isSheetOpen])

    // Mark as read when selecting conversation
    useEffect(() => {
        if (isSheetOpen && selectedUserId && (conversations as any)[selectedUserId]?.unreadCount > 0) {
            (conversations as any)[selectedUserId].messages
                .filter((m: any) => !m.isRead && m.direction === 'user_to_admin')
                .forEach((m: any) => markRead.mutate(m.id))
        }
    }, [isSheetOpen, selectedUserId, conversations, markRead])

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

    const openConversation = (userId: string) => {
        setSelectedUserId(userId)
        setIsSheetOpen(true)
    }

    return (
        <AdminPageShell
            title="Messages Support"
            subtitle="Flux centralisé des communications clients. Répondez aux demandes en temps réel."
        >
            <div className="flex flex-col gap-4">
                <div className="flex items-center gap-4">
                    <div className="relative w-full max-w-sm">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                            placeholder="Filtrer par nom ou email..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-9 bg-card"
                        />
                    </div>
                </div>

                <div className="rounded-xl border bg-card/50 overflow-hidden shadow-sm">
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-muted/30 hover:bg-muted/30 border-b">
                                <TableHead className="w-[300px]">Utilisateur</TableHead>
                                <TableHead>Dernier message</TableHead>
                                <TableHead className="w-[150px] text-right">Date</TableHead>
                                <TableHead className="w-[50px]"></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? (
                                Array.from({ length: 5 }).map((_, i) => (
                                    <TableRow key={i}>
                                        <TableCell>
                                            <div className="flex items-center gap-3 animate-pulse">
                                                <div className="h-10 w-10 rounded-full bg-muted" />
                                                <div className="space-y-2">
                                                    <div className="h-3 w-24 bg-muted rounded" />
                                                    <div className="h-2 w-32 bg-muted rounded" />
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell><div className="h-3 w-48 bg-muted rounded animate-pulse" /></TableCell>
                                        <TableCell><div className="h-3 w-16 bg-muted rounded animate-pulse ml-auto" /></TableCell>
                                        <TableCell></TableCell>
                                    </TableRow>
                                ))
                            ) : conversationList.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={4} className="h-64 text-center">
                                        <div className="flex flex-col items-center justify-center text-muted-foreground">
                                            <div className="h-12 w-12 rounded-2xl bg-muted flex items-center justify-center opacity-20 mb-3">
                                                <MessageCircle className="h-6 w-6" />
                                            </div>
                                            <p className="text-sm font-medium">Aucun message pour le moment</p>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                conversationList.map((conv: any) => (
                                    <TableRow
                                        key={conv.userId}
                                        className={cn(
                                            "cursor-pointer transition-colors hover:bg-muted/50",
                                            conv.unreadCount > 0 ? "bg-primary/5 hover:bg-primary/10" : ""
                                        )}
                                        onClick={() => openConversation(conv.userId)}
                                    >
                                        <TableCell>
                                            <div className="flex items-center gap-3">
                                                <div className="relative">
                                                    <Avatar className="h-10 w-10">
                                                        <AvatarImage src={conv.userImage} />
                                                        <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold">
                                                            {conv.userName.substring(0, 1)}
                                                        </AvatarFallback>
                                                    </Avatar>
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className={cn(
                                                        "text-sm",
                                                        conv.unreadCount > 0 ? "font-bold text-foreground" : "font-medium text-foreground/80"
                                                    )}>
                                                        {conv.userName}
                                                    </span>
                                                    <span className="text-xs text-muted-foreground">{conv.userEmail}</span>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <p className={cn(
                                                "text-sm max-w-[500px] truncate",
                                                conv.unreadCount > 0 ? "font-semibold text-foreground/90" : "text-muted-foreground"
                                            )}>
                                                {conv.lastMessage.direction === 'admin_to_user' && (
                                                    <span className="text-primary mr-1 font-bold">Vous:</span>
                                                )}
                                                {conv.lastMessage.content}
                                            </p>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <span className="text-xs whitespace-nowrap text-muted-foreground">
                                                {formatDistanceToNow(new Date(conv.lastMessage.createdAt), { addSuffix: true, locale: fr })}
                                            </span>
                                        </TableCell>
                                        <TableCell>
                                            {conv.unreadCount > 0 && (
                                                <div className="flex justify-end">
                                                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground shadow-[0_0_10px_rgba(255,100,0,0.3)]">
                                                        {conv.unreadCount}
                                                    </span>
                                                </div>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>
            </div>

            {/* Conversation Right Sidebar */}
            <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
                <SheetContent side="right" className="w-full sm:w-[450px] sm:max-w-none p-0 flex flex-col border-l border-white/10 bg-[#080808]">
                    {selectedConversation && (
                        <>
                            <SheetHeader className="p-4 border-b border-white/5 bg-muted/10">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <Avatar className="h-10 w-10 border border-primary/20">
                                            <AvatarImage src={selectedConversation.userImage} />
                                            <AvatarFallback className="bg-primary/20 text-primary">
                                                {selectedConversation.userName.substring(0, 1)}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div className="text-left">
                                            <SheetTitle className="text-base text-zinc-100">{selectedConversation.userName}</SheetTitle>
                                            <p className="text-xs text-zinc-500">{selectedConversation.userEmail}</p>
                                        </div>
                                    </div>
                                    <Button variant="outline" size="sm" className="h-8 gap-1.5 bg-background/50 hover:bg-muted text-xs">
                                        <Link href={`/fr/admin/users/${selectedConversation.userId}`}>
                                            <User className="h-3.5 w-3.5" />
                                            <span className="hidden sm:inline">Voir le profil</span>
                                            <ArrowRight className="h-3 w-3 sm:hidden" />
                                        </Link>
                                    </Button>
                                </div>
                            </SheetHeader>

                            <SheetPanel className="flex-1 p-4 bg-card/30 overflow-hidden flex flex-col">
                                <ScrollArea className="flex-1 pr-4 -mr-4">
                                    <div className="space-y-6 pb-4">
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
                                                            ? "bg-primary text-primary-foreground rounded-tr-sm shadow-primary/10"
                                                            : "bg-muted/50 backdrop-blur-sm border border-zinc-500/10 rounded-tl-sm font-medium"
                                                    )}>
                                                        <p className="leading-relaxed whitespace-pre-wrap text-zinc-100">{msg.content}</p>
                                                        <div className={cn(
                                                            "absolute top-0 flex items-center gap-1 opacity-0 group-hover/msg:opacity-100 transition-opacity whitespace-nowrap px-2 py-1 bg-black/80 rounded-full text-[9px] text-zinc-400 z-10",
                                                            isAdmin ? "right-full mr-2" : "left-full ml-2"
                                                        )}>
                                                            <Clock className="h-2.5 w-2.5" />
                                                            {new Date(msg.createdAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                                                        </div>
                                                    </div>
                                                    <div className="mt-1 flex items-center gap-2 px-1">
                                                        <span className="text-[9px] text-zinc-600 uppercase font-bold tracking-widest">
                                                            {formatDistanceToNow(new Date(msg.createdAt), { addSuffix: true, locale: fr })}
                                                        </span>
                                                        {isAdmin && (
                                                            <CheckCheck className={cn("h-3 w-3", msg.isRead ? "text-primary" : "text-zinc-700")} />
                                                        )}
                                                    </div>
                                                </div>
                                            )
                                        })}
                                        <div ref={messagesEndRef} />
                                    </div>
                                </ScrollArea>
                            </SheetPanel>

                            <SheetFooter className="p-4 border-t border-white/5 bg-background sm:justify-start">
                                <div className="w-full flex items-end gap-2 bg-muted/30 border border-white/5 rounded-2xl p-2 focus-within:bg-muted/50 focus-within:border-primary/30 transition-all">
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
                                        placeholder="Écrivez votre réponse..."
                                        className="flex-1 bg-transparent border-none focus:ring-0 resize-none py-2 px-3 text-sm min-h-[40px] max-h-32 text-zinc-200 outline-none placeholder:text-zinc-600"
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
                            </SheetFooter>
                        </>
                    )}
                </SheetContent>
            </Sheet>
        </AdminPageShell>
    )
}
