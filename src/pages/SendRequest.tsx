import { useEffect, useMemo, useState } from "react";
import {
  Link,
  useLocation,
  useNavigate,
  useParams,
} from "react-router-dom";

import {
  getMatches,
  getSkillsList,
  createMatchRequest,
  getUserSessionSettings,
} from "../api/matchingApi";

import type {
  UserSessionSettings,
} from "../api/matchingApi";

import { getErrorMessage } from "../lib/api";

import type {
  Match,
  SkillItem,
} from "../types/match";

import VerifiedBadge from "../components/VerifiedBadge";

import "./SendRequest.css";


function timeToMinutes(value: string) {
  const [hours, minutes] =
    value.split(":").map(Number);

  return hours * 60 + minutes;
}


function minutesToTime(totalMinutes: number) {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  return `${String(hours).padStart(2, "0")}:${String(
    minutes
  ).padStart(2, "0")}`;
}


function formatTime(value: string) {
  const [hoursText, minutesText] =
    value.split(":");

  const hours = Number(hoursText);
  const minutes = Number(minutesText);

  const suffix =
    hours >= 12 ? "PM" : "AM";

  const displayHours =
    ((hours + 11) % 12) + 1;

  return `${displayHours}:${String(minutes).padStart(
    2,
    "0"
  )} ${suffix}`;
}


function formatDuration(minutes: number) {
  if (minutes < 60) {
    return `${minutes} minutes`;
  }

  const hours =
    Math.floor(minutes / 60);

  const remainingMinutes =
    minutes % 60;

  if (remainingMinutes === 0) {
    return hours === 1
      ? "1 hour"
      : `${hours} hours`;
  }

  return `${hours}h ${remainingMinutes}m`;
}


function formatDayLabel(day: string) {
  return (
    day.charAt(0).toUpperCase() +
    day.slice(1)
  );
}


function SendRequest() {
  const { userId } = useParams();

  const navigate =
    useNavigate();

  const location =
    useLocation();

  const matchFromState =
    (
      location.state as {
        match?: Match;
      } | null
    )?.match;


  // ---------------- MATCH ----------------

  const [match, setMatch] =
    useState<Match | null>(
      matchFromState ?? null
    );

  const [
    skillsCatalog,
    setSkillsCatalog,
  ] = useState<SkillItem[]>([]);


  // ---------------- SESSION SETTINGS ----------------

  const [
    sessionSettings,
    setSessionSettings,
  ] =
    useState<UserSessionSettings | null>(
      null
    );


  // ---------------- SELECTION ----------------

  const [
    selectedSkill,
    setSelectedSkill,
  ] =
    useState<string | null>(null);

  const [
    selectedSlot,
    setSelectedSlot,
  ] =
    useState<number | null>(null);

  const [
    selectedStartTime,
    setSelectedStartTime,
  ] =
    useState<string>("");

  const [
    selectedDuration,
    setSelectedDuration,
  ] =
    useState<number | null>(null);


  // ---------------- PAGE STATE ----------------

  const [loading, setLoading] =
    useState(!matchFromState);

  const [
    submitting,
    setSubmitting,
  ] = useState(false);

  const [
    errorMessage,
    setErrorMessage,
  ] =
    useState<string | null>(null);


  // ---------------- LOAD MATCH ----------------

  useEffect(() => {
    let isMounted = true;

    async function initialize() {
      try {
        const [
          skillsData,
          matchesData,
        ] = await Promise.all([
          getSkillsList(),

          matchFromState
            ? Promise.resolve([])
            : getMatches(),
        ]);

        if (!isMounted) {
          return;
        }

        setSkillsCatalog(
          skillsData
        );

        if (
          !matchFromState &&
          userId
        ) {
          const selectedMatch =
            matchesData.find(
              (item) =>
                item.user_id ===
                Number(userId)
            );

          setMatch(
            selectedMatch ?? null
          );
        }

      } catch (error) {
        console.error(
          "Failed to load initial data:",
          error
        );

        setErrorMessage(
          getErrorMessage(error)
        );

      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    initialize();

    return () => {
      isMounted = false;
    };

  }, [
    matchFromState,
    userId,
  ]);


  // ---------------- LOAD AVAILABILITY ----------------

  useEffect(() => {
    if (!match) {
      setSessionSettings(null);
      return;
    }

    let isMounted = true;

    async function loadSettings() {
      try {
        const data =
          await getUserSessionSettings(
            match!.user_id
          );

        if (isMounted) {
          setSessionSettings(data);
        }

      } catch (error) {
        console.error(
          "Failed to load session settings:",
          error
        );

        if (isMounted) {
          setSessionSettings(null);
        }
      }
    }

    loadSettings();

    return () => {
      isMounted = false;
    };

  }, [match]);


  // ---------------- AVAILABLE SLOTS ----------------

  const availableSlots =
    sessionSettings?.availability ?? [];


  const selectedSlotObject =
    useMemo(() => {

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


  // ---------------- START TIME OPTIONS ----------------

  const startTimeOptions =
    useMemo(() => {

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

      // If availability starts at 2:22,
      // first session time becomes 2:30.
      const firstStart =
        Math.ceil(
          slotStart / 15
        ) * 15;

      const options: string[] =
        [];

      for (
        let current =
          firstStart;

        current + 15 <= slotEnd;

        current += 15
      ) {
        options.push(
          minutesToTime(current)
        );
      }

      return options;

    }, [selectedSlotObject]);


  // ---------------- DURATION OPTIONS ----------------

  const durationOptions =
    useMemo(() => {

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
          sessionSettings
            .max_session_duration_minutes
        );

      const options: number[] =
        [];

      for (
        let duration = 15;
        duration <= maximumDuration;
        duration += 15
      ) {
        options.push(duration);
      }

      return options;

    }, [
      selectedSlotObject,
      selectedStartTime,
      sessionSettings,
    ]);


  // ---------------- END TIME ----------------

  const requestedEndTime =
    useMemo(() => {

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


  // ---------------- HANDLERS ----------------

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


  // ---------------- SEND ----------------

  const handleSendRequest =
    async () => {

      setErrorMessage(null);

      if (!match) {
        return;
      }

      if (!selectedSkill) {
        alert(
          "Please select a skill."
        );
        return;
      }

      if (!selectedSlot) {
        alert(
          "Please choose availability."
        );
        return;
      }

      if (!selectedStartTime) {
        alert(
          "Please choose a start time."
        );
        return;
      }

      if (
        selectedDuration === null
      ) {
        alert(
          "Please choose a duration."
        );
        return;
      }

      if (!requestedEndTime) {
        return;
      }

      const skillObj =
        skillsCatalog.find(
          (skill) =>
            skill.name
              .trim()
              .toLowerCase() ===
            selectedSkill
              .trim()
              .toLowerCase()
        );

      if (!skillObj) {
        alert(
          "The selected skill could not be found."
        );
        return;
      }

      try {
        setSubmitting(true);

        await createMatchRequest({
          receiver:
            match.user_id,

          skill:
            skillObj.id,

          selected_slot:
            selectedSlot,

          requested_start_time:
            selectedStartTime,

          requested_end_time:
            requestedEndTime,
        });

        alert(
          "Match request sent successfully!"
        );

        navigate("/matches");

      } catch (error) {

        const message =
          getErrorMessage(error);

        setErrorMessage(message);

      } finally {
        setSubmitting(false);
      }
    };


  // ---------------- LOADING ----------------

  if (loading) {
    return (
      <main className="send-request-page">

        <div className="send-request-panel">

          <div className="loading-card">
            Loading session details...
          </div>

        </div>

      </main>
    );
  }


  if (!match) {
    return (
      <main className="send-request-page">

        <div className="send-request-panel">

          <Link
            to="/matches"
            className="send-request-back-btn"
          >
            ← Back to Matches
          </Link>

          <div className="loading-card">

            <h2>
              Match not found
            </h2>

            <p>
              This profile could not
              be loaded.
            </p>

          </div>

        </div>

      </main>
    );
  }


  const initial =
    match.username
      ? match.username
          .charAt(0)
          .toUpperCase()
      : "?";


  return (
    <main className="send-request-page">

      <div className="send-request-panel">


        {/* NAV */}

        <div className="send-request-nav">

          <Link
            to="/matches"
            className="send-request-back-btn"
          >
            ← Back to Matches
          </Link>

          <span className="send-request-brand">
            SkillMatch
          </span>

        </div>


        {/* HEADER */}

        <header className="send-request-header">

          <div className="partner-avatar">
            {initial}
          </div>

          <div>

            <span className="header-eyebrow">
              SESSION REQUEST
            </span>

            <h1>
              Learn with{" "}
              {match.username}
            </h1>

            <p>
              Select a skill and build
              a session that works for
              both of you.
            </p>

          </div>

        </header>


        {errorMessage && (
          <div className="error-banner">
            {errorMessage}
          </div>
        )}


        {/* SKILL AREA */}

        <section className="request-section">

          <div className="section-heading">

            <span className="step-number">
              01
            </span>

            <div>

              <h2>
                Choose your skill
              </h2>

              <p>
                What would you like{" "}
                {match.username} to
                teach you?
              </p>

            </div>

          </div>


          <div className="skill-exchange-grid">

            <div className="learn-card">

              <span className="mini-label">
                YOU WANT TO LEARN
              </span>

              <div className="skill-selector-list">

                {match.teach_me.map(
                  (skill) => (

                    <button
                      type="button"
                      key={skill.name}
                      className={
                        selectedSkill ===
                        skill.name
                          ? "skill-choice selected"
                          : "skill-choice"
                      }
                      onClick={() =>
                        setSelectedSkill(
                          skill.name
                        )
                      }
                    >

                      <span
                        className="skill-radio"
                      />

                      <span className="skill-choice-label">
                        {skill.name}
                        <VerifiedBadge
                          verified={skill.is_verified}
                          compact
                        />
                      </span>

                    </button>

                  )
                )}

              </div>

            </div>


            <div className="swap-arrow">
              ⇄
            </div>


            <div className="teach-card">

              <span className="mini-label">
                YOU CAN TEACH
              </span>

              <div className="offer-skills">

                {match.teach_them.map(
                  (skill) => (

                    <span
                      key={skill.name}
                      className={
                        skill.is_verified
                          ? "offer-skill is-verified"
                          : "offer-skill"
                      }
                    >
                      {skill.name}
                      <VerifiedBadge
                        verified={skill.is_verified}
                        compact
                      />
                    </span>

                  )
                )}

              </div>

            </div>

          </div>

        </section>


        {/* SESSION PLANNER */}

        <section className="request-section">

          <div className="section-heading">

            <span className="step-number">
              02
            </span>

            <div>

              <h2>
                Plan your session
              </h2>

              <p>
                Select an available
                period, start time and
                duration.
              </p>

            </div>

          </div>


          <div className="schedule-card">

            <div className="schedule-card-top">

              <div>

                <span className="schedule-icon">
                  ◷
                </span>

                <div>

                  <strong>
                    {match.username}
                    &apos;s schedule
                  </strong>

                  <p>
                    Choose any session
                    inside their
                    available time.
                  </p>

                </div>

              </div>


              {sessionSettings && (

                <span className="max-duration-badge">

                  Max{" "}

                  {formatDuration(
                    sessionSettings
                      .max_session_duration_minutes
                  )}

                </span>

              )}

            </div>


            <div className="scheduler-grid">


              {/* AVAILABILITY */}

              <div className="scheduler-field">

                <label>
                  <span className="field-number">
                    1
                  </span>

                  Availability
                </label>


                <div className="select-wrapper">

                  <select
                    value={
                      selectedSlot ?? ""
                    }
                    onChange={(e) =>
                      handleSlotChange(
                        Number(
                          e.target.value
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
                          )}

                          {" · "}

                          {formatTime(
                            slot.start_time
                          )}

                          {" – "}

                          {formatTime(
                            slot.end_time
                          )}

                        </option>

                      )
                    )}

                  </select>

                  <span className="select-arrow">
                    ▾
                  </span>

                </div>

              </div>


              {/* START TIME */}

              <div className="scheduler-field">

                <label>
                  <span className="field-number">
                    2
                  </span>

                  Start time
                </label>


                <div className="select-wrapper">

                  <select
                    value={
                      selectedStartTime
                    }
                    disabled={
                      !selectedSlot
                    }
                    onChange={(e) =>
                      handleStartTimeChange(
                        e.target.value
                      )
                    }
                  >

                    <option value="">
                      {selectedSlot
                        ? "Choose start time"
                        : "Select availability first"}
                    </option>


                    {startTimeOptions.map(
                      (time) => (

                        <option
                          key={time}
                          value={time}
                        >
                          {formatTime(time)}
                        </option>

                      )
                    )}

                  </select>

                  <span className="select-arrow">
                    ▾
                  </span>

                </div>

                {selectedSlot && (
                  <span className="field-hint">
                    Every 15 minutes
                  </span>
                )}

              </div>


              {/* DURATION */}

              <div className="scheduler-field">

                <label>
                  <span className="field-number">
                    3
                  </span>

                  Duration
                </label>


                <div className="select-wrapper">

                  <select
                    value={
                      selectedDuration ??
                      ""
                    }
                    disabled={
                      !selectedStartTime
                    }
                    onChange={(e) =>
                      setSelectedDuration(
                        Number(
                          e.target.value
                        )
                      )
                    }
                  >

                    <option value="">
                      {selectedStartTime
                        ? "Choose duration"
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

                  <span className="select-arrow">
                    ▾
                  </span>

                </div>

              </div>

            </div>


            {/* SESSION PREVIEW */}

            {selectedSlotObject &&
              selectedStartTime &&
              selectedDuration &&
              requestedEndTime && (

                <div className="session-preview">

                  <div className="preview-icon">
                    ✓
                  </div>


                  <div className="preview-content">

                    <span>
                      YOUR PROPOSED SESSION
                    </span>

                    <strong>

                      {formatDayLabel(
                        selectedSlotObject.day
                      )}

                      {" · "}

                      {formatTime(
                        selectedStartTime
                      )}

                      {" – "}

                      {formatTime(
                        requestedEndTime
                      )}

                    </strong>

                  </div>


                  <div className="preview-duration">

                    {formatDuration(
                      selectedDuration
                    )}

                  </div>

                </div>

              )}

          </div>

        </section>


        {/* FOOTER */}

        <div className="send-request-footer">

          <div className="footer-help">

            {!selectedSkill
              ? "Choose a skill to continue"
              : !selectedSlot
              ? "Choose an available period"
              : !selectedStartTime
              ? "Choose your start time"
              : selectedDuration === null
              ? "Choose a session duration"
              : "Everything looks good!"}

          </div>


          <button
            type="button"
            className="send-request-button"
            disabled={
              !selectedSkill ||
              !selectedSlot ||
              !selectedStartTime ||
              selectedDuration ===
                null ||
              submitting
            }
            onClick={
              handleSendRequest
            }
          >

            {submitting
              ? "Sending..."
              : "Send Request →"}

          </button>

        </div>

      </div>

    </main>
  );
}


export default SendRequest;