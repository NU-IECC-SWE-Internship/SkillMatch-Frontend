import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import { getUserAvailability, type AvailabilitySlot } from "../api/profileApi";
import {  getMatches,  getSkillsList,  createMatchRequest } from "../api/matchingApi";
import { getErrorMessage } from "../lib/api";
import type { Match, SkillItem } from "../types/match";
import "./SendRequest.css";

function SendRequest() {
  const { userId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const matchFromState = (location.state as { match?: Match } | null)?.match;

  const [selectedSkill, setSelectedSkill] = useState<string | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<number | null>(null);
  const [match, setMatch] = useState<Match | null>(matchFromState ?? null);
  const [availableSlots, setAvailableSlots] = useState<AvailabilitySlot[]>([]);
  const [skillsCatalog, setSkillsCatalog] = useState<SkillItem[]>([]);

  const [loading, setLoading] = useState(!matchFromState);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // 1. Fetch match and skills list concurrently
  useEffect(() => {
    let isMounted = true;

    async function initialize() {
      try {
        const [skillsData, matchesData] = await Promise.all([
          getSkillsList(),
          matchFromState ? Promise.resolve([]) : getMatches(),
        ]);

        if (!isMounted) return;

        setSkillsCatalog(skillsData);

        if (!matchFromState && userId) {
          const selectedMatch = matchesData.find(
            (item) => item.user_id === Number(userId)
          );
          setMatch(selectedMatch ?? null);
        }
      } catch (error) {
        console.error("Failed to load initial data:", error);
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
  }, [matchFromState, userId]);

  // 2. Fetch partner's availability slots
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

  // 3. Connect to Django backend API
  const handleSendRequest = async () => {
    setErrorMessage(null);

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

    // Match selected string to skill database ID
    const skillObj = skillsCatalog.find(
      (s) => s.name.trim().toLowerCase() === selectedSkill.trim().toLowerCase()
    );

    if (!skillObj) {
      alert(`Skill "${selectedSkill}" could not be found in the database.`);
      return;
    }

    try {
      setSubmitting(true);

      await createMatchRequest({
        receiver: match.user_id,
        skill: skillObj.id,
        selected_slot: selectedSlot,
      });

      alert("Match request sent successfully!");
      navigate("/matches");
    } catch (error) {
      const message = getErrorMessage(error);
      setErrorMessage(message);
      alert(message);
    } finally {
      setSubmitting(false);
    }
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

        {errorMessage && (
          <div className="error-banner" role="alert" style={{ marginBottom: "20px" }}>
            ⚠️ {errorMessage}
          </div>
        )}

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
            disabled={!selectedSkill || !selectedSlot || submitting}
            onClick={handleSendRequest}
          >
            {submitting ? "Sending..." : "Confirm & Send Request →"}
          </button>
        </div>
      </div>
    </main>
  );
}

export default SendRequest;