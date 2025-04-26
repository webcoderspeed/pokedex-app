export interface PokemonListResponse {
  count: number
  next: string | null
  previous: string | null
  results: {
    name: string
    url: string
  }[]
}

export interface Pokemon {
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
  stats: {
    base_stat: number
    effort: number
    stat: {
      name: string
      url: string
    }
  }[]
  types: {
    slot: number
    type: {
      name: string
      url: string
    }
  }[]
  abilities: {
    ability: {
      name: string
      url: string
    }
    is_hidden: boolean
    slot: number
  }[]
}
