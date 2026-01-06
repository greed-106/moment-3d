"use client";

import { motion } from "framer-motion";

export function AnimatedTitle() {
  return (
    <motion.h1
      className="font-bold text-transparent bg-clip-text select-none whitespace-nowrap text-4xl"
      style={{
        backgroundImage: "linear-gradient(135deg, #2d2a27 0%, #78716c 50%, #44403c 100%)",
        WebkitBackgroundClip: "text",
        filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.1)) drop-shadow(0 10px 15px rgba(0,0,0,0.05))",
      }}
      initial={{ opacity: 0, filter: "blur(12px)" }}
      animate={{ opacity: 1, filter: "blur(0px)" }}
      transition={{ duration: 1.2, ease: [0.25, 0.46, 0.45, 0.94] }}
    >
      Moment3D
    </motion.h1>
  );
}
