"use server"

import { db } from "../_lib/prisma"

export const getServices = async () => {
  return await db.barbershopService.findMany()
}
