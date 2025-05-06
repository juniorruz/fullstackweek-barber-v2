"use server"

import { revalidatePath } from "next/cache"
import { db } from "../_lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "../_lib/auth"

interface CreateBookingParams {
  serviceId: string
  date: Date
  barberId: string
}

export const createBooking = async (params: CreateBookingParams) => {
  const user = await getServerSession(authOptions)
  if (!user) {
    throw new Error("Usuário não autenticado")
  }

  await db.booking.create({
    data: {
      date: params.date,
      user: { connect: { id: (user.user as any).id } },
      service: { connect: { id: params.serviceId } },
      barber: { connect: { id: params.barberId } },
    },
  })
  revalidatePath("/barbershops/[id]")
  revalidatePath("/bookings")
}
