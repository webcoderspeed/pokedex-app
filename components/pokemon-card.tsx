"use client"

import { motion } from "framer-motion"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import type { Pokemon } from "@/types/pokemon"
import Link from "next/link"
import Image from "next/image"

interface PokemonCardProps {
  pokemon: Pokemon
}

export function PokemonCard({ pokemon }: PokemonCardProps) {
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
    <Link href={`/pokemon/${pokemon.id}`}>
      <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="h-full">
        <Card className="overflow-hidden transition-all duration-300 hover:shadow-lg dark:hover:shadow-primary/20 h-full">
          <div className="relative flex items-center justify-center bg-gray-100 p-6 dark:bg-gray-800">
            <div
              className="absolute inset-0 opacity-10 bg-contain bg-center bg-no-repeat"
              style={{ backgroundImage: `url(${pokemon.sprites.front_default})` }}
            />
            <Image
              src={pokemon.sprites.front_default || "/placeholder.svg?height=120&width=120"}
              alt={pokemon.name}
              width={120}
              height={120}
              className="h-32 w-32 object-contain"
            />
          </div>
          <CardContent className="p-4">
            <h3 className="text-xl font-bold capitalize">{pokemon.name}</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">#{pokemon.id.toString().padStart(3, "0")}</p>
          </CardContent>
          <CardFooter className="flex flex-wrap gap-2 p-4 pt-0">
            {pokemon.types.map((type) => (
              <Badge key={type.type.name} className={`${typeColors[type.type.name] || "bg-gray-500"} text-white`}>
                {type.type.name}
              </Badge>
            ))}
          </CardFooter>
        </Card>
      </motion.div>
    </Link>
  )
}
