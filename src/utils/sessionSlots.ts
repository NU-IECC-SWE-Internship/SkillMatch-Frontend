export interface SessionOption {
  startTime: string
  endTime: string
  durationMinutes: number
  label: string
}


function timeToMinutes(
  value: string
): number {

  const [hours, minutes] =
    value.split(":").map(Number)

  return hours * 60 + minutes
}


function minutesToTime(
  totalMinutes: number
): string {

  const hours =
    Math.floor(totalMinutes / 60)

  const minutes =
    totalMinutes % 60

  return `${String(hours).padStart(
    2,
    "0"
  )}:${String(minutes).padStart(
    2,
    "0"
  )}`
}


function formatClockTime(
  value: string
): string {

  const [hoursString, minutes] =
    value.split(":")

  const hours =
    Number(hoursString)

  const suffix =
    hours >= 12
      ? "PM"
      : "AM"

  const displayHours =
    ((hours + 11) % 12) + 1

  return (
    `${displayHours}:` +
    `${minutes} ${suffix}`
  )
}


function formatDuration(
  minutes: number
): string {

  if (minutes < 60) {
    return `${minutes} min`
  }

  const hours =
    Math.floor(minutes / 60)

  const remainingMinutes =
    minutes % 60

  if (remainingMinutes === 0) {
    return (
      hours === 1
        ? "1 hour"
        : `${hours} hours`
    )
  }

  return (
    `${hours}h ` +
    `${remainingMinutes}m`
  )
}


export function generateSessionOptions(
  slotStart: string,
  slotEnd: string,
  maxDurationMinutes: number,
): SessionOption[] {

  const results: SessionOption[] = []

  const start =
    timeToMinutes(slotStart)

  const end =
    timeToMinutes(slotEnd)


  /*
   * Start every 15 minutes.
   */
  for (
    let currentStart = start;
    currentStart < end;
    currentStart += 15
  ) {

    /*
     * Session durations:
     *
     * 15 min
     * 30 min
     * 45 min
     * 1 hour
     * ...
     *
     * until max duration.
     */
    for (
      let duration = 15;
      duration <= maxDurationMinutes;
      duration += 15
    ) {

      const currentEnd =
        currentStart + duration


      /*
       * Do not allow session
       * outside the owner's availability.
       */
      if (currentEnd > end) {
        break
      }


      const startTime =
        minutesToTime(currentStart)

      const endTime =
        minutesToTime(currentEnd)


      results.push({
        startTime,
        endTime,
        durationMinutes: duration,

        label:
          `${formatClockTime(startTime)}` +
          ` – ` +
          `${formatClockTime(endTime)}` +
          ` (${formatDuration(duration)})`,
      })
    }
  }


  return results
}