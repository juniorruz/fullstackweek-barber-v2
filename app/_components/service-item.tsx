"use client"

import { Barber, BarbershopService, Booking } from "@prisma/client"

import { Button } from "./ui/button"
import { Card, CardContent } from "./ui/card"
import {
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "./ui/sheet"
import { Calendar } from "./ui/calendar"
import { ptBR } from "date-fns/locale"
import { useCallback, useEffect, useMemo, useState } from "react"
import { isPast, isToday, set } from "date-fns"
import { createBooking } from "../_actions/create-booking"
import { useSession } from "next-auth/react"
import { toast } from "sonner"
import { getBookings } from "../_actions/get-bookings"
import { Dialog, DialogContent } from "./ui/dialog"
import SignInDialog from "./sign-in-dialog"
import BookingSummary from "./booking-summary"
import { useRouter } from "next/navigation"
import { Clock } from "lucide-react"
import { getTimeOfWork } from "../_actions/get-time-of-work"
import { getServices } from "../_actions/get-services"

interface ServiceItemProps {
  service: BarbershopService
  barber: Pick<Barber, "name" | "id">
}

interface GetTimeListProps {
  bookings: Booking[]
  selectedDay: Date
  barberId: string
  serviceDuration: number
  timeList: string[]
  services: BarbershopService[]
}

const getTimeList = ({
  bookings,
  selectedDay,
  barberId,
  serviceDuration,
  timeList,
  services,
}: GetTimeListProps) => {
  return timeList.filter((time) => {
    const [hour, minutes] = time.split(":").map(Number)
    const startTime = set(new Date(selectedDay), { hours: hour, minutes })
    const endTime = set(startTime, {
      minutes: startTime.getMinutes() + serviceDuration,
      hours: hour,
    })

    if (isPast(startTime) && isToday(selectedDay)) {
      return false
    }

    const hasBookingOverlap = bookings.some((booking) => {
      const bookingStart = new Date(booking.date)

      const bookedService = services.find((s) => s.id === booking.serviceId)
      const bookingDuration = bookedService ? bookedService.duration : 0

      const bookingEnd = set(bookingStart, {
        minutes: bookingStart.getMinutes() + bookingDuration,
      })

      return (
        booking.barberId === barberId &&
        startTime < bookingEnd &&
        endTime > bookingStart
      )
    })

    return !hasBookingOverlap
  })
}

const ServiceItem = ({ service, barber }: ServiceItemProps) => {
  const router = useRouter()
  const [signInDialogIsOpen, setSignInDialogIsOpen] = useState(false)
  const { data } = useSession()
  const [selectedDay, setSelectedDay] = useState<Date | undefined>(undefined)
  const [selectedTime, setSelectedTime] = useState<string | undefined>(
    undefined,
  )
  const [dayBookings, setDayBookings] = useState<Booking[]>([])
  const [bookingSheetIsOpen, setBookingSheetIsOpen] = useState(false)
  const [timeList, setTimeList] = useState<string[]>([])

  useEffect(() => {
    const fetch = async () => {
      if (!selectedDay) return
      const bookings = await getBookings({
        date: selectedDay,
        serviceId: service.id,
      })

      setDayBookings(bookings)
    }
    fetch()
  }, [selectedDay, service.id])

  const selectedDate = useMemo(() => {
    if (!selectedDay || !selectedTime) return
    return set(selectedDay, {
      hours: Number(selectedTime?.split(":")[0]),
      minutes: Number(selectedTime?.split(":")[1]),
    })
  }, [selectedDay, selectedTime])

  const handleBookingClick = () => {
    if (data?.user) {
      return setBookingSheetIsOpen(true)
    }
    return setSignInDialogIsOpen(true)
  }

  const handleBookingSheetOpenChange = () => {
    setSelectedDay(undefined)
    setSelectedTime(undefined)
    setDayBookings([])
    setBookingSheetIsOpen(false)
    setTimeList([])
  }

  const handleDateSelect = (date: Date | undefined) => {
    setSelectedDay(date)
  }

  const handleTimeSelect = (time: string) => {
    setSelectedTime(time)
  }

  const handleCreateBooking = async () => {
    try {
      if (!selectedDate) return

      await createBooking({
        serviceId: service.id,
        barberId: barber.id,
        date: selectedDate,
      })
      handleBookingSheetOpenChange()
      toast.success("Reserva criada com sucesso!", {
        action: {
          label: "Ver agendamentos",
          onClick: () => router.push("/bookings"),
        },
      })
    } catch (error) {
      console.error(error)
      toast.error("Erro ao criar reserva!")
    }
  }

  const generateTimeList = (
    isOpen: boolean,
    startTime: string,
    endTime: string,
    lunchStartTime: string,
    lunchEndTime: string,
    serviceDuration: number,
    bookedTimes: { startTime: Date; duration: number }[],
  ) => {
    if (!isOpen) return []

    const timeList: string[] = []
    const start = new Date(`1970-01-01T${startTime}`)
    const end = new Date(`1970-01-01T${endTime}`)
    const lunchStart = new Date(`1970-01-01T${lunchStartTime}`)
    const lunchEnd = new Date(`1970-01-01T${lunchEndTime}`)

    let current = start

    while (current < end) {
      const currentEnd = new Date(current)
      currentEnd.setMinutes(current.getMinutes() + serviceDuration)

      const overLapsLunch =
        (current >= lunchStart && current < lunchEnd) ||
        (currentEnd > lunchStart && currentEnd <= lunchEnd)

      const exceedsEnd = currentEnd > end

      const isOccupied = bookedTimes.some(({ startTime, duration }) => {
        const bookedEnd = new Date(startTime)
        bookedEnd.setMinutes(bookedEnd.getMinutes() + duration)

        return current < bookedEnd && currentEnd > startTime
      })

      if (!isOccupied && !overLapsLunch && !exceedsEnd) {
        timeList.push(current.toTimeString().slice(0, 5))
      }

      current.setMinutes(current.getMinutes() + 15)
    }

    return timeList
  }

  const fetchTimeOfWork = useCallback(async () => {
    if (!selectedDay || !barber.id || !service.duration) return

    const dayOfWeek = selectedDay
      .toLocaleString("en-US", { weekday: "long" })
      .toLowerCase()

    const timeOfWork = await getTimeOfWork(barber.id)

    const workingHours = timeOfWork.find(
      (time: { dayOfWeek: string }) => time.dayOfWeek === dayOfWeek,
    )

    const { startTime, endTime, isOpen, lunchStartTime, lunchEndTime } =
      workingHours || { startTime: null, endTime: null, isOpen: true }

    if (!startTime || !endTime) {
      setTimeList([])
      return
    }

    const services = await getServices()

    const bookedTimes = dayBookings.map((booking) => {
      const bookedService = services.find(
        (service: { id: string }) => service.id === booking.serviceId,
      )
      return {
        startTime: booking.date,
        duration: bookedService ? bookedService.duration : 0,
      }
    })

    const dynamicTimeList = generateTimeList(
      isOpen,
      startTime,
      endTime,
      lunchStartTime,
      lunchEndTime,
      service.duration,
      bookedTimes,
    )

    const filteredTimeList = getTimeList({
      bookings: dayBookings,
      selectedDay,
      barberId: barber.id,
      serviceDuration: service.duration,
      timeList: dynamicTimeList,
      services,
    })

    setTimeList(filteredTimeList)
  }, [barber.id, selectedDay, dayBookings, service.duration])

  useEffect(() => {
    fetchTimeOfWork()
  }, [fetchTimeOfWork])

  const timeListDisplay = useMemo(() => {
    return timeList
  }, [timeList])
  return (
    <>
      <Card className="flex h-[100px]">
        <CardContent className="flex w-full items-center justify-between gap-3 p-5 md:p-1">
          <div className="flex flex-col">
            <h3 className="text-sm font-semibold">{service.name}</h3>
            <p className="text-sm font-bold text-primary">
              {Intl.NumberFormat("pt-BR", {
                style: "currency",
                currency: "BRL",
              }).format(Number(service.price))}
            </p>
            <p className="flex items-center text-sm font-bold">
              <Clock className="mr-1 h-4 w-4" />
              {service.duration}min
            </p>
          </div>

          <div className="flex justify-end">
            <Sheet
              open={bookingSheetIsOpen}
              onOpenChange={handleBookingSheetOpenChange}
            >
              <Button
                variant="secondary"
                size="sm"
                onClick={handleBookingClick}
              >
                Reservar
              </Button>

              <SheetContent className="px-0">
                <SheetHeader className="sm:items-center">
                  <SheetTitle>Fazer Reserva</SheetTitle>
                </SheetHeader>

                <div className="border-b border-solid py-5">
                  <Calendar
                    mode="single"
                    locale={ptBR}
                    selected={selectedDay}
                    onSelect={handleDateSelect}
                    fromDate={new Date()}
                    styles={{
                      head_cell: { width: "100%", textTransform: "capitalize" },
                      cell: { width: "100%" },
                      button: { width: "100%" },
                      nav_button_previous: { width: "32px", height: "32px" },
                      nav_button_next: { width: "32px", height: "32px" },
                      caption: { textTransform: "capitalize" },
                    }}
                  />
                </div>

                {selectedDay && (
                  <div className="flex gap-3 overflow-x-auto border-b border-solid p-5 [&::-webkit-scrollbar]:hidden">
                    {timeListDisplay.length > 0 ? (
                      timeListDisplay.map((time) => (
                        <Button
                          key={time}
                          variant={
                            selectedTime === time ? "default" : "outline"
                          }
                          className="rounded-full"
                          onClick={() => handleTimeSelect(time)}
                        >
                          {time}
                        </Button>
                      ))
                    ) : (
                      <p className="text-xs">
                        Não há horários disponíveis para esse dia
                      </p>
                    )}
                  </div>
                )}

                {selectedDate && (
                  <div className="p-5">
                    <BookingSummary
                      service={service}
                      barber={barber}
                      selectedDate={selectedDate}
                    />
                  </div>
                )}
                <SheetFooter className="mt-5 px-5">
                  <Button
                    onClick={handleCreateBooking}
                    disabled={!selectedDay || !selectedTime}
                  >
                    Confirmar
                  </Button>
                </SheetFooter>
              </SheetContent>
            </Sheet>
          </div>
        </CardContent>
      </Card>

      <Dialog
        open={signInDialogIsOpen}
        onOpenChange={(open) => setSignInDialogIsOpen(open)}
      >
        <DialogContent className="w-[90%]">
          <SignInDialog />
        </DialogContent>
      </Dialog>
    </>
  )
}

export default ServiceItem
