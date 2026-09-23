import { useEffect, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";

import {
  getUserAvailability,
  getMySkills,
  type AvailabilitySlot,
} from "../api/profileApi";

import {
  getMatches,
  createMatchRequest,
} from "../api/matchingApi";

import { getErrorMessage } from "../lib/api";
import StatusModal from "../components/ui/StatusModal";

import type { Match, Teacher } from "../types/match";

import "./SendRequest.css";

interface MySkill {
  id: number;
  skill: number;
  skill_name: string;
  skill_type: "teach" | "learn";
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

  const [selectedSkill, setSelectedSkill] = useState<string | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<number | null>(null);

  const [match, setMatch] = useState<Match | null>(
    matchFromState ?? null
  );

  const [teacher, setTeacher] = useState<Teacher | null>(
    teacherFromState ?? null
  );

  const [availableSlots, setAvailableSlots] = useState<
    AvailabilitySlot[]
  >([]);

  const [mySkills, setMySkills] = useState<MySkill[]>([]);
  const [partnerWantsToLearn, setPartnerWantsToLearn] = useState<string[]>([]);

  const [loading, setLoading] = useState(
    !matchFromState && !teacherFromState
  );

  const [submitting, setSubmitting] = useState(false);

  const [statusModal, setStatusModal] = useState<{
    title: string;
    message: string;
    type: "success" | "error";
  } | null>(null);

  /*
   * Load selected user and detect mutual match skills across all origins
   */
  useEffect(() => {
    let isMounted = true;

    async function initialize() {
      try {
        if (teacherFromState) {
          if (isMounted) {
            setTeacher(teacherFromState);
          }
        } else if (matchFromState) {
          if (isMounted) {
            setMatch(matchFromState);
            setPartnerWantsToLearn(matchFromState.teach_them ?? []);
          }
        }

        const resolvedId =
          teacherFromState?.user_id ??
          matchFromState?.user_id ??
          (userId ? Number(userId) : null);

        if (resolvedId) {
          const matchesData = await getMatches();
          if (!isMounted) return;

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
   * Load CURRENT USER'S skills
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

  const partnerId = teacher?.user_id ?? match?.user_id ?? null;
  const partnerUsername = teacher?.username ?? match?.username ?? "";
  const targetPath = teacherFromState ? "/skillbrowse" : "/matches";

  useEffect(() => {
    if (partnerId === null) {
      setAvailableSlots([]);
      return;
    }

    const currentPartnerId = partnerId;
    let isMounted = true;

    async function loadAvailability() {
      try {
        const slots = await getUserAvailability(currentPartnerId);

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
  }, [partnerId]);

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

  const skillsYouOffer = mySkills.filter(
    (skill) => skill.skill_type === "teach"
  );

  const matchingSkillNames = new Set<string>(
    partnerWantsToLearn.map((s) => s.toLowerCase().trim())
  );

  const handleBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
      return;
    }

    navigate(teacherFromState ? "/skillbrowse" : "/matches");
  };

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

    if (selectedSkill === null) {
      setStatusModal({
        title: "Choose a skill",
        message: "Please select a skill you want to learn.",
        type: "error",
      });
      return;
    }

    if (selectedSlot === null) {
      setStatusModal({
        title: "Choose a time slot",
        message: "Please select a convenient meeting time slot.",
        type: "error",
      });
      return;
    }

    const selectedSkillObject = skillsToLearn.find(
      (skill) => skill.name === selectedSkill
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
            <h2>Loading user details...</h2>
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
            <p>We could not load this user's profile details.</p>
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
                        className={`skill-choice-pill ${
                          selectedSkill === skill.name ? "selected" : ""
                        }`}
                        onClick={() => setSelectedSkill(skill.name)}
                      >
                        <span className="radio-indicator"></span>
                        <span className="skill-text">{skill.name}</span>
                      </button>
                    ))
                  )}
                </div>
              </div>

              <div className="swap-divider">
                <span>⇄</span>
              </div>

              {/* Skills You Offer with Color Legend */}
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

          <section className="availability-section">
            <div className="section-title-group">
              <span className="section-step-num">Step 2</span>
              <h3>Choose a Time Slot</h3>
            </div>

            <p className="section-subtext">
              Times are based on {partnerUsername}&apos;s weekly schedule.
            </p>

            <div className="slot-list">
              {availableSlots.length === 0 ? (
                <div className="empty-availability">
                  <p>No available slots shared yet by {partnerUsername}.</p>
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
    </>
  );
}

export default SendRequest;