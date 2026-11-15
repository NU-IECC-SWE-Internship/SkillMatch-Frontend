export function timeToMinutes(value: string) {
  const [hours, minutes] = value.split(":").map(Number);
  return hours * 60 + minutes;
}

export function minutesToTime(totalMinutes: number) {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(
    2,
    "0"
  )}`;
}

export function formatTime(value: string) {
  const [hoursText, minutesText] = value.split(":");
  const hours = Number(hoursText);
  const minutes = Number(minutesText);

  const suffix = hours >= 12 ? "PM" : "AM";
  const displayHours = ((hours + 11) % 12) + 1;

  return `${displayHours}:${String(minutes).padStart(2, "0")} ${suffix}`;
}

export function formatDuration(minutes: number) {
  if (minutes < 60) {
    return `${minutes} minutes`;
  }

  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  if (remainingMinutes === 0) {
    return hours === 1 ? "1 hour" : `${hours} hours`;
  }

  return `${hours}h ${remainingMinutes}m`;
}

export function formatDayLabel(day: string) {
  return day.charAt(0).toUpperCase() + day.slice(1);
}
const DAY_INDEX: Record<string, number> = {
  sunday: 0,
  monday: 1,
  tuesday: 2,
  wednesday: 3,
  thursday: 4,
  friday: 5,
  saturday: 6,
};

/** Next date (from now) on which `day` at `time` ("HH:MM") hasn't passed yet. */
export function getNextSessionDate(day: string, time: string) {
  const targetDay = DAY_INDEX[day.toLowerCase()];
  if (targetDay === undefined) return null;

  const now = new Date();
  const [hours, minutes] = time.split(":").map(Number);

  const candidate = new Date(now);
  candidate.setDate(now.getDate() + ((targetDay - now.getDay() + 7) % 7));
  candidate.setHours(hours, minutes, 0, 0);

  if (candidate <= now) {
    candidate.setDate(candidate.getDate() + 7);
  }

  return candidate;
}

/** "Monday, Nov 16" — the weekday plus the date of its next occurrence. */
export function formatSessionDay(day: string, time: string) {
  const date = getNextSessionDate(day, time);
  if (!date) return formatDayLabel(day);

  return date.toLocaleDateString(undefined, {
    weekday: "long",
    month: "short",
    day: "numeric",
  });
}
