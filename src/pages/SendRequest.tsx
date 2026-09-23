import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";

import {
  getMySkills,
  type AvailabilitySlot,
} from "../api/profileApi";

import {
  createMatchRequest,
  getMatches,
  getSkillsList,
  getUserSessionSettings,
  type UserSessionSettings,
} from "../api/matchingApi";

import { getErrorMessage } from "../lib/api";
import StatusModal from "../components/ui/StatusModal";

import type {
  Match,
  SkillItem,
  Teacher,
} from "../types/match";

import "./SendRequest.css";

interface MySkill {
  id: number;
  skill: number;
  skill_name: string;
  skill_type: "teach" | "learn";
}

function timeToMinutes(value: string) {
  const [hours, minutes] = value.split(":").map(Number);
  return hours * 60 + minutes;
}

function minutesToTime(totalMinutes: number) {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}

function formatTime(value: string) {
  const [hoursText, minutesText] = value.split(":");
  const hours = Number(hoursText);
  const minutes = Number(minutesText);
  const suffix = hours >= 12 ? "PM" : "AM";
  const displayHours = ((hours + 11) % 12) + 1;
  return `${displayHours}:${String(minutes).padStart(2, "0")} ${suffix}`;
}

function formatDuration(minutes: number) {
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

function formatDayLabel(day: string) {
  return day.charAt(0).toUpperCase() + day.slice(1);
}

function SendRequest() {
  const { userId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const navigationState = location.state as {
    match?: Match;
    teacher?: Teacher;
  } | null;

  const matchFromState = navigationState?.match;
  const teacherFromState = navigationState?.teacher;

  const [match, setMatch] = useState<Match | null>(matchFromState ?? null);
  const [teacher, setTeacher] = useState<Teacher | null>(teacherFromState ?? null);

  const [skillsCatalog, setSkillsCatalog] = useState<SkillItem[]>([]);
  const [sessionSettings, setSessionSettings] = useState<UserSessionSettings | null>(null);

  const [selectedSkill, setSelectedSkill] = useState<string | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<number | null>(null);
  const [selectedStartTime, setSelectedStartTime] = useState<string>("");
  const [selectedDuration, setSelectedDuration] = useState<number | null>(null);

  const [mySkills, setMySkills] = useState<MySkill[]>([]);
  const [partnerWantsToLearn, setPartnerWantsToLearn] = useState<string[]>([]);

  const [loading, setLoading] = useState(!matchFromState && !teacherFromState);
  const [submitting, setSubmitting] = useState(false);

  const [statusModal, setStatusModal] = useState<{
    title: string;
    message: string;
    type: "success" | "error";
  } | null>(null);

  /*
   * Initialize profile, catalog, and matching context
   */
  useEffect(() => {
    let isMounted = true;

    async function initialize() {
      try {
        if (teacherFromState && isMounted) {
          setTeacher(teacherFromState);
        } else if (matchFromState && isMounted) {
          setMatch(matchFromState);
          setPartnerWantsToLearn(matchFromState.teach_them ?? []);
        }

        const resolvedId =
          teacherFromState?.user_id ??
          matchFromState?.user_id ??
          (userId ? Number(userId) : null);

        const [skillsData, matchesData] = await Promise.all([
          getSkillsList(),
          resolvedId ? getMatches() : Promise.resolve([]),
        ]);

        if (!isMounted) return;

        setSkillsCatalog(skillsData);

        if (resolvedId) {
          const matchedUser = matchesData.find(
            (item) => item.user_id === resolvedId
          );

          if (matchedUser) {
            setMatch(matchedUser);
            setPartnerWantsToLearn(matchedUser.teach_them ?? []);
          }
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
  }, [matchFromState, teacherFromState, userId]);

  /*
   * Load current user's skills
   */
  useEffect(() => {
    let isMounted = true;

    async function loadMySkills() {
      try {
        const data = await getMySkills();
        if (isMounted) {
          setMySkills(data);
        }
      } catch (error) {
        console.error("Failed to load my skills:", error);
        if (isMounted) {
          setMySkills([]);
        }
      }
    }

    loadMySkills();

    return () => {
      isMounted = false;
    };
  }, []);

  const partnerId = teacher?.user_id ?? match?.user_id ?? (userId ? Number(userId) : null);
  const partnerUsername = teacher?.username ?? match?.username ?? "";
  const targetPath = teacherFromState ? "/skillbrowse" : "/matches";

  /*
   * Load partner session settings and availability
   */
  useEffect(() => {
    if (!partnerId) {
      setSessionSettings(null);
      return;
    }

    let isMounted = true;

    async function loadSettings() {
      try {
        const data = await getUserSessionSettings(partnerId!);
        if (isMounted) {
          setSessionSettings(data);
        }
      } catch (error) {
        console.error("Failed to load session settings:", error);
        if (isMounted) {
          setSessionSettings(null);
        }
      }
    }

    loadSettings();

    return () => {
      isMounted = false;
    };
  }, [partnerId]);

  const availableSlots: AvailabilitySlot[] = sessionSettings?.availability ?? [];

  const skillsToLearn =
    teacher?.skills.map((skill) => ({
      id: skill.id,
      name: skill.name,
    })) ??
    (match
      ? match.teach_me.map((skill, index) => ({
          id: match.teach_me_ids?.[index] ?? index + 1,
          name: skill,
        }))
      : []) ??
    [];

  const skillsYouOffer = mySkills.filter((skill) => skill.skill_type === "teach");

  const matchingSkillNames = new Set<string>(
    partnerWantsToLearn.map((s) => s.toLowerCase().trim())
  );

  const selectedSlotObject = useMemo(() => {
    return availableSlots.find((slot) => slot.id === selectedSlot) ?? null;
  }, [availableSlots, selectedSlot]);

  const startTimeOptions = useMemo(() => {
    if (!selectedSlotObject) {
      return [];
    }

    const slotStart = timeToMinutes(selectedSlotObject.start_time);
    const slotEnd = timeToMinutes(selectedSlotObject.end_time);

    const firstStart = Math.ceil(slotStart / 15) * 15;
    const options: string[] = [];

    for (let current = firstStart; current + 15 <= slotEnd; current += 15) {
      options.push(minutesToTime(current));
    }

    return options;
  }, [selectedSlotObject]);

  const durationOptions = useMemo(() => {
    if (!selectedSlotObject || !selectedStartTime || !sessionSettings) {
      return [];
    }

    const start = timeToMinutes(selectedStartTime);
    const slotEnd = timeToMinutes(selectedSlotObject.end_time);
    const remainingMinutes = slotEnd - start;

    const maximumDuration = Math.min(
      remainingMinutes,
      sessionSettings.max_session_duration_minutes
    );

    const options: number[] = [];
    for (let duration = 15; duration <= maximumDuration; duration += 15) {
      options.push(duration);
    }

    return options;
  }, [selectedSlotObject, selectedStartTime, sessionSettings]);

  const requestedEndTime = useMemo(() => {
    if (!selectedStartTime || selectedDuration === null) {
      return null;
    }
    return minutesToTime(timeToMinutes(selectedStartTime) + selectedDuration);
  }, [selectedStartTime, selectedDuration]);

  const handleSlotChange = (slotId: number) => {
    setSelectedSlot(slotId);
    setSelectedStartTime("");
    setSelectedDuration(null);
  };

  const handleStartTimeChange = (time: string) => {
    setSelectedStartTime(time);
    setSelectedDuration(null);
  };

  const handleBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
      return;
    }
    navigate(targetPath);
  };

  const handleSendRequest = async () => {
    setStatusModal(null);

    if (!partnerId) {
      setStatusModal({
        title: "Unable to send request",
        message: "Unable to load the selected user's details.",
        type: "error",
      });
      return;
    }

    if (!selectedSkill) {
      setStatusModal({
        title: "Choose a skill",
        message: "Please select a skill you want to learn.",
        type: "error",
      });
      return;
    }

    if (!selectedSlot) {
      setStatusModal({
        title: "Choose an available period",
        message: "Please choose an availability period.",
        type: "error",
      });
      return;
    }

    if (!selectedStartTime) {
      setStatusModal({
        title: "Choose a start time",
        message: "Please choose a session start time.",
        type: "error",
      });
      return;
    }

    if (selectedDuration === null || !requestedEndTime) {
      setStatusModal({
        title: "Choose duration",
        message: "Please select your session duration.",
        type: "error",
      });
      return;
    }

    const selectedSkillObject =
      skillsToLearn.find((skill) => skill.name === selectedSkill) ||
      skillsCatalog.find(
        (skill) =>
          skill.name.trim().toLowerCase() === selectedSkill.trim().toLowerCase()
      );

    if (!selectedSkillObject) {
      setStatusModal({
        title: "Skill not found",
        message: "The selected skill could not be found.",
        type: "error",
      });
      return;
    }

    try {
      setSubmitting(true);

      await createMatchRequest({
        receiver: partnerId,
        skill: selectedSkillObject.id,
        selected_slot: selectedSlot,
        requested_start_time: selectedStartTime,
        requested_end_time: requestedEndTime,
      });

      navigate(targetPath, {
        state: {
          statusModal: {
            title: "Request sent",
            message: "Your skill swap request was sent successfully.",
            type: "success",
          },
        },
      });
    } catch (error) {
      const message = getErrorMessage(error);
      setStatusModal({
        title: "Request failed",
        message,
        type: "error",
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <main className="send-request-page">
        <div className="send-request-panel">
          <button
            type="button"
            className="send-request-back-btn"
            onClick={handleBack}
          >
            &larr; Back
          </button>
          <div className="empty-state">
            <h2>Loading session details...</h2>
          </div>
        </div>
      </main>
    );
  }

  if (!partnerId) {
    return (
      <main className="send-request-page">
        <div className="send-request-panel">
          <button
            type="button"
            className="send-request-back-btn"
            onClick={handleBack}
          >
            &larr; Back
          </button>
          <div className="empty-state">
            <h2>User not found</h2>
            <p>This profile could not be loaded.</p>
          </div>
        </div>
      </main>
    );
  }

  const initial = partnerUsername
    ? partnerUsername.charAt(0).toUpperCase()
    : "?";

  return (
    <>
      <StatusModal
        isOpen={Boolean(statusModal)}
        title={statusModal?.title ?? ""}
        message={statusModal?.message ?? ""}
        type={statusModal?.type ?? "success"}
        onClose={() => setStatusModal(null)}
      />

      <main className="send-request-page">
        <div className="send-request-panel">
          <div className="send-request-nav">
            <button
              type="button"
              className="send-request-back-btn"
              onClick={handleBack}
            >
              &larr; Back
            </button>
            <span className="send-request-brand">SkillMatch</span>
          </div>

          <header className="send-request-header">
            <div className="partner-profile-lockup">
              <div className="partner-avatar">{initial}</div>
              <div>
                <span className="step-tag">PROPOSE A SESSION</span>
                <h1 className="request-title">
                  Skill Swap with {partnerUsername}
                </h1>
              </div>
            </div>
          </header>

          {/* Skill Selection & Offer Grid */}
          <section className="swap-overview-section">
            <div className="swap-grid">
              {/* Skill to Learn */}
              <div className="swap-box learn-box">
                <div className="swap-box-header">
                  <span className="swap-direction-icon">📥</span>
                  <div>
                    <span className="swap-box-title">
                      Step 1: Select Skill to Learn
                    </span>
                    <span className="swap-box-subtitle">
                      What {partnerUsername} will teach you
                    </span>
                  </div>
                </div>

                <div className="skill-selector-list">
                  {skillsToLearn.length === 0 ? (
                    <p className="empty-state-text">
                      This user has not added any teaching skills yet.
                    </p>
                  ) : (
                    skillsToLearn.map((skill) => (
                      <button
                        type="button"
                        key={skill.id}
                        className={`skill-choice ${
                          selectedSkill === skill.name ? "selected" : ""
                        }`}
                        onClick={() => setSelectedSkill(skill.name)}
                      >
                        <span className="skill-radio"></span>
                        <span className="skill-text">{skill.name}</span>
                      </button>
                    ))
                  )}
                </div>
              </div>

              <div className="swap-divider">
                <span>⇄</span>
              </div>

              {/* Skills You Offer */}
              <div className="swap-box teach-box">
                <div className="swap-box-header">
                  <span className="swap-direction-icon">📤</span>
                  <div>
                    <span className="swap-box-title">Skills You Offer</span>
                    <span className="swap-box-subtitle">
                      Skills you can teach {partnerUsername}
                    </span>
                  </div>
                </div>

                <div className="skill-legend">
                  <span className="legend-item">
                    <span className="legend-dot matched-dot"></span>
                    <strong>Green:</strong> Matched skill ({partnerUsername} wants to learn this)
                  </span>
                  <span className="legend-item">
                    <span className="legend-dot default-dot"></span>
                    <strong>Gray:</strong> Other skills you teach
                  </span>
                </div>

                <div className="skills-badge-list">
                  {skillsYouOffer.length === 0 ? (
                    <span className="empty-state-text">
                      You have not added any teaching skills yet.
                    </span>
                  ) : (
                    skillsYouOffer.map((skill) => {
                      const isMatch = matchingSkillNames.has(
                        skill.skill_name.toLowerCase().trim()
                      );

                      return (
                        <span
                          className={`skill-pill pill-teach ${
                            isMatch ? "pill-matched" : ""
                          }`}
                          key={skill.id}
                        >
                          {isMatch && <span className="matched-star">★ </span>}
                          {skill.skill_name}
                        </span>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          </section>

          {/* Session Planner */}
          <section className="request-section">
            <div className="section-heading">
              <span className="step-number">02</span>
              <div>
                <h2>Plan your session</h2>
                <p>Select an available period, start time, and duration.</p>
              </div>
            </div>

            <div className="schedule-card">
              <div className="schedule-card-top">
                <div>
                  <span className="schedule-icon">◷</span>
                  <div>
                    <strong>{partnerUsername}&apos;s schedule</strong>
                    <p>Choose any session inside their available time.</p>
                  </div>
                </div>

                {sessionSettings && (
                  <span className="max-duration-badge">
                    Max {formatDuration(sessionSettings.max_session_duration_minutes)}
                  </span>
                )}
              </div>

              <div className="scheduler-grid">
                {/* 1. AVAILABILITY */}
                <div className="scheduler-field">
                  <label>
                    <span className="field-number">1</span> Availability
                  </label>
                  <div className="select-wrapper">
                    <select
                      value={selectedSlot ?? ""}
                      onChange={(e) => handleSlotChange(Number(e.target.value))}
                    >
                      <option value="">Choose availability</option>
                      {availableSlots.map((slot) => (
                        <option key={slot.id} value={slot.id}>
                          {formatDayLabel(slot.day)} · {formatTime(slot.start_time)} – {formatTime(slot.end_time)}
                        </option>
                      ))}
                    </select>
                    <span className="select-arrow">▾</span>
                  </div>
                </div>

                {/* 2. START TIME */}
                <div className="scheduler-field">
                  <label>
                    <span className="field-number">2</span> Start time
                  </label>
                  <div className="select-wrapper">
                    <select
                      value={selectedStartTime}
                      disabled={!selectedSlot}
                      onChange={(e) => handleStartTimeChange(e.target.value)}
                    >
                      <option value="">
                        {selectedSlot ? "Choose start time" : "Select availability first"}
                      </option>
                      {startTimeOptions.map((time) => (
                        <option key={time} value={time}>
                          {formatTime(time)}
                        </option>
                      ))}
                    </select>
                    <span className="select-arrow">▾</span>
                  </div>
                  {selectedSlot && (
                    <span className="field-hint">Every 15 minutes</span>
                  )}
                </div>

                {/* 3. DURATION */}
                <div className="scheduler-field">
                  <label>
                    <span className="field-number">3</span> Duration
                  </label>
                  <div className="select-wrapper">
                    <select
                      value={selectedDuration ?? ""}
                      disabled={!selectedStartTime}
                      onChange={(e) => setSelectedDuration(Number(e.target.value))}
                    >
                      <option value="">
                        {selectedStartTime ? "Choose duration" : "Choose start time first"}
                      </option>
                      {durationOptions.map((duration) => (
                        <option key={duration} value={duration}>
                          {formatDuration(duration)}
                        </option>
                      ))}
                    </select>
                    <span className="select-arrow">▾</span>
                  </div>
                </div>
              </div>

              {/* Proposed Session Summary */}
              {selectedSlotObject && selectedStartTime && selectedDuration && requestedEndTime && (
                <div className="session-preview">
                  <div className="preview-icon">✓</div>
                  <div className="preview-content">
                    <span>YOUR PROPOSED SESSION</span>
                    <strong>
                      {formatDayLabel(selectedSlotObject.day)} · {formatTime(selectedStartTime)} – {formatTime(requestedEndTime)}
                    </strong>
                  </div>
                  <div className="preview-duration">
                    {formatDuration(selectedDuration)}
                  </div>
                </div>
              )}
            </div>
          </section>

          {/* Footer */}
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
                selectedDuration === null ||
                submitting
              }
              onClick={handleSendRequest}
            >
              {submitting ? "Sending..." : "Send Request →"}
            </button>
          </div>
        </div>
      </main>
    </>
  );
}

export default SendRequest;