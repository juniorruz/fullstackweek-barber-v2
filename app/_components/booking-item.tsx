"use client"

import { Prisma } from "@prisma/client"
import { Badge } from "./ui/badge"
import { Card, CardContent } from "./ui/card"
import { format, isFuture } from "date-fns"
import { ptBR } from "date-fns/locale"
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "./ui/sheet"
import Image from "next/image"
import { Button } from "./ui/button"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "./ui/alert-dialog"
import { deleteBooking } from "../_actions/delete-booking"
import { toast } from "sonner"
import { useState } from "react"
import BookingSummary from "./booking-summary"

import { Dialog, DialogContent, DialogTitle } from "./ui/dialog"
import useMediaQuery from "../hook/useMediaQuery"

interface BookingItemProps {
  booking: Prisma.BookingGetPayload<{
    include: {
      service: {
        include: {
          barber: true
        }
      }
    }
  }>
}

const BookingItem = ({ booking }: BookingItemProps) => {
  const [selectedBookingId, setSelectedBookingId] = useState<string | null>(
    null,
  )
  const [isSheetOpen, setIsSheetOpen] = useState(false)
  const isWideScreen = useMediaQuery(767)
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  const {
    service: { barber },
  } = booking

  const isConfirmed = isFuture(booking.date)
  const handleCancelBooking = async () => {
    try {
      await deleteBooking(booking.id)
      setSelectedBookingId(null)
      setIsSheetOpen(false)
      toast.success("Reserva cancelada com sucesso!")
    } catch (error) {
      console.error(error)
      toast.error("Erro ao cancelar reserva. Tente novamente")
    }
  }

  const handleSelectBooking = () => {
    setSelectedBookingId(selectedBookingId === booking.id ? null : booking.id)
    setIsDialogOpen(true)
  }

  const handleSheetOpenChange = (isOpen: boolean) => {
    setIsSheetOpen(isOpen)
  }

  return (
    <>
      <div className="hidden w-[500px] md:flex md:flex-col">
        <Card>
          <CardContent className="flex w-full p-0">
            <div
              onClick={handleSelectBooking}
              className="flex w-full cursor-pointer justify-between"
            >
              <div className="flex flex-col p-5">
                <Badge
                  className="w-fit"
                  variant={isConfirmed ? "default" : "secondary"}
                >
                  {isConfirmed ? "Confirmado" : "Finalizado"}
                </Badge>
                <h3 className="mt-2 font-semibold">{booking.service?.name}</h3>
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold">Barbeiro: </p>
                  <p className="text-sm">{booking.service?.barber.name}</p>
                </div>
              </div>
              <div className="flex flex-col items-center justify-center border-l-2 border-solid px-5">
                <p className="text-sm">
                  {format(booking.date, "MMMM", { locale: ptBR })}
                </p>
                <p className="text-2xl capitalize">
                  {format(booking.date, "dd", { locale: ptBR })}
                </p>
                <p className="text-sm">
                  {format(booking.date, "HH:mm", { locale: ptBR })}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex max-w-[600px] flex-col">
        {isWideScreen && selectedBookingId === booking.id && (
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogContent>
              <DialogTitle className="flex justify-center">
                Detalhes da Reserva
              </DialogTitle>
              <div className="relative mt-6 flex h-[180px] w-full items-end rounded-xl">
                <Image
                  src="/map.png"
                  alt={`mapa da barbearia ${barber?.name}`}
                  fill
                  className="rounded-xl object-cover"
                />
                <Card className="z-50 mx-5 mb-3 w-full rounded-xl">
                  <CardContent className="flex items-center gap-3 px-5 py-3">
                    <div>
                      <h3 className="font-bold">Barbearia Vintage</h3>
                      <p className="text-xs"> {barber?.name}</p>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="mt-6">
                <Badge
                  className="w-fit"
                  variant={isConfirmed ? "default" : "secondary"}
                >
                  {isConfirmed ? "Confirmado" : "Finalizado"}
                </Badge>

                <div className="mb-3 mt-6">
                  <BookingSummary
                    service={booking.service}
                    barber={barber}
                    selectedDate={booking.date}
                  />
                </div>

                {isConfirmed && (
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant={"destructive"} className="w-full">
                        Cancelar reserva
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent className="w-[90%]">
                      <AlertDialogHeader>
                        <AlertDialogTitle>
                          Você quer cancelar sua reserva?
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                          Tem certeza que deseja fazer o cancelamento? Essa ação
                          não pode ser desfeita.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction asChild>
                          <Button
                            variant={"destructive"}
                            onClick={handleCancelBooking}
                          >
                            Confirmar
                          </Button>
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                )}
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {!isWideScreen && (
        <Sheet open={isSheetOpen} onOpenChange={handleSheetOpenChange}>
          <SheetTrigger className="w-full min-w-[90%] md:hidden">
            <Card className="min-w-[90%]">
              <CardContent className="flex justify-between p-0">
                <div className="flex flex-col gap-2 py-4 pl-4">
                  <Badge
                    className="w-fit"
                    variant={isConfirmed ? "default" : "secondary"}
                  >
                    {isConfirmed ? "Confirmado" : "Finalizado"}
                  </Badge>
                  <h3 className="mt-2 font-semibold">
                    {booking.service?.name}
                  </h3>
                  <div className="flex items-center gap-1">
                    <p className="text-sm font-semibold">Barbeiro: </p>
                    <p className="text-sm">{booking.service?.barber.name}</p>
                  </div>
                </div>
                <div className="flex flex-col items-center justify-center border-l-2 border-solid px-5">
                  <p className="text-sm">
                    {format(booking.date, "MMMM", { locale: ptBR })}
                  </p>
                  <p className="text-2xl capitalize">
                    {format(booking.date, "dd", { locale: ptBR })}
                  </p>
                  <p className="text-sm">
                    {format(booking.date, "HH:mm", { locale: ptBR })}
                  </p>
                </div>
              </CardContent>
            </Card>
          </SheetTrigger>
          <SheetContent className="w-[85%]">
            <SheetHeader className="">
              <SheetTitle className="text-left">
                Informações da reserva
              </SheetTitle>
            </SheetHeader>
            <div className="relative mt-6 flex h-[180px] w-full items-end rounded-xl">
              <Image
                src="/map.png"
                alt={`mapa da barbearia ${barber?.name}`}
                fill
                className="rounded-xl object-cover"
              />

              <Card className="z-50 mx-5 mb-3 w-full rounded-xl">
                <CardContent className="flex items-center gap-3 px-5 py-3">
                  <div>
                    <h3 className="font-bold">Barbearia Vintage</h3>
                    <p className="text-xs"> {barber?.address}</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="mt-6">
              <Badge
                className="w-fit"
                variant={isConfirmed ? "default" : "secondary"}
              >
                {isConfirmed ? "Confirmado" : "Finalizado"}
              </Badge>
              <div className="mb-3 mt-6">
                <BookingSummary
                  service={booking.service}
                  barber={barber}
                  selectedDate={booking.date}
                />
              </div>
            </div>

            <SheetFooter className="mt-6">
              <div className="flex items-center gap-3">
                <SheetClose asChild>
                  <Button variant={"outline"} className="w-full">
                    Voltar
                  </Button>
                </SheetClose>
                {isConfirmed && (
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant={"destructive"} className="w-full">
                        Cancelar reserva
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent className="w-[90%]">
                      <AlertDialogHeader>
                        <AlertDialogTitle>
                          Você quer cancelar sua reserva?
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                          Tem certeza que deseja fazer o cancelamento? Essa ação
                          não pode ser desfeita.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction asChild>
                          <Button
                            variant={"destructive"}
                            onClick={handleCancelBooking}
                          >
                            Confirmar
                          </Button>
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                )}
              </div>
            </SheetFooter>
          </SheetContent>
        </Sheet>
      )}
    </>
  )
}

export default BookingItem
