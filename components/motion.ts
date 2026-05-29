// Shared Framer Motion variants + easing. See plan §7.4.
import type { Variants, Transition } from "framer-motion";

export const EASE = [0.22, 1, 0.36, 1] as const;

export const fadeRise: Variants = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: EASE } },
};

export const stagger: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06 } },
};

export const heroItem: Variants = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: EASE } },
};

export const sectionReveal: Variants = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: EASE } },
};

export const crossfade: Variants = {
  hidden: { opacity: 0, y: 8 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: EASE } },
  exit: { opacity: 0, y: -8, transition: { duration: 0.2, ease: EASE } },
};

export const drawerSpring: Transition = {
  type: "spring",
  stiffness: 320,
  damping: 34,
};

export const VIEWPORT = { once: true, margin: "-80px" } as const;
