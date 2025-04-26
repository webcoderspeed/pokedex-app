"use client"

import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import { PokemonCard } from "@/components/pokemon-card"
import { Loader } from "@/components/loader"
import type { Pokemon } from "@/types/pokemon"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Search, RefreshCw } from "lucide-react"

// Dynamic import with fallback
let pokemonClient: {
  getAllPokemon: () => Promise<Pokemon[]>
  refreshPokemonData: () => Promise<void>
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

export function PokemonList() {
  const [pokemon, setPokemon] = useState<Pokemon[]>([])
  const [filteredPokemon, setFilteredPokemon] = useState<Pokemon[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [isRefreshing, setIsRefreshing] = useState(false)
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
  }, [clientInitialized])

  useEffect(() => {
    if (searchTerm.trim() === "") {
      setFilteredPokemon(pokemon)
    } else {
      const filtered = pokemon.filter((p) => p.name.toLowerCase().includes(searchTerm.toLowerCase()))
      setFilteredPokemon(filtered)
    }
  }, [searchTerm, pokemon])

  const fetchPokemon = async () => {
    try {
      setIsLoading(true)
      if (!pokemonClient) {
        throw new Error("Pokemon client not initialized")
      }
      const data = await pokemonClient.getAllPokemon()
      setPokemon(data)
      setFilteredPokemon(data)
      setIsLoading(false)
    } catch (err) {
      console.error("Fetch error:", err)
      setError("Failed to load Pokémon. Please try again.")
      setIsLoading(false)
    }
  }

  const handleRefresh = async () => {
    setIsRefreshing(true)
    try {
      if (!pokemonClient) {
        throw new Error("Pokemon client not initialized")
      }
      await pokemonClient.refreshPokemonData()
      await fetchPokemon()
    } catch (err) {
      console.error("Refresh error:", err)
      setError("Failed to refresh Pokémon data. Please try again.")
    } finally {
      setIsRefreshing(false)
    }
  }

  if (isLoading) {
    return <Loader />
  }

  if (error) {
    return (
      <div className="rounded-lg bg-red-50 p-4 text-center dark:bg-red-900/20">
        <h2 className="text-lg font-semibold text-red-800 dark:text-red-200">{error}</h2>
        <Button onClick={fetchPokemon} className="mt-4">
          Try Again
        </Button>
      </div>
    )
  }

  return (
    <div>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
          <Input
            type="text"
            placeholder="Search Pokémon..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8"
          />
        </div>
        <Button onClick={handleRefresh} disabled={isRefreshing} variant="outline" className="flex items-center gap-2">
          <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
          Refresh Data
        </Button>
      </div>

      {filteredPokemon.length === 0 ? (
        <div className="mt-8 text-center text-gray-500 dark:text-gray-400">No Pokémon found matching your search.</div>
      ) : (
        <motion.div
          className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ staggerChildren: 0.1 }}
        >
          {filteredPokemon.map((pokemon, index) => (
            <motion.div
              key={pokemon.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <PokemonCard pokemon={pokemon} />
            </motion.div>
          ))}
        </motion.div>
      )}
    </div>
  )
}
