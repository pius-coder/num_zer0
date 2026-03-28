"use client"

import { useState, useCallback, memo, useMemo } from "react"
import { useQuery } from "@tanstack/react-query"
import { MessageSquare, Phone, Mail, Send, ExternalLink, Headset } from "lucide-react"
import FamilyButton from "@/components/ui/family-button"
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetDescription,
    SheetPanel,
    SheetFooter,
} from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { sendSupportMessage, getPublicSupportConfig } from "@/app/actions/support-actions"
import { toast } from "sonner"
import { motion, AnimatePresence } from "motion/react"

const SupportFloatingButton = memo(function SupportFloatingButton() {
    const [open, setOpen] = useState(false)
    const [isFamilyExpanded, setIsFamilyExpanded] = useState(false)
    const [formState, setFormState] = useState<"idle" | "loading" | "success">("idle")
    const [message, setMessage] = useState("")

    // Use React Query for caching and fetching support config
    const { data: config } = useQuery({
        queryKey: ['support-config'],
        queryFn: async () => {
            const cfg = await getPublicSupportConfig()
            return cfg || { whatsapp: null, email: null }
        },
        staleTime: 5 * 60 * 1000,
        initialData: { whatsapp: null, email: null }
    })


    const handleSubmit = useCallback(async (e: React.FormEvent) => {
        e.preventDefault()
        if (!message || message.length < 5) {
            toast.error('Message trop court')
            return
        }

        setFormState("loading")
        try {
            await sendSupportMessage({ content: message })
            setFormState("success")
            setTimeout(() => {
                setOpen(false)
                setFormState("idle")
                setMessage("")
            }, 3000)
        } catch (err: any) {
            setFormState("idle")
            toast.error(err.message || "Erreur lors de l'envoi")
        }
    }, [message])

    // Memoize options to prevent unnecessary re-renders within FamilyButton children
    const supportOptions = useMemo(() => (
        <div className="flex flex-col gap-2 w-full mt-2">
            {config.whatsapp && (
                <motion.a
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    href={`https://wa.me/${config.whatsapp}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => setIsFamilyExpanded(false)}
                    className="flex items-center justify-between w-full px-3 py-2 rounded-xl bg-emerald-500/5 border border-emerald-500/10 hover:bg-emerald-500/10 transition-all group"
                >
                    <div className="flex items-center gap-2.5">
                        <div className="p-1.5 rounded-lg bg-emerald-500/20 shadow-inner">
                            <Phone className="h-3.5 w-3.5 text-emerald-400" />
                        </div>
                        <span className="text-[11px] font-bold text-zinc-200">WhatsApp</span>
                    </div>
                    <ExternalLink className="h-3 w-3 text-zinc-600 group-hover:text-emerald-400 transition-colors" />
                </motion.a>
            )}

            {config.email && (
                <motion.a
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    href={`mailto:${config.email}`}
                    onClick={() => setIsFamilyExpanded(false)}
                    className="flex items-center justify-between w-full px-3 py-2 rounded-xl bg-blue-500/5 border border-blue-500/10 hover:bg-blue-500/10 transition-all group"
                >
                    <div className="flex items-center gap-2.5">
                        <div className="p-1.5 rounded-lg bg-blue-500/20 shadow-inner">
                            <Mail className="h-3.5 w-3.5 text-blue-400" />
                        </div>
                        <span className="text-[11px] font-bold text-zinc-200">Email</span>
                    </div>
                    <ExternalLink className="h-3 w-3 text-zinc-600 group-hover:text-blue-400 transition-colors" />
                </motion.a>
            )}

            <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                    setOpen(true)
                    setIsFamilyExpanded(false)
                }}
                className="flex items-center justify-between w-full px-3 py-2 rounded-xl bg-[#adfa1b]/5 border border-[#adfa1b]/10 hover:bg-[#adfa1b]/10 transition-all group"
            >
                <div className="flex items-center gap-2.5">
                    <div className="p-1.5 rounded-lg bg-[#adfa1b]/20 shadow-inner">
                        <MessageSquare className="h-3.5 w-3.5 text-[#adfa1b]" />
                    </div>
                    <span className="text-[11px] font-bold text-zinc-200">Message Direct</span>
                </div>
                <Send className="h-3 w-3 text-zinc-600 group-hover:text-[#adfa1b] transition-colors" />
            </motion.button>
        </div>
    ), [config.whatsapp, config.email])

    return (
        <div className="fixed top-4 right-4 z-[100] md:top-6 md:right-6">
            <FamilyButton
                icon={Headset}
                isExpanded={isFamilyExpanded}
                onToggle={() => setIsFamilyExpanded(!isFamilyExpanded)}
            >
                <div className="flex flex-col items-center gap-2 p-4 text-white w-full">
                    <div className="flex flex-col items-center gap-1 mb-1">
                        <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-[#adfa1b]">Besoin d'aide ?</h3>
                        <p className="text-[9px] text-zinc-500 font-medium">Assistance 24/7</p>
                    </div>
                    {supportOptions}
                </div>
            </FamilyButton>

            <Sheet open={open} onOpenChange={setOpen}>
                <SheetContent side="bottom" className="h-[84vh] max-w-none rounded-t-2xl border-t border-white/5 bg-[#080808]">
                    <SheetHeader>
                        <SheetTitle className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
                            <Headset className="h-5 w-5 text-[#adfa1b]" />
                            Support & Assistance
                        </SheetTitle>
                        <SheetDescription className="text-zinc-500">
                            Notre équipe est là pour vous aider 24/7. Envoyez-nous un message.
                        </SheetDescription>
                    </SheetHeader>

                    <SheetPanel className="space-y-6 py-6">
                        <div className="space-y-4 pt-2">
                            <div className="flex items-center justify-between px-1">
                                <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 flex items-center gap-2">
                                    <MessageSquare className="h-3 w-3 text-[#adfa1b]" />
                                    Votre message
                                </h3>
                            </div>

                            <div className="relative group/input">
                                <textarea
                                    value={message}
                                    onChange={(e) => setMessage(e.target.value)}
                                    placeholder="Une question ? Un problème ? Écrivez-nous..."
                                    className="w-full h-40 bg-zinc-900/30 rounded-2xl border border-white/5 p-4 text-sm resize-none outline-none text-zinc-200 placeholder:text-zinc-700 leading-relaxed font-medium transition-all group-hover/input:border-white/10 focus:border-[#adfa1b]/30 focus:bg-zinc-900/50"
                                    required
                                />
                            </div>
                        </div>

                        <AnimatePresence>
                            {formState === "success" && (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.95, y: 10 }}
                                    animate={{ opacity: 1, scale: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.95, y: 10 }}
                                    className="flex flex-col items-center justify-center p-8 rounded-2xl bg-[#adfa1b]/5 border border-[#adfa1b]/10 text-center space-y-2"
                                >
                                    <div className="p-3 rounded-full bg-[#adfa1b]/20 mb-2">
                                        <Send className="h-6 w-6 text-[#adfa1b]" />
                                    </div>
                                    <h4 className="text-sm font-bold text-[#adfa1b]">C'est envoyé !</h4>
                                    <p className="text-xs text-zinc-500 max-w-[200px]">Votre message a été enregistré. Notre équipe vous répondra très bientôt.</p>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </SheetPanel>

                    <SheetFooter className="p-6 pt-0 mt-auto sm:flex-row gap-3">
                        <Button
                            variant="outline"
                            onClick={() => setOpen(false)}
                            disabled={formState === "loading"}
                            className="flex-1 rounded-xl h-11 border-white/5 bg-transparent hover:bg-white/5 text-zinc-400 hover:text-white"
                        >
                            Fermer
                        </Button>
                        <Button
                            onClick={handleSubmit}
                            disabled={formState === "loading" || formState === "success" || !message.trim()}
                            className="flex-[2] rounded-xl h-11 bg-[#adfa1b] text-black hover:bg-[#adfa1b]/90 font-bold"
                        >
                            {formState === "loading" ? "Envoi en cours..." : "Envoyer le message"}
                        </Button>
                    </SheetFooter>
                </SheetContent>
            </Sheet>
        </div>
    )
})

export default SupportFloatingButton



