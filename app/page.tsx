import Header from "./_components/header"
import { Button } from "./_components/ui/button"
import Image from "next/image"
import { db } from "./_lib/prisma"

import { quickSearchOptions } from "./_constants/search"
import BookingItem from "./_components/booking-item"
import Search from "./_components/search"
import Link from "next/link"
import { authOptions } from "./_lib/auth"
import { getServerSession } from "next-auth"
import { ptBR } from "date-fns/locale"
import { format } from "date-fns"
import { getConfirmedBookings } from "./_data/get-confirmed-bookings"
import BarberItem from "./_components/barbershop-item"

const Home = async () => {
  const session = await getServerSession(authOptions)
  const barbers = await db.barber.findMany({
    orderBy: {
      name: "asc",
    },
  })

  const confirmedBookings = await getConfirmedBookings()

  return (
    <div>
      <Header />
      <div className="p-5 md:p-0">
        <div className="relative w-full md:flex">
          <Image
            src="/bg-barbearia.png"
            alt="imagem-de-fundo-barbearia"
            fill
            className="hidden object-cover object-[50%_10%] opacity-[20%] md:flex"
          />
          <div className="relative mt-6 flex flex-col md:min-w-[500px] lg:min-w-[700px]">
            <div className="flex flex-col md:pl-[128px]">
              <h2 className="text-xl font-bold">
                Olá, {session?.user ? session.user.name : "Seja bem-vindo!"}
              </h2>
              <p>
                <span className="capitalize">
                  {format(new Date(), "EEEE, dd", { locale: ptBR })}
                </span>
                <span>&nbsp;de&nbsp;</span>
                <span className="capitalize">
                  {format(new Date(), "MMMM", { locale: ptBR })}
                </span>
              </p>
            </div>

            <div className="mt-6 pr-10 md:pl-[128px]">
              <Search />
            </div>
          </div>
          <div className="relative hidden flex-col overflow-auto pr-[128px] md:flex md:max-w-[617px] lg:max-w-[800px] 2xl:pr-0 [&::-webkit-scrollbar]:hidden">
            <h2 className="mb-3 mt-6 text-xs font-bold uppercase text-gray-400">
              Barbeiros
            </h2>
            <div className="flex gap-4 overflow-auto [&::-webkit-scrollbar]:hidden">
              {barbers.map((barbers) => (
                <BarberItem key={barbers.id} barber={barbers} />
              ))}
            </div>
          </div>
        </div>

        <div className="mt-6 flex gap-3 overflow-x-scroll md:hidden [&::-webkit-scrollbar]:hidden">
          {quickSearchOptions.map((option) => (
            <Button
              className="gap-2"
              variant="secondary"
              key={option.title}
              asChild
            >
              <Link href={`/barbershops?service=${option.title}`}>
                <Image
                  src={option.imageUrl ?? ""}
                  width={16}
                  height={16}
                  alt={option.title}
                />
                {option.title}
              </Link>
            </Button>
          ))}
        </div>

        <div className="relative mt-6 h-[150px] w-full md:hidden">
          <Image
            alt="Agende nos melhores com FSW Barber"
            src="/banner.png"
            fill
            className="rounded-xl object-cover object-[50%_100%]"
          />
        </div>
        <div className="flex flex-col md:flex-row md:gap-3 md:overflow-x-scroll md:px-[128px] md:py-5 [&::-webkit-scrollbar]:hidden">
          <div>
            {confirmedBookings.length > 0 && (
              <>
                <h2 className="mb-3 mt-6 text-xs font-bold uppercase text-gray-400">
                  Agendamentos
                </h2>
              </>
            )}

            <div className="flex gap-3 overflow-x-auto [&::-webkit-scrollbar]:hidden">
              {confirmedBookings.map((booking) => (
                <BookingItem
                  key={booking.id}
                  booking={JSON.parse(JSON.stringify(booking))}
                />
              ))}
            </div>
          </div>
        </div>

        <h2 className="mb-3 mt-6 text-xs font-bold uppercase text-gray-400 md:hidden">
          Barbeiros
        </h2>
        <div className="flex gap-4 overflow-auto md:hidden [&::-webkit-scrollbar]:hidden">
          {barbers.map((barbers) => (
            <BarberItem key={barbers.id} barber={barbers} />
          ))}
        </div>
      </div>
    </div>
  )
}

export default Home
