"use client"

import { motion } from "framer-motion"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import type { Pokemon } from "@/types/pokemon"
import Image from "next/image"

interface PokemonDetailProps {
  pokemon: Pokemon
}

export function PokemonDetail({ pokemon }: PokemonDetailProps) {
  const typeColors: Record<string, string> = {
    normal: "bg-gray-400",
    fire: "bg-orange-500",
    water: "bg-blue-500",
    electric: "bg-yellow-400",
    grass: "bg-green-500",
    ice: "bg-blue-200",
    fighting: "bg-red-700",
    poison: "bg-purple-500",
    ground: "bg-yellow-700",
    flying: "bg-indigo-300",
    psychic: "bg-pink-500",
    bug: "bg-lime-500",
    rock: "bg-yellow-800",
    ghost: "bg-purple-700",
    dragon: "bg-indigo-700",
    dark: "bg-gray-800",
    steel: "bg-gray-500",
    fairy: "bg-pink-300",
  }

  return (
    <Card className="overflow-hidden">
      <div className="relative flex h-64 items-center justify-center bg-gray-100 dark:bg-gray-800">
        <div
          className="absolute inset-0 opacity-10 bg-contain bg-center bg-no-repeat"
          style={{ backgroundImage: `url(${pokemon.sprites.front_default})` }}
        />
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="relative z-10"
        >
          <Image
            src={pokemon.sprites.front_default || "/placeholder.svg?height=200&width=200"}
            alt={pokemon.name}
            width={200}
            height={200}
            className="h-48 w-48 object-contain"
          />
        </motion.div>
      </div>

      <CardHeader className="pb-2">
        <div className="flex flex-col items-center justify-between gap-2 sm:flex-row">
          <div>
            <h1 className="text-3xl font-bold capitalize">{pokemon.name}</h1>
            <p className="text-gray-500 dark:text-gray-400">#{pokemon.id.toString().padStart(3, "0")}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {pokemon.types.map((type) => (
              <Badge key={type.type.name} className={`${typeColors[type.type.name] || "bg-gray-500"} text-white`}>
                {type.type.name}
              </Badge>
            ))}
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <div className="grid gap-6 md:grid-cols-2">
          <div>
            <h2 className="mb-4 text-xl font-semibold">Base Stats</h2>
            <div className="space-y-3">
              {pokemon.stats.map((stat) => (
                <div key={stat.stat.name}>
                  <div className="mb-1 flex justify-between">
                    <span className="text-sm font-medium capitalize">{stat.stat.name.replace("-", " ")}</span>
                    <span className="text-sm font-semibold">{stat.base_stat}</span>
                  </div>
                  <Progress value={(stat.base_stat / 255) * 100} className="h-2" />
                </div>
              ))}
            </div>
          </div>

          <div>
            <h2 className="mb-4 text-xl font-semibold">Details</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Height</h3>
                <p className="text-lg font-semibold">{pokemon.height / 10} m</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Weight</h3>
                <p className="text-lg font-semibold">{pokemon.weight / 10} kg</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Base Experience</h3>
                <p className="text-lg font-semibold">{pokemon.base_experience}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Abilities</h3>
                <div className="flex flex-wrap gap-1">
                  {pokemon.abilities.map((ability) => (
                    <Badge key={ability.ability.name} variant="outline" className="capitalize">
                      {ability.ability.name.replace("-", " ")}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>

            <h2 className="mb-2 mt-6 text-xl font-semibold">Sprites</h2>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {pokemon.sprites.front_default && (
                <div className="flex flex-col items-center">
                  <Image
                    src={pokemon.sprites.front_default || "/placeholder.svg"}
                    alt={`${pokemon.name} front default`}
                    width={80}
                    height={80}
                    className="h-20 w-20"
                  />
                  <span className="text-xs">Front</span>
                </div>
              )}
              {pokemon.sprites.back_default && (
                <div className="flex flex-col items-center">
                  <Image
                    src={pokemon.sprites.back_default || "/placeholder.svg"}
                    alt={`${pokemon.name} back default`}
                    width={80}
                    height={80}
                    className="h-20 w-20"
                  />
                  <span className="text-xs">Back</span>
                </div>
              )}
              {pokemon.sprites.front_shiny && (
                <div className="flex flex-col items-center">
                  <Image
                    src={pokemon.sprites.front_shiny || "/placeholder.svg"}
                    alt={`${pokemon.name} front shiny`}
                    width={80}
                    height={80}
                    className="h-20 w-20"
                  />
                  <span className="text-xs">Shiny</span>
                </div>
              )}
              {pokemon.sprites.back_shiny && (
                <div className="flex flex-col items-center">
                  <Image
                    src={pokemon.sprites.back_shiny || "/placeholder.svg"}
                    alt={`${pokemon.name} back shiny`}
                    width={80}
                    height={80}
                    className="h-20 w-20"
                  />
                  <span className="text-xs">Shiny Back</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
