"use server"

import { db } from "../_lib/prisma"

export const getTimeOfWork = async (barberId: string) => {
  return await db.businessHours.findMany({
    where: { barberId },
    select: {
      startTime: true,
      endTime: true,
      dayOfWeek: true,
      lunchEndTime: true,
      lunchStartTime: true,
      isOpen: true,
    },
  })
}
