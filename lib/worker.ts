// Web Worker implementation
// Using classic worker syntax (no ES modules)

// Type definitions (inline since we can't import in classic workers)
interface PokemonType {
	slot: number;
	type: {
		name: string;
		url: string;
	};
}

interface PokemonAbility {
	ability: {
		name: string;
		url: string;
	};
	is_hidden: boolean;
	slot: number;
}

interface PokemonStat {
	base_stat: number;
	effort: number;
	stat: {
		name: string;
		url: string;
	};
}

interface Pokemon {
	id: number;
	name: string;
	base_experience: number;
	height: number;
	weight: number;
	sprites: {
		front_default: string | null;
		back_default: string | null;
		front_shiny: string | null;
		back_shiny: string | null;
		other?: {
			'official-artwork'?: {
				front_default?: string;
			};
		};
	};
	stats: PokemonStat[];
	types: PokemonType[];
	abilities: PokemonAbility[];
}

interface PokemonListResponse {
	count: number;
	next: string | null;
	previous: string | null;
	results: {
		name: string;
		url: string;
	}[];
}

// Use a more compatible approach for IndexedDB in the worker context
let db: IDBDatabase | null = null;

const DB_NAME = 'pokemon-db';
const STORE_NAME = 'pokemon';

// Initialize the database
const initDB = () => {
	return new Promise<IDBDatabase>((resolve, reject) => {
		const request = indexedDB.open(DB_NAME, 1);

		request.onerror = (event) => {
			console.error('IndexedDB error:', event);
			reject(new Error('Failed to open database'));
		};

		request.onsuccess = (event) => {
			db = (event.target as IDBOpenDBRequest).result;
			resolve(db);
		};

		request.onupgradeneeded = (event) => {
			const db = (event.target as IDBOpenDBRequest).result;
			if (!db.objectStoreNames.contains(STORE_NAME)) {
				const pokemonStore = db.createObjectStore(STORE_NAME, {
					keyPath: 'id',
				});
				pokemonStore.createIndex('by-name', 'name', { unique: false });
			}
		};
	});
};

// Fetch Pokémon list from API with increasing limit until empty
const fetchAllPokemon = async () => {
	let allPokemonUrls: { name: string; url: string }[] = [];
	let nextUrl: string | null = 'https://pokeapi.co/api/v2/pokemon?limit=100'; // Start with a reasonable limit

	while (nextUrl) {
		const response = await fetch(nextUrl);
		if (!response.ok) {
			throw new Error(`Failed to fetch Pokémon list: ${response.status}`);
		}
		const data: PokemonListResponse = await response.json();
		allPokemonUrls = allPokemonUrls.concat(data.results);
		nextUrl = data.next;
		// Add a small delay to be kind to the API
		await new Promise((resolve) => setTimeout(resolve, 50));
	}
	return allPokemonUrls;
};

// Fetch detailed Pokémon data
const fetchPokemonDetails = async (url: string): Promise<Pokemon> => {
	const response = await fetch(url);
	if (!response.ok) {
		throw new Error(`Failed to fetch Pokémon details: ${response.status}`);
	}
	return response.json();
};

// Count items in a store
const countItems = (storeName: string): Promise<number> => {
	return new Promise((resolve, reject) => {
		if (!db) {
			reject(new Error('Database not initialized'));
			return;
		}

		const transaction = db.transaction(storeName, 'readonly');
		const store = transaction.objectStore(storeName);
		const countRequest = store.count();

		countRequest.onsuccess = () => {
			resolve(countRequest.result);
		};

		countRequest.onerror = (event) => {
			reject(
				new Error(
					`Failed to count items: ${(event.target as IDBRequest).error}`,
				),
			);
		};
	});
};

// Load all Pokémon data into IndexedDB
const loadAllPokemonData = async () => {
	try {
		if (!db) {
			throw new Error('Database not initialized');
		}

		// Check if we already have data
		const count = await countItems(STORE_NAME);
		if (count > 0) {
			return; // Data already loaded
		}

		// Fetch all Pokémon URLs
		const allPokemonUrls = await fetchAllPokemon();

		// Fetch details for each Pokémon in batches
		const batchSize = 5; // Adjust batch size as needed
		for (let i = 0; i < allPokemonUrls.length; i += batchSize) {
			const batch = allPokemonUrls.slice(i, i + batchSize);
			const detailsPromises = batch.map((pokemon) =>
				fetchPokemonDetails(pokemon.url),
			);
			const pokemonDetails = await Promise.all(detailsPromises);

			// Store each Pokémon in IndexedDB
			const transaction = db.transaction(STORE_NAME, 'readwrite');
			const store = transaction.objectStore(STORE_NAME);

			for (const pokemon of pokemonDetails) {
				store.put(pokemon);
			}

			await new Promise<void>((resolve, reject) => {
				transaction.oncomplete = () => resolve();
				transaction.onerror = () => reject(new Error('Transaction failed'));
			});

			// Send progress update (optional)
			self.postMessage({
				type: 'progress',
				loaded: i + batch.length,
				total: allPokemonUrls.length,
			});
		}
		self.postMessage({ type: 'dataLoaded' });
	} catch (error) {
		console.error('Error loading all Pokémon data:', error);
		self.postMessage({ type: 'error', error: String(error) });
	}
};

// Get all Pokémon from IndexedDB
const getAllPokemonFromDB = (): Promise<Pokemon[]> => {
	return new Promise((resolve, reject) => {
		if (!db) {
			reject(new Error('Database not initialized'));
			return;
		}

		const transaction = db.transaction(STORE_NAME, 'readonly');
		const store = transaction.objectStore(STORE_NAME);
		const request = store.getAll();

		request.onsuccess = () => {
			resolve(request.result);
		};

		request.onerror = () => {
			reject(new Error('Failed to get Pokémon from DB'));
		};
	});
};

// Get a specific Pokémon by ID from IndexedDB
const getPokemonByIdFromDB = (id: number): Promise<Pokemon | undefined> => {
	return new Promise((resolve, reject) => {
		if (!db) {
			reject(new Error('Database not initialized'));
			return;
		}

		const transaction = db.transaction(STORE_NAME, 'readonly');
		const store = transaction.objectStore(STORE_NAME);
		const request = store.get(id);

		request.onsuccess = () => {
			resolve(request.result);
		};

		request.onerror = () => {
			reject(new Error('Failed to get Pokémon from DB'));
		};
	});
};

// Search Pokémon by name in IndexedDB
const searchPokemonInDB = async (query: string): Promise<Pokemon[]> => {
	if (!db) {
		throw new Error('Database not initialized');
	}

	return new Promise((resolve, reject) => {
		const transaction = db.transaction(STORE_NAME, 'readonly');
		const store = transaction.objectStore(STORE_NAME);
		const index = store.index('by-name');
		const results: Pokemon[] = [];

		const request = index.openCursor();

		request.onsuccess = (event) => {
			const cursor = (event.target as IDBRequest).result;
			if (cursor) {
				if (cursor.value.name.toLowerCase().includes(query.toLowerCase())) {
					results.push(cursor.value);
				}
				cursor.continue();
			} else {
				resolve(results);
			}
		};

		request.onerror = () => {
			reject(new Error('Failed to search Pokémon'));
		};
	});
};

// Refresh data from the API
const refreshData = async () => {
	if (!db) {
		throw new Error('Database not initialized');
	}

	// Clear existing data
	const transaction = db.transaction(STORE_NAME, 'readwrite');
	const store = transaction.objectStore(STORE_NAME);
	store.clear();

	await new Promise<void>((resolve, reject) => {
		transaction.oncomplete = () => resolve();
		transaction.onerror = () => reject(new Error('Failed to clear data'));
	});

	// Load fresh data
	await loadAllPokemonData();
};

// Initialize the worker
const initialize = async () => {
	try {
		db = await initDB();
		self.postMessage({ type: 'initializing' });
		await loadAllPokemonData();
		self.postMessage({ type: 'initialized' });
	} catch (error) {
		console.error('Failed to initialize worker:', error);
		self.postMessage({ type: 'error', error: String(error) });
	}
};

// Handle messages from the main thread
self.onmessage = async (event) => {
	try {
		const { action, data, id } = event.data;

		let result;

		switch (action) {
			case 'getAllPokemon':
				result = await getAllPokemonFromDB();
				break;
			case 'getPokemonById':
				result = await getPokemonByIdFromDB(data.id);
				break;
			case 'searchPokemon':
				result = await searchPokemonInDB(data.query);
				break;
			case 'refreshData':
				await refreshData();
				result = null;
				break;
			default:
				throw new Error(`Unknown action: ${action}`);
		}

		self.postMessage({ id, result });
	} catch (error) {
		console.error('Worker error:', error);
		self.postMessage({
			id: event.data.id,
			error: String(error),
		});
	}
};

// Start initialization
initialize();
