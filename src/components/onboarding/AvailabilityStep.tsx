import { useState } from "react";
import type { FormEvent } from "react";

import {
  addAvailability,
  updateMaxSessionDuration,
} from "../../api/profileApi";

interface Props {
  onFinish: () => Promise<void>;
}

export default function AvailabilityStep({ onFinish }: Props) {
  const [maxDuration, setMaxDuration] = useState(120);

  const [day, setDay] = useState("monday");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!startTime || !endTime) {
      setError("Please choose start and end time.");
      return;
    }

    if (startTime >= endTime) {
      setError("End time must be after start time.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      await updateMaxSessionDuration(maxDuration);

      await addAvailability(
        day,
        startTime,
        endTime
      );

      await onFinish();
    } catch {
      setError("Could not finish onboarding.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <h1>When are you available?</h1>

      <p>
        Add a time when you are usually available for SkillMatch sessions.
      </p>

      <form onSubmit={handleSubmit}>

        <div className="availability-field">
          <label>Maximum session duration</label>

          <select
            value={maxDuration}
            onChange={(event) =>
              setMaxDuration(Number(event.target.value))
            }
          >
            <option value={30}>30 minutes</option>
            <option value={60}>1 hour</option>
            <option value={90}>1.5 hours</option>
            <option value={120}>2 hours</option>
          </select>

          <small>
            Sessions can be shorter, but cannot exceed this time.
          </small>
        </div>

        <div className="availability-field">
          <label>Day</label>

          <select
            value={day}
            onChange={(event) =>
              setDay(event.target.value)
            }
          >
            <option value="monday">Monday</option>
            <option value="tuesday">Tuesday</option>
            <option value="wednesday">Wednesday</option>
            <option value="thursday">Thursday</option>
            <option value="friday">Friday</option>
            <option value="saturday">Saturday</option>
            <option value="sunday">Sunday</option>
          </select>
        </div>

        <div className="time-row">

          <div className="availability-field">
            <label>Start time</label>

            <input
              type="time"
              value={startTime}
              onChange={(event) =>
                setStartTime(event.target.value)
              }
            />
          </div>

          <div className="availability-field">
            <label>End time</label>

            <input
              type="time"
              value={endTime}
              onChange={(event) =>
                setEndTime(event.target.value)
              }
            />
          </div>

        </div>

        {error && (
          <p className="form-error">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
        >
          {loading ? "Saving..." : "Finish"}
        </button>

      </form>
    </div>
  );
}