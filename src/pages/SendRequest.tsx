import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import {
  getMySkills,
  getUserProfile,
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
import VerifiedBadge from "../components/VerifiedBadge";
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
  is_verified?: boolean;
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

  if (targetDay === undefined) {
    return null;
  }

  const [hours, minutes] = time.split(":").map(Number);
  const daysAhead = (targetDay - now.getDay() + 7) % 7;

  const candidate = new Date(now);
  candidate.setDate(now.getDate() + daysAhead);
  candidate.setHours(hours, minutes, 0, 0);

  if (candidate <= now) {
    candidate.setDate(candidate.getDate() + 7);
  }

  return candidate;
}



const WIZARD_STEPS = [
  { n: 1, label: "Skill" },
  { n: 2, label: "Time" },
  { n: 3, label: "Review" },
] as const;

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
  // Everything the partner teaches, from their public profile (the matches list only has overlaps)
  const [partnerTeachSkills, setPartnerTeachSkills] = useState<SkillItem[] | null>(null);
  // Wizard step: 1 = skill, 2 = time, 3 = review
  const [step, setStep] = useState<1 | 2 | 3>(1);



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

          setPartnerWantsToLearn(

            (matchFromState.teach_them ?? []).map((skill) => skill.name)

          );

        }



        const resolvedId =

          teacherFromState?.user_id ??

          matchFromState?.user_id ??

          (userId ? Number(userId) : null);



        const [skillsData, matchesData, partnerProfile] = await Promise.all([

          getSkillsList(),

          resolvedId ? getMatches() : Promise.resolve([]),

          resolvedId ? getUserProfile(resolvedId).catch(() => null) : Promise.resolve(null),

        ]);

        if (isMounted && partnerProfile) {
          setPartnerTeachSkills(
            partnerProfile.teach_skills.map((skill) => ({
              id: skill.skill,
              name: skill.skill_name,
              is_verified: skill.is_verified,
            }))
          );
          // Their real learning list, for the "Wanted" tags on your skills.
          setPartnerWantsToLearn(partnerProfile.learn_skills.map((skill) => skill.skill_name));
        }



        if (!isMounted) return;



        setSkillsCatalog(skillsData);



        if (resolvedId) {

          const matchedUser = matchesData.find(

            (item) => item.user_id === resolvedId

          );



          if (matchedUser) {

            setMatch(matchedUser);

            setPartnerWantsToLearn(

              (matchedUser.teach_them ?? []).map((skill) => skill.name)

            );

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

  const targetPath = "/skillbrowse";



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

  const busyIntervals = sessionSettings?.busy_intervals ?? [];

  // Times someone already requested from this person can't be picked again.
  const requestedTimes = sessionSettings?.requested_times ?? [];



  const skillsToLearn =

    partnerTeachSkills ??

    teacher?.skills.map((skill) => ({

      id: skill.id,

      name: skill.name,

      is_verified: skill.is_verified ?? false,

    })) ??

    (match

      ? match.teach_me.map((skill, index) => ({

          id: match.teach_me_ids?.[index] ?? index + 1,

          name: skill.name,

          is_verified: skill.is_verified,

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



  const overlapsBusyInterval = (

    day: string,

    startTime: string,

    duration: number

  ) => {

    const startMinutes = timeToMinutes(startTime);
    const endMinutes = startMinutes + duration;
    const alreadyRequested = requestedTimes.some(
      (taken) =>
        taken.day.toLowerCase() === day.toLowerCase() &&
        startMinutes < timeToMinutes(taken.end_time) &&
        endMinutes > timeToMinutes(taken.start_time)
    );

    if (alreadyRequested) {

      return true;

    }

    const start = getCandidateDateTime(day, startTime);

    if (!start) {

      return false;

    }

    const end = new Date(start.getTime() + duration * 60 * 1000);



    return busyIntervals.some((busy) => {

      const busyStart = new Date(busy.start_time);

      const busyEnd = new Date(busy.end_time);



      return start < busyEnd && end > busyStart;

    });

  };



  const startTimeOptions = useMemo(() => {

    if (!selectedSlotObject) {

      return [];

    }



    const slotStart = timeToMinutes(selectedSlotObject.start_time);

    const slotEnd = timeToMinutes(selectedSlotObject.end_time);



    const firstStart = Math.ceil(slotStart / 15) * 15;

    const options: string[] = [];



    for (let current = firstStart; current + 15 <= slotEnd; current += 15) {

      const time = minutesToTime(current);

      if (!overlapsBusyInterval(selectedSlotObject.day, time, 15)) {

        options.push(time);

      }

    }



    return options;

  }, [selectedSlotObject, busyIntervals, requestedTimes]);



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

      if (!overlapsBusyInterval(selectedSlotObject.day, selectedStartTime, duration)) {

        options.push(duration);

      }

    }



    return options;

  }, [

    selectedSlotObject,

    selectedStartTime,

    sessionSettings,

    busyIntervals,
    requestedTimes,

  ]);



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



  const latestSettings = await getUserSessionSettings(partnerId);



  const latestBusyIntervals =

    latestSettings.busy_intervals ?? [];



  if (!selectedSlotObject) {

    setStatusModal({

      title: "Availability changed",

      message:

        "This availability is no longer available. Please choose another time.",

      type: "error",

    });



    setSubmitting(false);

    return;

  }



  const requestedStart = getCandidateDateTime(

    selectedSlotObject.day,

    selectedStartTime

  );



  if (!requestedStart) {

    setStatusModal({

      title: "Invalid time",

      message:

        "The selected session time could not be checked.",

      type: "error",

    });



    setSubmitting(false);

    return;

  }



  const requestedEnd = new Date(

    requestedStart.getTime() +

      selectedDuration * 60 * 1000

  );



  const isNowBooked =

    latestBusyIntervals.some((busy) => {

      const busyStart = new Date(

        busy.start_time

      );



      const busyEnd = new Date(

        busy.end_time

      );



      return (

        requestedStart < busyEnd &&

        requestedEnd > busyStart

      );

    });



  if (isNowBooked) {

    setSessionSettings(latestSettings);



    setSelectedStartTime("");

    setSelectedDuration(null);



    setStatusModal({

      title: "Time no longer available",

      message:

        "This time was booked by another user. Please choose another available time.",

      type: "error",

    });



    setSubmitting(false);

    return;

  }



  setSessionSettings(latestSettings);



  await createMatchRequest({

    receiver: partnerId,

    skill: selectedSkillObject.id,

    selected_slot: selectedSlot,

    requested_start_time: selectedStartTime,

    requested_end_time: requestedEndTime,

  });

  setStatusModal({
    title: "Request sent!",
    message: `Your request was sent to ${partnerUsername} successfully.`,
    type: "success",
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
      <main className="sr-page">
        <div className="sr-container">
          <button type="button" className="sr-back" onClick={handleBack}>
            &larr; Back
          </button>
          <p className="sr-state">Loading session details...</p>
        </div>
      </main>
    );
  }

  if (!partnerId) {
    return (
      <main className="sr-page">
        <div className="sr-container">
          <button type="button" className="sr-back" onClick={handleBack}>
            &larr; Back
          </button>
          <div className="sr-state">
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

  const ready =
    Boolean(selectedSkill) &&
    Boolean(selectedSlot) &&
    Boolean(selectedStartTime) &&
    selectedDuration !== null;

  const timeReady =
    Boolean(selectedSlot) && Boolean(selectedStartTime) && selectedDuration !== null;

  // A step can be opened once everything before it is filled in.
  const canOpenStep = (n: 1 | 2 | 3) =>
    n === 1 || (n === 2 && Boolean(selectedSkill)) || (n === 3 && ready);

  return (
    <>
      <StatusModal
        isOpen={Boolean(statusModal)}
        title={statusModal?.title ?? ""}
        message={statusModal?.message ?? ""}
        type={statusModal?.type ?? "success"}
        onClose={() => {
          if (
            statusModal?.type === "success" &&
            statusModal?.title === "Request sent!"
          ) {
            navigate("/my-requests");
            return;
          }

          setStatusModal(null);
        }}
      />

      <main className="sr-page">
        <div className="sr-container">
          <button type="button" className="sr-back" onClick={handleBack}>
            &larr; Back
          </button>

          <header className="sr-header">
            <div className="sr-avatar" aria-hidden="true">{initial}</div>
            <div>
              <h1>Request a skill swap with {partnerUsername}</h1>
              <p>
                Pick what you want to learn and a time that fits their schedule.
                They can accept or decline.
              </p>
            </div>
          </header>

          <nav className="sr-progress" aria-label="Request steps">
            <span className="sr-progress-label">Step {step} of 3</span>
            <ol>
              {WIZARD_STEPS.map((item) => {
                const state = item.n === step ? "current" : item.n < step ? "done" : "todo";
                return (
                  <li key={item.n} className={`sr-progress-step ${state}`}>
                    <button
                      type="button"
                      disabled={!canOpenStep(item.n)}
                      aria-current={item.n === step ? "step" : undefined}
                      onClick={() => setStep(item.n)}
                    >
                      <span className="sr-progress-bar" aria-hidden="true" />
                      {item.label}
                    </button>
                  </li>
                );
              })}
            </ol>
          </nav>

          {step === 1 && (
            <section className="sr-card">
              <h2>What do you want to learn?</h2>
              <p className="sr-help">Choose one skill {partnerUsername} teaches.</p>

              {skillsToLearn.length === 0 ? (
                <p className="sr-empty">{partnerUsername} has not added any teaching skills yet.</p>
              ) : (
                <div className="sr-options" role="radiogroup" aria-label="Skill to learn">
                  {skillsToLearn.map((skill) => {
                    const checked = selectedSkill === skill.name;
                    return (
                      <label key={skill.id} className={checked ? "sr-option checked" : "sr-option"}>
                        <input
                          type="radio"
                          name="skill-to-learn"
                          checked={checked}
                          onChange={() => setSelectedSkill(skill.name)}
                        />
                        <span className="sr-option-name" title={skill.name}>{skill.name}</span>
                        <VerifiedBadge verified={!!skill.is_verified} compact />
                      </label>
                    );
                  })}
                </div>
              )}
            </section>
          )}

          {step === 2 && (
            <section className="sr-card">
              <h2>When should it happen?</h2>
              <p className="sr-help">
                Pick a time inside {partnerUsername}'s weekly availability
                {sessionSettings
                  ? `. Sessions can be up to ${formatDuration(sessionSettings.max_session_duration_minutes)}.`
                  : "."}
              </p>

              <div className="sr-fields">
                <label className="sr-field">
                  <span>Time window</span>
                  <select
                    value={selectedSlot ?? ""}
                    onChange={(e) => handleSlotChange(Number(e.target.value))}
                  >
                    <option value="">
                      {availableSlots.length > 0 ? "Choose a window" : "No availability yet"}
                    </option>
                    {availableSlots.map((slot) => (
                      <option key={slot.id} value={slot.id}>
                        {formatDayLabel(slot.day)}, {formatTime(slot.start_time)} – {formatTime(slot.end_time)}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="sr-field">
                  <span>Start time</span>
                  <select
                    value={selectedStartTime}
                    disabled={!selectedSlot}
                    onChange={(e) => handleStartTimeChange(e.target.value)}
                  >
                    <option value="">
                      {selectedSlot
                        ? startTimeOptions.length > 0
                          ? "Choose a start time"
                          : "No free times"
                        : "Choose a window first"}
                    </option>
                    {startTimeOptions.map((time) => (
                      <option key={time} value={time}>
                        {formatTime(time)}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="sr-field">
                  <span>Length</span>
                  <select
                    value={selectedDuration ?? ""}
                    disabled={!selectedStartTime}
                    onChange={(e) => setSelectedDuration(Number(e.target.value))}
                  >
                    <option value="">
                      {selectedStartTime
                        ? durationOptions.length > 0
                          ? "Choose a length"
                          : "No length available"
                        : "Choose a start time first"}
                    </option>
                    {durationOptions.map((duration) => (
                      <option key={duration} value={duration}>
                        {formatDuration(duration)}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
            </section>
          )}

          {step === 3 && (
            <section className="sr-card">
              <h2>Review your request</h2>
              <p className="sr-help">{partnerUsername} can accept or decline it.</p>

              <dl className="sr-review">
                <div>
                  <dt>With</dt>
                  <dd>{partnerUsername}</dd>
                </div>
                <div>
                  <dt>You learn</dt>
                  <dd>{selectedSkill}</dd>
                </div>
                <div>
                  <dt>When</dt>
                  <dd>
                    {selectedSlotObject && selectedStartTime && requestedEndTime
                      ? `${formatDayLabel(selectedSlotObject.day)}, ${formatTime(selectedStartTime)} – ${formatTime(requestedEndTime)}`
                      : "-"}
                  </dd>
                </div>
                <div>
                  <dt>Length</dt>
                  <dd>{selectedDuration ? formatDuration(selectedDuration) : "-"}</dd>
                </div>
                <div>
                  <dt>You can offer</dt>
                  <dd>
                    {skillsYouOffer.length === 0 ? (
                      "No teaching skills yet"
                    ) : (
                      <ul className="sr-tags">
                        {skillsYouOffer.map((skill) => {
                          const wanted = matchingSkillNames.has(skill.skill_name.toLowerCase().trim());
                          return (
                            <li key={skill.id} className={wanted ? "sr-tag wanted" : "sr-tag"}>
                              {skill.skill_name}
                              {wanted && <span className="sr-tag-note">Wanted</span>}
                            </li>
                          );
                        })}
                      </ul>
                    )}
                    <span className="sr-review-note">
                      {partnerUsername} picks one of these when they accept, or none.
                    </span>
                  </dd>
                </div>
              </dl>
            </section>
          )}

          <footer className="sr-footer">
            {step > 1 ? (
              <button type="button" className="sr-secondary" onClick={() => setStep((step - 1) as 1 | 2)}>
                Previous
              </button>
            ) : (
              <span />
            )}

            {step < 3 ? (
              <button
                type="button"
                className="sr-send"
                disabled={step === 1 ? !selectedSkill : !timeReady}
                onClick={() => setStep((step + 1) as 2 | 3)}
              >
                Next
              </button>
            ) : (
              <button
                type="button"
                className="sr-send"
                disabled={!ready || submitting}
                onClick={handleSendRequest}
              >
                {submitting ? "Sending..." : "Send request"}
              </button>
            )}
          </footer>
        </div>
      </main>
    </>
  );
}

export default SendRequest;
