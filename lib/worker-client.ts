"use client"

import type { Pokemon } from "@/types/pokemon"

let worker: Worker | null = null
let workerReady = false

// Initialize the worker
export async function initWorker(): Promise<void> {
  if (typeof window === "undefined") {
    throw new Error("Web Workers are only available in the browser")
  }

  if (worker && workerReady) {
    return
  }

  return new Promise<void>((resolve, reject) => {
    try {
      // Create a classic worker (not a module worker)
      worker = new Worker(new URL("./worker.ts", import.meta.url))

      worker.onmessage = (event) => {
        if (event.data.type === "initialized") {
          workerReady = true
          resolve()
        }
      }

      worker.onerror = (error) => {
        console.error("Worker error:", error)
        reject(error)
      }
    } catch (error) {
      console.error("Failed to initialize worker:", error)
      reject(error)
    }
  })
}

// Helper function to communicate with the worker
async function sendMessageToWorker<T>(action: string, data?: any): Promise<T> {
  if (!worker || !workerReady) {
    await initWorker()
  }

  return new Promise<T>((resolve, reject) => {
    if (!worker) {
      reject(new Error("Worker not initialized"))
      return
    }

    const messageId = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`

    const handleMessage = (event: MessageEvent) => {
      if (event.data.id === messageId) {
        worker?.removeEventListener("message", handleMessage)

        if (event.data.error) {
          reject(new Error(event.data.error))
        } else {
          resolve(event.data.result)
        }
      }
    }

    worker.addEventListener("message", handleMessage)
    worker.postMessage({ action, data, id: messageId })
  })
}

// API functions to interact with the worker
export async function getAllPokemon(): Promise<Pokemon[]> {
  return sendMessageToWorker<Pokemon[]>("getAllPokemon")
}

export async function getPokemonById(id: number): Promise<Pokemon> {
  return sendMessageToWorker<Pokemon>("getPokemonById", { id })
}

export async function searchPokemon(query: string): Promise<Pokemon[]> {
  return sendMessageToWorker<Pokemon[]>("searchPokemon", { query })
}

export async function refreshPokemonData(): Promise<void> {
  return sendMessageToWorker<void>("refreshData")
}
