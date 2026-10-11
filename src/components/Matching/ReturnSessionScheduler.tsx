import { useEffect, useMemo, useState } from "react";
import {
  getUserSessionSettings,
  type UserSessionSettings,
} from "../../api/matchingApi";
import { getErrorMessage } from "../../lib/api";
import {
  formatDayLabel,
  formatDuration,
  formatTime,
  minutesToTime,
  timeToMinutes,
} from "./schedulingUtils";

export interface ReturnScheduleSelection {
  slotId: number;
  startTime: string;
  endTime: string;
}

interface ReturnSessionSchedulerProps {
  userId: number;
  username: string;
  isProcessing: boolean;
  onChange: (selection: ReturnScheduleSelection | null) => void;
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

function getCandidateDateTime(day: string, time: string) {
  const now = new Date();
  const targetDay = DAY_INDEX[day.toLowerCase()];

  const [hours, minutes] = time
    .split(":")
    .map(Number);

  const daysAhead =
    (targetDay - now.getDay() + 7) % 7;

  const candidate = new Date(now);

  candidate.setDate(
    now.getDate() + daysAhead
  );

  candidate.setHours(
    hours,
    minutes,
    0,
    0
  );

  if (candidate <= now) {
    candidate.setDate(
      candidate.getDate() + 7
    );
  }

  return candidate;
}

export default function ReturnSessionScheduler({
  userId,
  username,
  isProcessing,
  onChange,
}: ReturnSessionSchedulerProps) {
  const [sessionSettings, setSessionSettings] =
    useState<UserSessionSettings | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [selectedSlot, setSelectedSlot] =
    useState<number | null>(null);

  const [selectedStartTime, setSelectedStartTime] =
    useState("");

  const [selectedDuration, setSelectedDuration] =
    useState<number | null>(null);

  useEffect(() => {
    let active = true;

    const loadSchedule = async () => {
      try {
        setLoading(true);
        setError("");

        const data =
          await getUserSessionSettings(userId);

        if (active) {
          setSessionSettings(data);
        }
      } catch (err) {
        if (active) {
          setSessionSettings(null);
          setError(getErrorMessage(err));
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    loadSchedule();

    return () => {
      active = false;
    };
  }, [userId]);

  const availableSlots =
    sessionSettings?.availability ?? [];

  const busyIntervals =
    sessionSettings?.busy_intervals ?? [];

  const selectedSlotObject = useMemo(() => {
    return (
      availableSlots.find(
        (slot) =>
          slot.id === selectedSlot
      ) ?? null
    );
  }, [
    availableSlots,
    selectedSlot,
  ]);

  const overlapsBusyInterval = (
    day: string,
    startTime: string,
    duration: number
  ) => {
    const start =
      getCandidateDateTime(
        day,
        startTime
      );

    const end = new Date(
      start.getTime() +
        duration * 60 * 1000
    );

    return busyIntervals.some(
      (busy) => {
        const busyStart = new Date(
          busy.start_time
        );

        const busyEnd = new Date(
          busy.end_time
        );

        return (
          start < busyEnd &&
          end > busyStart
        );
      }
    );
  };

  const startTimeOptions = useMemo(() => {
    if (!selectedSlotObject) {
      return [];
    }

    const slotStart =
      timeToMinutes(
        selectedSlotObject.start_time
      );

    const slotEnd =
      timeToMinutes(
        selectedSlotObject.end_time
      );

    const firstStart =
      Math.ceil(slotStart / 15) * 15;

    const options: string[] = [];

    for (
      let current = firstStart;
      current + 15 <= slotEnd;
      current += 15
    ) {
      const time =
        minutesToTime(current);

      const isBusy =
        overlapsBusyInterval(
          selectedSlotObject.day,
          time,
          15
        );

      if (!isBusy) {
        options.push(time);
      }
    }

    return options;
  }, [
    selectedSlotObject,
    busyIntervals,
  ]);

  const durationOptions = useMemo(() => {
    if (
      !selectedSlotObject ||
      !selectedStartTime ||
      !sessionSettings
    ) {
      return [];
    }

    const start =
      timeToMinutes(
        selectedStartTime
      );

    const slotEnd =
      timeToMinutes(
        selectedSlotObject.end_time
      );

    const remainingMinutes =
      slotEnd - start;

    const maximumDuration =
      Math.min(
        remainingMinutes,
        sessionSettings.max_session_duration_minutes
      );

    const options: number[] = [];

    for (
      let duration = 15;
      duration <= maximumDuration;
      duration += 15
    ) {
      const isBusy =
        overlapsBusyInterval(
          selectedSlotObject.day,
          selectedStartTime,
          duration
        );

      if (!isBusy) {
        options.push(duration);
      }
    }

    return options;
  }, [
    selectedSlotObject,
    selectedStartTime,
    sessionSettings,
    busyIntervals,
  ]);

  const requestedEndTime = useMemo(() => {
    if (
      !selectedStartTime ||
      selectedDuration === null
    ) {
      return null;
    }

    return minutesToTime(
      timeToMinutes(
        selectedStartTime
      ) + selectedDuration
    );
  }, [
    selectedStartTime,
    selectedDuration,
  ]);

  useEffect(() => {
    if (
      selectedSlot !== null &&
      selectedStartTime &&
      selectedDuration !== null &&
      requestedEndTime
    ) {
      onChange({
        slotId: selectedSlot,
        startTime:
          selectedStartTime,
        endTime:
          requestedEndTime,
      });
    } else {
      onChange(null);
    }
  }, [
    selectedSlot,
    selectedStartTime,
    selectedDuration,
    requestedEndTime,
    onChange,
  ]);

  const handleSlotChange = (
    slotId: number
  ) => {
    setSelectedSlot(slotId);
    setSelectedStartTime("");
    setSelectedDuration(null);
  };

  const handleStartTimeChange = (
    time: string
  ) => {
    setSelectedStartTime(time);
    setSelectedDuration(null);
  };

  return (
    <div className="return-scheduler">
      <div className="return-scheduler-header">
        <div>
          <span className="detail-label">
            {username}&apos;s
            availability
          </span>

          <p>
            Choose a time when they
            are available to teach
            you.
          </p>
        </div>

        {sessionSettings && (
          <span className="scheduler-max-duration">
            Max{" "}
            {formatDuration(
              sessionSettings.max_session_duration_minutes
            )}
          </span>
        )}
      </div>

      {loading ? (
        <p className="schedule-message">
          Loading availability...
        </p>
      ) : error ? (
        <p className="schedule-error">
          {error}
        </p>
      ) : availableSlots.length ===
        0 ? (
        <p className="schedule-message">
          {username} has no
          availability added yet.
        </p>
      ) : (
        <>
          <div className="return-scheduler-grid">
            <div className="return-scheduler-field">
              <label>
                Availability
              </label>

              <select
                value={
                  selectedSlot ?? ""
                }
                disabled={isProcessing}
                onChange={(event) =>
                  handleSlotChange(
                    Number(
                      event.target
                        .value
                    )
                  )
                }
              >
                <option value="">
                  Choose availability
                </option>

                {availableSlots.map(
                  (slot) => (
                    <option
                      key={slot.id}
                      value={slot.id}
                    >
                      {formatDayLabel(
                        slot.day
                      )}{" "}
                      ·{" "}
                      {formatTime(
                        slot.start_time
                      )}{" "}
                      –{" "}
                      {formatTime(
                        slot.end_time
                      )}
                    </option>
                  )
                )}
              </select>
            </div>

            <div className="return-scheduler-field">
              <label>
                Start time
              </label>

              <select
                value={
                  selectedStartTime
                }
                disabled={
                  !selectedSlot ||
                  isProcessing
                }
                onChange={(event) =>
                  handleStartTimeChange(
                    event.target
                      .value
                  )
                }
              >
                <option value="">
                  {selectedSlot
                    ? startTimeOptions.length >
                      0
                      ? "Choose start time"
                      : "No available times"
                    : "Select availability first"}
                </option>

                {startTimeOptions.map(
                  (time) => (
                    <option
                      key={time}
                      value={time}
                    >
                      {formatTime(
                        time
                      )}
                    </option>
                  )
                )}
              </select>
            </div>

            <div className="return-scheduler-field">
              <label>
                Duration
              </label>

              <select
                value={
                  selectedDuration ??
                  ""
                }
                disabled={
                  !selectedStartTime ||
                  isProcessing
                }
                onChange={(event) =>
                  setSelectedDuration(
                    Number(
                      event.target
                        .value
                    )
                  )
                }
              >
                <option value="">
                  {selectedStartTime
                    ? durationOptions.length >
                      0
                      ? "Choose duration"
                      : "No duration available"
                    : "Choose start time first"}
                </option>

                {durationOptions.map(
                  (duration) => (
                    <option
                      key={duration}
                      value={duration}
                    >
                      {formatDuration(
                        duration
                      )}
                    </option>
                  )
                )}
              </select>
            </div>
          </div>

          {selectedSlotObject &&
            selectedStartTime &&
            selectedDuration !==
              null &&
            requestedEndTime && (
              <div className="return-session-preview">
                <span>
                  Return session
                </span>

                <strong>
                  {formatDayLabel(
                    selectedSlotObject.day
                  )}{" "}
                  ·{" "}
                  {formatTime(
                    selectedStartTime
                  )}{" "}
                  –{" "}
                  {formatTime(
                    requestedEndTime
                  )}
                </strong>
              </div>
            )}
        </>
      )}
    </div>
  );
}