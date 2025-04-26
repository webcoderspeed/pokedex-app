// Fallback client for environments where Web Workers are not supported
import type { Pokemon } from "@/types/pokemon"

// In-memory cache
let pokemonCache: Pokemon[] = []

export async function getAllPokemon(): Promise<Pokemon[]> {
  if (pokemonCache.length > 0) {
    return pokemonCache
  }

  try {
    const response = await fetch("https://pokeapi.co/api/v2/pokemon?limit=151")
    if (!response.ok) {
      throw new Error(`Failed to fetch Pokémon list: ${response.status}`)
    }

    const data = await response.json()
    const detailsPromises = data.results.map(async (pokemon: { url: string }) => {
      const detailResponse = await fetch(pokemon.url)
      return detailResponse.json()
    })

    // Process in batches to avoid overwhelming the browser
    const batchSize = 10
    const allPokemon: Pokemon[] = []

    for (let i = 0; i < detailsPromises.length; i += batchSize) {
      const batch = detailsPromises.slice(i, i + batchSize)
      const pokemonDetails = await Promise.all(batch)
      allPokemon.push(...pokemonDetails)
    }

    pokemonCache = allPokemon
    return allPokemon
  } catch (error) {
    console.error("Error fetching Pokémon:", error)
    throw error
  }
}

export async function getPokemonById(id: number): Promise<Pokemon> {
  // Check cache first
  const cachedPokemon = pokemonCache.find((p) => p.id === id)
  if (cachedPokemon) {
    return cachedPokemon
  }

  // Fetch from API if not in cache
  const response = await fetch(`https://pokeapi.co/api/v2/pokemon/${id}`)
  if (!response.ok) {
    throw new Error(`Failed to fetch Pokémon: ${response.status}`)
  }

  return response.json()
}

export async function searchPokemon(query: string): Promise<Pokemon[]> {
  const allPokemon = await getAllPokemon()
  return allPokemon.filter((pokemon) => pokemon.name.toLowerCase().includes(query.toLowerCase()))
}

export async function refreshPokemonData(): Promise<void> {
  // Clear cache
  pokemonCache = []
  // Refetch data
  await getAllPokemon()
}

export async function initWorker(): Promise<void> {
  // No-op for fallback client
  return Promise.resolve()
}
