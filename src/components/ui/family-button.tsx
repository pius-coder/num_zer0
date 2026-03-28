"use client"

import { FC, ReactNode, useState } from "react"
import { PlusIcon, XIcon } from "lucide-react"
import { motion, AnimatePresence } from "motion/react"

import { cn } from "@/lib/utils/index"

const CONTAINER_SIZE = 200

interface FamilyButtonProps {
  children: ReactNode
  icon?: React.ElementType
  isExpanded?: boolean
  onToggle?: () => void
}

const FamilyButton: FC<FamilyButtonProps> = ({
  children,
  icon: Icon = PlusIcon,
  isExpanded: controlledIsExpanded,
  onToggle
}) => {
  const [uncontrolledIsExpanded, setIsExpanded] = useState(false)
  const isExpanded = controlledIsExpanded !== undefined ? controlledIsExpanded : uncontrolledIsExpanded

  const toggleExpand = () => {
    if (onToggle) {
      onToggle()
    } else {
      setIsExpanded(!isExpanded)
    }
  }

  return (
    <motion.div
      className={cn(
        "relative flex flex-col items-center z-10 cursor-pointer overflow-hidden",
        "rounded-[24px] border border-white/10 shadow-xl",
        isExpanded
          ? "bg-gradient-to-b from-neutral-900 to-black dark:from-stone-900 dark:to-neutral-900/80"
          : "bg-gradient-to-b from-neutral-800 to-stone-900 dark:from-neutral-900 dark:to-stone-950"
      )}
      layoutRoot
      layout
      initial={{ borderRadius: 24, width: "3.5rem", height: "3.5rem" }}
      animate={{
        borderRadius: 24,
        width: isExpanded ? CONTAINER_SIZE : "3.5rem",
        height: isExpanded ? CONTAINER_SIZE + 50 : "3.5rem",
        transition: { type: "spring", damping: 25, stiffness: 400, when: "beforeChildren" },
      }}
    >
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1, transition: { delay: 0.1, duration: 0.3 } }}
            exit={{ opacity: 0, transition: { duration: 0.1 } }}
            className="w-full flex-1"
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div
        className="absolute bottom-1.5 left-1/2 -translate-x-1/2"
        layoutId="expand-toggle"
        onClick={toggleExpand}
      >
        <AnimatePresence mode="wait">
          {isExpanded ? (
            <motion.div
              key="close"
              initial={{ rotate: -90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: 90, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="p-[8px] bg-neutral-800/50 dark:bg-black/50 border border-cyan-100/30 hover:border-neutral-200 text-orange-50 rounded-full shadow-2xl transition-colors duration-300"
            >
              <XIcon className="h-6 w-6 text-cyan-100/30 dark:text-neutral-400/80 hover:text-neutral-500" />
            </motion.div>
          ) : (
            <motion.div
              key="open"
              initial={{ rotate: 90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: -90, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="p-[8px] bg-neutral-200 dark:bg-cyan-500/90 text-cyan-50 border border-cyan-100/10 shadow-2xl transition-colors duration-200 rounded-full"
            >
              <Icon className="h-6 w-6 text-black dark:text-neutral-900" />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  )
}

export { FamilyButton }
export default FamilyButton
