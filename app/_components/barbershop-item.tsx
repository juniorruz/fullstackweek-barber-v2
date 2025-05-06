import { Card, CardContent } from "./ui/card"
import Image from "next/image"
import { Button } from "./ui/button"
import { Badge } from "./ui/badge"
import { StarIcon } from "lucide-react"
import Link from "next/link"
import { Barber } from "@prisma/client"

interface BarbershopItemProps {
  barber: Barber
}

const BarbershopItem = ({ barber }: BarbershopItemProps) => {
  return (
    <Card className="min-w-[167px] rounded-2xl">
      <CardContent className="p-0 px-1 pt-1">
        {/* IMAGEM */}
        <div className="relative h-[159px] w-full">
          <Image
            alt={barber.name}
            fill
            className="rounded-2xl object-cover"
            src="/barber.png"
          />

          <Badge
            className="absolute left-2 top-2 space-x-1"
            variant="secondary"
          >
            <StarIcon size={12} className="fill-primary text-primary" />
            <p className="text-xs font-semibold">5,0</p>
          </Badge>
        </div>

        {/* TEXTO */}
        <div className="px-1 py-3">
          <h3 className="truncate font-semibold">{barber.name}</h3>
          <p className="truncate text-sm text-gray-400">{barber.address}</p>
          <Button variant="secondary" className="mt-3 w-full" asChild>
            <Link href={`/barbershops/${barber.id}`}>Reservar</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

export default BarbershopItem
