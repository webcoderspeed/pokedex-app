// Web Worker implementation
// Using classic worker syntax (no ES modules)

// Type definitions (inline since we can't import in classic workers)
interface PokemonType {
  slot: number
  type: {
    name: string
    url: string
  }
}

interface PokemonAbility {
  ability: {
    name: string
    url: string
  }
  is_hidden: boolean
  slot: number
}

interface PokemonStat {
  base_stat: number
  effort: number
  stat: {
    name: string
    url: string
  }
}

interface Pokemon {
  id: number
  name: string
  base_experience: number
  height: number
  weight: number
  sprites: {
    front_default: string | null
    back_default: string | null
    front_shiny: string | null
    back_shiny: string | null
    other?: {
      "official-artwork"?: {
        front_default?: string
      }
    }
  }
  stats: PokemonStat[]
  types: PokemonType[]
  abilities: PokemonAbility[]
}

interface PokemonListResponse {
  count: number
  next: string | null
  previous: string | null
  results: {
    name: string
    url: string
  }[]
}

// Use a more compatible approach for IndexedDB in the worker context
let db = null

// Initialize the database
const initDB = () => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open("pokemon-db", 1)

    request.onerror = (event) => {
      console.error("IndexedDB error:", event)
      reject(new Error("Failed to open database"))
    }

    request.onsuccess = (event) => {
      db = event.target.result
      resolve(db)
    }

    request.onupgradeneeded = (event) => {
      const db = event.target.result
      const pokemonStore = db.createObjectStore("pokemon", { keyPath: "id" })
      pokemonStore.createIndex("by-name", "name", { unique: false })
    }
  })
}

// Fetch Pokémon list from API
const fetchPokemonList = async (limit = 151) => {
  const response = await fetch(`https://pokeapi.co/api/v2/pokemon?limit=${limit}`)
  if (!response.ok) {
    throw new Error(`Failed to fetch Pokémon list: ${response.status}`)
  }
  return response.json()
}

// Fetch detailed Pokémon data
const fetchPokemonDetails = async (url) => {
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`Failed to fetch Pokémon details: ${response.status}`)
  }
  return response.json()
}

// Count items in a store
const countItems = (storeName) => {
  return new Promise((resolve, reject) => {
    if (!db) {
      reject(new Error("Database not initialized"))
      return
    }

    const transaction = db.transaction(storeName, "readonly")
    const store = transaction.objectStore(storeName)
    const countRequest = store.count()

    countRequest.onsuccess = () => {
      resolve(countRequest.result)
    }

    countRequest.onerror = (event) => {
      reject(new Error(`Failed to count items: ${event.target.error}`))
    }
  })
}

// Load Pokémon data into IndexedDB
const loadPokemonData = async () => {
  try {
    if (!db) {
      throw new Error("Database not initialized")
    }

    // Check if we already have data
    const count = await countItems("pokemon")
    if (count > 0) {
      return // Data already loaded
    }

    // Fetch the list of Pokémon
    const pokemonList = await fetchPokemonList()

    // Fetch details for each Pokémon
    const detailsPromises = pokemonList.results.map((pokemon) => fetchPokemonDetails(pokemon.url))

    // Process in batches to avoid overwhelming the browser
    const batchSize = 10
    for (let i = 0; i < detailsPromises.length; i += batchSize) {
      const batch = detailsPromises.slice(i, i + batchSize)
      const pokemonDetails = await Promise.all(batch)

      // Store each Pokémon in IndexedDB
      const transaction = db.transaction("pokemon", "readwrite")
      const store = transaction.objectStore("pokemon")

      for (const pokemon of pokemonDetails) {
        store.put(pokemon)
      }

      await new Promise((resolve, reject) => {
        transaction.oncomplete = () => resolve()
        transaction.onerror = () => reject(new Error("Transaction failed"))
      })
    }
  } catch (error) {
    console.error("Error loading Pokémon data:", error)
    throw error
  }
}

// Get all Pokémon from IndexedDB
const getAllPokemon = () => {
  return new Promise((resolve, reject) => {
    if (!db) {
      reject(new Error("Database not initialized"))
      return
    }

    const transaction = db.transaction("pokemon", "readonly")
    const store = transaction.objectStore("pokemon")
    const request = store.getAll()

    request.onsuccess = () => {
      resolve(request.result)
    }

    request.onerror = () => {
      reject(new Error("Failed to get Pokémon"))
    }
  })
}

// Get a specific Pokémon by ID
const getPokemonById = (id) => {
  return new Promise((resolve, reject) => {
    if (!db) {
      reject(new Error("Database not initialized"))
      return
    }

    const transaction = db.transaction("pokemon", "readonly")
    const store = transaction.objectStore("pokemon")
    const request = store.get(id)

    request.onsuccess = () => {
      if (request.result) {
        resolve(request.result)
      } else {
        reject(new Error(`Pokémon with ID ${id} not found`))
      }
    }

    request.onerror = () => {
      reject(new Error("Failed to get Pokémon"))
    }
  })
}

// Search Pokémon by name
const searchPokemon = async (query) => {
  const allPokemon = await getAllPokemon()
  return allPokemon.filter((pokemon) => pokemon.name.toLowerCase().includes(query.toLowerCase()))
}

// Refresh data from the API
const refreshData = async () => {
  if (!db) {
    throw new Error("Database not initialized")
  }

  // Clear existing data
  const transaction = db.transaction("pokemon", "readwrite")
  const store = transaction.objectStore("pokemon")
  store.clear()

  await new Promise((resolve, reject) => {
    transaction.oncomplete = () => resolve()
    transaction.onerror = () => reject(new Error("Failed to clear data"))
  })

  // Load fresh data
  await loadPokemonData()
}

// Initialize the worker
const initialize = async () => {
  try {
    db = await initDB()
    await loadPokemonData()
    self.postMessage({ type: "initialized" })
  } catch (error) {
    console.error("Failed to initialize worker:", error)
    self.postMessage({ type: "error", error: String(error) })
  }
}

// Handle messages from the main thread
self.onmessage = async (event) => {
  try {
    const { action, data, id } = event.data

    let result

    switch (action) {
      case "getAllPokemon":
        result = await getAllPokemon()
        break
      case "getPokemonById":
        result = await getPokemonById(data.id)
        break
      case "searchPokemon":
        result = await searchPokemon(data.query)
        break
      case "refreshData":
        await refreshData()
        result = null
        break
      default:
        throw new Error(`Unknown action: ${action}`)
    }

    self.postMessage({ id, result })
  } catch (error) {
    console.error("Worker error:", error)
    self.postMessage({
      id: event.data.id,
      error: String(error),
    })
  }
}

// Start initialization
initialize()
