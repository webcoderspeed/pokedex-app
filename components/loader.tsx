"use client"

import { motion } from "framer-motion"

export function Loader() {
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center p-4">
      <motion.div
        animate={{
          rotate: 360,
        }}
        transition={{
          duration: 2,
          repeat: Number.POSITIVE_INFINITY,
          ease: "linear",
        }}
        className="h-16 w-16 rounded-full border-4 border-gray-200 border-t-red-500"
      />
      <p className="mt-4 text-gray-600 dark:text-gray-300">Loading Pokémon data...</p>
    </div>
  )
}
