import PhoneItem from "@/app/_components/phone-item"
import ServiceItem from "@/app/_components/service-item"
import SidebarSheet from "@/app/_components/sidebar-sheet"
import { Button } from "@/app/_components/ui/button"
import { SheetTrigger, Sheet } from "@/app/_components/ui/sheet"
import { db } from "@/app/_lib/prisma"
import { ChevronLeftIcon, MapPinIcon, MenuIcon } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { notFound } from "next/navigation"

import Header from "@/app/_components/header"
import { Card, CardContent } from "@/app/_components/ui/card"
import { DAYS_OF_WEEK, DAYS_OF_WEEK_LABELS } from "@/app/_constants/work"

interface BarberPageProps {
  params: {
    id: string
  }
}

const BarberPage = async ({ params }: BarberPageProps) => {
  const barber = await db.barber.findUnique({
    where: {
      id: params.id,
    },
    include: {
      services: true,
      businessHours: true,
    },
  })

  if (!barber) {
    return notFound()
  }

  barber.businessHours.find((businessHour) => {
    if (businessHour.isOpen === false) {
      return <h1>Não está aberto</h1>
    }
  })

  const dayOrder = DAYS_OF_WEEK.reduce(
    (acc, day, index) => {
      acc[day.value] = index
      return acc
    },
    {} as Record<string, number>,
  )

  const sortedBusinessHours = barber.businessHours.sort((a, b) => {
    const aDay = dayOrder[a.dayOfWeek]
    const bDay = dayOrder[b.dayOfWeek]

    if (aDay === bDay) {
      return a.startTime.localeCompare(b.startTime)
    }

    return aDay - bDay
  })

  return (
    <>
      <div className="hidden md:block">
        <Header />
      </div>
      <div className="flex w-full justify-center md:px-[128px] md:py-[40px]">
        <div className="flex flex-col md:min-w-[400px] md:max-w-[1200px]">
          <div className="flex">
            <Image
              src="/barber.png"
              alt={barber.name}
              width={758}
              height={575}
              className="h-[200px] rounded-lg object-cover md:h-[575px] md:object-[50%_20%]"
            />

            <Button
              size="icon"
              variant="secondary"
              className="absolute left-4 top-4 md:hidden"
            >
              <Link href="/">
                <ChevronLeftIcon />
              </Link>
            </Button>

            <Sheet>
              <SheetTrigger asChild className="md:hidden">
                <Button
                  size="icon"
                  variant="outline"
                  className="absolute right-4 top-4"
                >
                  <MenuIcon />
                </Button>
              </SheetTrigger>
              <SidebarSheet />
            </Sheet>
          </div>

          <div className="border-b border-solid p-5 md:hidden">
            <h1 className="mb-3 text-2xl font-bold">{barber.name}</h1>
            <div className="item-center mb-2 flex gap-2">
              <MapPinIcon className="text-primary" size={18} />
              <p className="text-sm">{barber?.address}</p>
            </div>
          </div>

          <div className="space-y-3 border-b border-solid p-5 md:mt-4 md:w-full md:border-none md:p-0">
            <h2 className="text-xs font-bold uppercase text-gray-400">
              Serviços
            </h2>
            <div className="mb-3 items-center space-y-3 md:grid md:grid-cols-2 md:gap-2 md:space-y-0">
              {barber.services.map((service) => (
                <ServiceItem
                  key={service.id}
                  barber={JSON.parse(JSON.stringify(barber))}
                  service={JSON.parse(JSON.stringify(service))}
                />
              ))}
            </div>
          </div>

          <div className="space-y-3 border-b border-solid p-5 md:hidden">
            {" "}
            {barber.phones && (
              <PhoneItem key={barber.phones} phone={barber.phones} />
            )}
          </div>

          <div className="flex flex-col px-5 pt-5 md:hidden">
            {sortedBusinessHours.map((businessHour) => (
              <div key={businessHour.id} className="flex justify-between">
                <h2 className="font-semibold">
                  {DAYS_OF_WEEK_LABELS[
                    businessHour.dayOfWeek as keyof typeof DAYS_OF_WEEK_LABELS
                  ] || businessHour.dayOfWeek}
                </h2>

                <div className="flex items-center gap-1">
                  {businessHour.isOpen ? (
                    <div className="flex gap-1">
                      <p className="font-semibold">{businessHour.startTime}</p>-
                      <p className="font-semibold">{businessHour.endTime}</p>
                    </div>
                  ) : (
                    <span className="text-sm font-semibold text-gray-400">
                      Sem horário
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="hidden pl-10 md:block">
          <Card>
            <CardContent className="h-[770px] w-[386px]">
              <div className="border-b border-solid p-5">
                <h1 className="mb-3 text-2xl font-bold">{barber.name}</h1>
                <div className="item-center mb-2 flex gap-2">
                  <MapPinIcon className="text-primary" size={18} />
                  <p className="text-sm">{barber?.address}</p>
                </div>
              </div>
              <div className="space-y-3 border-b border-solid p-5">
                {barber.phones && (
                  <PhoneItem key={barber.phones} phone={barber.phones} />
                )}
              </div>
              <div className="pt-5">
                {sortedBusinessHours.map((businessHour) => (
                  <div key={businessHour.id} className="flex justify-between">
                    <h2 className="font-semibold">
                      {DAYS_OF_WEEK_LABELS[
                        businessHour.dayOfWeek as keyof typeof DAYS_OF_WEEK_LABELS
                      ] || businessHour.dayOfWeek}
                    </h2>

                    <div className="flex items-center gap-1">
                      {businessHour.isOpen ? (
                        <div className="flex gap-1">
                          <p className="font-semibold">
                            {businessHour.startTime}
                          </p>
                          -
                          <p className="font-semibold">
                            {businessHour.endTime}
                          </p>
                        </div>
                      ) : (
                        <span className="text-sm font-semibold text-gray-400">
                          Sem horário
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  )
}

export default BarberPage
