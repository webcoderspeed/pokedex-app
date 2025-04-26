"use client"

import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import { PokemonList } from "@/components/pokemon-list"
import { initWorker } from "@/lib/worker-client"
import { Loader } from "@/components/loader"

export default function Home() {
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const initializeWorker = async () => {
      try {
        await initWorker()
        setIsLoading(false)
      } catch (err) {
        console.error("Worker initialization error:", err)
        setError("Failed to initialize the application. Please try again.")
        setIsLoading(false)
      }
    }

    initializeWorker()
  }, [])

  if (isLoading) {
    return <Loader />
  }

  if (error) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center p-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-500">Error</h1>
          <p className="mt-2">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 rounded-md bg-blue-500 px-4 py-2 text-white hover:bg-blue-600"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="container mx-auto px-4 py-8"
      >
        <h1 className="mb-8 text-center text-4xl font-bold text-gray-800 dark:text-white">Pokémon Explorer</h1>
        <p className="mb-8 text-center text-gray-600 dark:text-gray-300">
          Explore Pokémon with data stored in IndexedDB and processed by Web Workers
        </p>
        <PokemonList />
      </motion.div>
    </main>
  )
}
