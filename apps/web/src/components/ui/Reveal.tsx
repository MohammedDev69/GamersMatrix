"use client";

import {
  type HTMLAttributes,
  type ReactNode,
  useState,
} from "react";
import { motion, useReducedMotion } from "framer-motion";

type RevealTag = "div" | "section" | "article" | "ul" | "li";

type RevealProps = {
  children: ReactNode;
  className?: string;
  delayMs?: number;
  as?: RevealTag;
} & HTMLAttributes<HTMLElement>;

const MOTION_TAGS = {
  div: motion.div,
  section: motion.section,
  article: motion.article,
  ul: motion.ul,
  li: motion.li,
};

export function Reveal({
  children,
  className = "",
  delayMs = 0,
  as = "div",
  ...rest
}: RevealProps) {
  const reduceMotion = useReducedMotion();
  const [visible, setVisible] = useState(false);
  const MotionTag = MOTION_TAGS[as];

  return (
    <MotionTag
      className={`gm-reveal ${visible || reduceMotion ? "is-visible" : ""} ${className}`}
      initial={reduceMotion ? false : { opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.12, margin: "0px 0px -40px 0px" }}
      transition={{
        duration: reduceMotion ? 0 : 0.5,
        delay: reduceMotion ? 0 : delayMs / 1000,
        ease: [0.16, 1, 0.3, 1],
      }}
      onViewportEnter={() => setVisible(true)}
      {...(rest as Record<string, unknown>)}
    >
      {children}
    </MotionTag>
  );
}
