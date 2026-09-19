import { useEffect, useState } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import { getUserAvailability, type AvailabilitySlot } from "../api/profileApi";
import { getMatches } from "../api/matchingApi";
import type { Match } from "../types/match";
import "./SendRequest.css";

function SendRequest() {
  const { userId } = useParams();
  const location = useLocation();
  const matchFromState = (location.state as { match?: Match } | null)?.match;

  const [selectedSkill, setSelectedSkill] = useState<string | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<number | null>(null);
  const [match, setMatch] = useState<Match | null>(matchFromState ?? null);
  const [availableSlots, setAvailableSlots] = useState<AvailabilitySlot[]>([]);
  const [loading, setLoading] = useState(!matchFromState);

  useEffect(() => {
    if (matchFromState) {
      setMatch(matchFromState);
      setLoading(false);
      return;
    }

    if (!userId) {
      setLoading(false);
      return;
    }

    let isMounted = true;

    async function loadMatch() {
      try {
        const matches = await getMatches();
        const selectedMatch = matches.find(
          (item) => item.user_id === Number(userId)
        );

        if (isMounted) {
          setMatch(selectedMatch ?? null);
          setLoading(false);
        }
      } catch (error) {
        console.error("Failed to load match details:", error);
        if (isMounted) {
          setMatch(null);
          setLoading(false);
        }
      }
    }

    loadMatch();

    return () => {
      isMounted = false;
    };
  }, [matchFromState, userId]);

  useEffect(() => {
    if (match === null) {
      setAvailableSlots([]);
      return;
    }

    const currentMatch = match;
    let isMounted = true;

    async function loadAvailability() {
      try {
        const slots = await getUserAvailability(currentMatch.user_id);
        if (isMounted) {
          setAvailableSlots(slots);
        }
      } catch (error) {
        console.error("Failed to load user availability:", error);
        if (isMounted) {
          setAvailableSlots([]);
        }
      }
    }

    loadAvailability();

    return () => {
      isMounted = false;
    };
  }, [match]);

  const formatDayLabel = (day: string) =>
    day.charAt(0).toUpperCase() + day.slice(1);

  const formatTimeRange = (slot: AvailabilitySlot) => {
    const formatTime = (value: string) => {
      const [hours, minutes] = value.split(":");
      const parsedHours = Number(hours);
      const suffix = parsedHours >= 12 ? "PM" : "AM";
      const normalizedHours = ((parsedHours + 11) % 12) + 1;
      return `${normalizedHours}:${minutes} ${suffix}`;
    };

    return `${formatTime(slot.start_time)} – ${formatTime(slot.end_time)}`;
  };

  const handleSendRequest = () => {
    if (!match) {
      alert("Unable to load the selected user details.");
      return;
    }

    if (selectedSkill === null) {
      alert("Please select a skill you want to learn.");
      return;
    }

    if (selectedSlot === null) {
      alert("Please select a convenient meeting time slot.");
      return;
    }

    console.log("Sending request to user:", match.user_id);
    console.log("Skill:", selectedSkill);
    console.log("Selected slot:", selectedSlot);

    alert("Match request sent successfully!");
  };

  if (loading) {
    return (
      <main className="send-request-page">
        <div className="send-request-panel">
          <Link to="/matches" className="send-request-back-btn">
            &larr; Back to Matches
          </Link>
          <div className="empty-state">
            <h2>Loading match details...</h2>
          </div>
        </div>
      </main>
    );
  }

  if (!match) {
    return (
      <main className="send-request-page">
        <div className="send-request-panel">
          <Link to="/matches" className="send-request-back-btn">
            &larr; Back to Matches
          </Link>
          <div className="empty-state">
            <h2>Match not found</h2>
            <p>We could not load this user’s profile details.</p>
          </div>
        </div>
      </main>
    );
  }

  const initial = match.username ? match.username.charAt(0).toUpperCase() : "?";

  return (
    <main className="send-request-page">
      <div className="send-request-panel">
        <div className="send-request-nav">
          <Link to="/matches" className="send-request-back-btn">
            &larr; Back to Matches
          </Link>
          <span className="send-request-brand">SkillMatch</span>
        </div>

        {/* Partner Header */}
        <header className="send-request-header">
          <div className="partner-profile-lockup">
            <div className="partner-avatar">{initial}</div>
            <div>
              <span className="step-tag">PROPOSE A SESSION</span>
              <h1 className="request-title">Skill Swap with {match.username}</h1>
            </div>
          </div>
        </header>

        {/* Swap Overview / Exchange Map */}
        <section className="swap-overview-section">
          <div className="swap-grid">
            {/* Learn column */}
            <div className="swap-box learn-box">
              <div className="swap-box-header">
                <span className="swap-direction-icon">📥</span>
                <div>
                  <span className="swap-box-title">Step 1: Select Skill to Learn</span>
                  <span className="swap-box-subtitle">What {match.username} will teach you</span>
                </div>
              </div>

              <div className="skill-selector-list">
                {match.teach_me.map((skill) => (
                  <button
                    type="button"
                    key={skill}
                    className={`skill-choice-pill ${
                      selectedSkill === skill ? "selected" : ""
                    }`}
                    onClick={() => setSelectedSkill(skill)}
                  >
                    <span className="radio-indicator"></span>
                    <span className="skill-text">{skill}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="swap-divider">
              <span>⇄</span>
            </div>

            {/* Teach column */}
            <div className="swap-box teach-box">
              <div className="swap-box-header">
                <span className="swap-direction-icon">📤</span>
                <div>
                  <span className="swap-box-title">Skills You Offer</span>
                  <span className="swap-box-subtitle">What you can teach {match.username}</span>
                </div>
              </div>

              <div className="skills-badge-list">
                {match.teach_them.map((skill) => (
                  <span className="skill-pill pill-teach" key={skill}>
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Time Slot Picker */}
        <section className="availability-section">
          <div className="section-title-group">
            <span className="section-step-num">Step 2</span>
            <h3>Choose a Time Slot</h3>
          </div>
          <p className="section-subtext">
            Times are based on {match.username}&apos;s weekly schedule.
          </p>

          <div className="slot-list">
            {availableSlots.length === 0 ? (
              <div className="empty-availability">
                <p>No available slots shared yet by {match.username}.</p>
              </div>
            ) : (
              availableSlots.map((slot) => (
                <button
                  type="button"
                  key={slot.id}
                  className={`slot-card ${
                    selectedSlot === slot.id ? "selected" : ""
                  }`}
                  onClick={() => setSelectedSlot(slot.id)}
                >
                  <span className="slot-day">{formatDayLabel(slot.day)}</span>
                  <span className="slot-time">{formatTimeRange(slot)}</span>
                </button>
              ))
            )}
          </div>
        </section>

        {/* Submit Actions */}
        <div className="send-request-footer">
          <button
            type="button"
            className="send-request-button"
            disabled={!selectedSkill || !selectedSlot}
            onClick={handleSendRequest}
          >
            Confirm &amp; Send Request &rarr;
          </button>
        </div>
      </div>
    </main>
  );
}

export default SendRequest;