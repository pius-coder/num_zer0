"use client"

import { FC, ReactNode, useState } from "react"
import { PlusIcon, XIcon } from "lucide-react"
import { motion } from "motion/react"

import { cn } from "@/lib/utils/index"

const CONTAINER_SIZE = 200

interface FamilyButtonProps {
  children: React.ReactNode
  icon?: React.ElementType
}

const FamilyButton: React.FC<FamilyButtonProps> = ({ children, icon: Icon = PlusIcon }) => {
  const [isExpanded, setIsExpanded] = useState(false)
  const toggleExpand = () => setIsExpanded(!isExpanded)

  return (
    <div
      className={cn(
        "rounded-[24px] border border-black/10 shadow-sm dark:border-yellow-400/20",
        "bg-gradient-to-b from-neutral-900 to-black",
        isExpanded
          ? "w-[204px] bg-gradient-to-b dark:from-stone-900 dark:to-neutral-900/80"
          : "dark:from-neutral-900 dark:to-stone-950 bg-gradient-to-b"
      )}
    >
      <div className="rounded-[23px] border border-black/10">
        <div className="rounded-[22px] border dark:border-stone-800 border-white/50">
          <div className="rounded-[21px] border border-neutral-950/20 flex items-center justify-center">
            <FamilyButtonContainer
              isExpanded={isExpanded}
              toggleExpand={toggleExpand}
              icon={Icon}
            >
              {isExpanded ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{
                    opacity: 1,
                    transition: {
                      delay: 0.3,
                      duration: 0.4,
                      ease: "easeOut",
                    },
                  }}
                >
                  {children}
                </motion.div>
              ) : null}
            </FamilyButtonContainer>
          </div>
        </div>
      </div>
    </div>
  )
}

// A container that wraps content and handles animations
interface FamilyButtonContainerProps {
  isExpanded: boolean
  toggleExpand: () => void
  children: ReactNode
  icon: React.ElementType
}

const FamilyButtonContainer: FC<FamilyButtonContainerProps> = ({
  isExpanded,
  toggleExpand,
  children,
  icon: Icon,
}) => {
  return (
    <motion.div
      className={cn(
        "relative border-white/10 border shadow-lg flex flex-col space-y-1 items-center text-white cursor-pointer z-10",
        !isExpanded
          ? "bg-gradient-to-b from-neutral-900 to-stone-900 dark:from-stone-700 dark:to-neutral-800/80"
          : ""
      )}
      layoutRoot
      layout
      initial={{ borderRadius: 21, width: "3.5rem", height: "3.5rem" }}
      animate={
        isExpanded
          ? {
            borderRadius: 20,
            width: CONTAINER_SIZE,
            height: CONTAINER_SIZE + 50,

            transition: {
              type: "spring",
              damping: 25,
              stiffness: 400,
              when: "beforeChildren",
            },
          }
          : {
            borderRadius: 21,
            width: "3.5rem",
            height: "3.5rem",
          }
      }
    >
      {children}

      <motion.div
        className="absolute"
        initial={{ x: "-50%" }}
        animate={{
          x: isExpanded ? "0%" : "-50%",
          transition: {
            type: "tween",
            ease: "easeOut",
            duration: 0.3,
          },
        }}
        style={{
          left: isExpanded ? "" : "50%",
          bottom: 6,
        }}
      >
        {isExpanded ? (
          <motion.div
            className="p-[8px] group bg-neutral-800/50 dark:bg-black/50 border border-cyan-100/30 hover:border-neutral-200 text-orange-50 rounded-full shadow-2xl transition-colors duration-300"
            onClick={toggleExpand}
            layoutId="expand-toggle"
            initial={false}
            animate={{
              rotate: -360,
              transition: {
                duration: 0.4,
              },
            }}
          >
            <XIcon
              className={cn(
                "h-6 w-6 text-cyan-100/30 dark:text-neutral-400/80 group-hover:text-neutral-500 transition-colors duration-200"
              )}
            />
          </motion.div>
        ) : (
          <motion.div
            className={cn(
              "p-[8px] group bg-neutral-200 dark:bg-cyan-500/90 text-cyan-50 border border-cyan-100/10 shadow-2xl transition-colors duration-200"
            )}
            style={{ borderRadius: 24 }}
            onClick={toggleExpand}
            layoutId="expand-toggle"
            initial={{ rotate: 0 }}
            animate={{
              rotate: 0,
              transition: {
                duration: 0.4,
              },
            }}
          >
            <Icon className="h-6 w-6 text-black dark:text-neutral-900" />
          </motion.div>
        )}
      </motion.div>
    </motion.div>
  )
}


export { FamilyButton }
export default FamilyButton
