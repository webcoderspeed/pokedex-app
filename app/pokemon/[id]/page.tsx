"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { ChevronLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { PokemonDetail } from "@/components/pokemon-detail"
import { Loader } from "@/components/loader"
import type { Pokemon } from "@/types/pokemon"

// Dynamic import with fallback
let pokemonClient: {
  getPokemonById: (id: number) => Promise<Pokemon>
}

// Initialize the client
const initClient = async () => {
  try {
    // Try to import the worker client
    pokemonClient = await import("@/lib/worker-client")
  } catch (error) {
    console.warn("Web Worker not supported, using fallback client", error)
    // Fallback to non-worker implementation
    pokemonClient = await import("@/lib/fallback-client")
  }
}

export default function PokemonDetailPage({
  params,
}: {
  params: { id: string }
}) {
  const router = useRouter()
  const [pokemon, setPokemon] = useState<Pokemon | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [clientInitialized, setClientInitialized] = useState(false)

  useEffect(() => {
    const setup = async () => {
      try {
        await initClient()
        setClientInitialized(true)
      } catch (err) {
        console.error("Setup error:", err)
        setError("Failed to initialize the application. Please try again.")
        setIsLoading(false)
      }
    }

    setup()
  }, [])

  useEffect(() => {
    if (clientInitialized) {
      fetchPokemon()
    }
  }, [clientInitialized, params.id])

  const fetchPokemon = async () => {
    try {
      setIsLoading(true)
      if (!pokemonClient) {
        throw new Error("Pokemon client not initialized")
      }
      const data = await pokemonClient.getPokemonById(Number.parseInt(params.id))
      setPokemon(data)
      setIsLoading(false)
    } catch (err) {
      console.error("Error fetching Pokémon:", err)
      setError("Failed to load Pokémon details. Please try again.")
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return <Loader />
  }

  if (error || !pokemon) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center p-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-500">Error</h1>
          <p className="mt-2">{error || "Pokémon not found"}</p>
          <Button onClick={() => router.back()} className="mt-4" variant="outline">
            Go Back
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 p-4">
      <div className="container mx-auto max-w-4xl">
        <Button onClick={() => router.back()} variant="ghost" className="mb-4 flex items-center">
          <ChevronLeft className="mr-2 h-4 w-4" />
          Back to list
        </Button>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <PokemonDetail pokemon={pokemon} />
        </motion.div>
      </div>
    </div>
  )
}
