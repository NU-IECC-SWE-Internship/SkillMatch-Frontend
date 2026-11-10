import { useEffect, useState } from "react";



import type { FormEvent } from "react";



import { Link, useNavigate } from "react-router-dom";



import {
  getProfile,
  updateProfile,
  updateMaxSessionDuration,
  getSkills,

  createSkill,

  getMySkills,

  addUserSkill,

  deleteUserSkill,

  getAvailability,

  addAvailability,

  updateAvailability,

  deleteAvailability,

} from "../api/profileApi";



import type {

  Skill,

  UserSkill,

  AvailabilitySlot,

} from "../api/profileApi";



import VerifiedBadge from "../components/VerifiedBadge";



import { useNotifications } from "../context/NotificationContext";
import "./MyProfile.css";
import "./ProfileRedesign.css";
import "./ProfileSections.css";



const DAYS = [

  "monday",

  "tuesday",

  "wednesday",

  "thursday",

  "friday",

  "saturday",

  "sunday",

];



// How long a toast stays on screen; keep in sync with the fade-out delay in ProfileSections.css.
const TOAST_MS = 3500;

const sessionDurationOptions = [

  { value: 15, label: "15 minutes" },

  { value: 30, label: "30 minutes" },

  { value: 45, label: "45 minutes" },



  { value: 60, label: "1 hour" },

  { value: 75, label: "1 hour 15 minutes" },

  { value: 90, label: "1 hour 30 minutes" },

  { value: 105, label: "1 hour 45 minutes" },



  { value: 120, label: "2 hours" },

  { value: 135, label: "2 hours 15 minutes" },

  { value: 150, label: "2 hours 30 minutes" },

  { value: 165, label: "2 hours 45 minutes" },



  { value: 180, label: "3 hours" },

  { value: 195, label: "3 hours 15 minutes" },

  { value: 210, label: "3 hours 30 minutes" },

  { value: 225, label: "3 hours 45 minutes" },



  { value: 240, label: "4 hours" },

];



function retryLabel(availableAt: string | null | undefined) {

  if (!availableAt) return "Retry later";



  const minutes = Math.ceil(

    (new Date(availableAt).getTime() - Date.now()) / 60000

  );



  if (minutes <= 0) return "Retry now";



  if (minutes < 60) return `Retry in ${minutes}m`;



  const hours = Math.floor(minutes / 60);



  const rest = minutes % 60;



  if (hours >= 24) {

    const days = Math.floor(hours / 24);

    const restHours = hours % 24;

    return restHours ? `Retry in ${days}d ${restHours}h` : `Retry in ${days}d`;

  }



  return rest ? `Retry in ${hours}h ${rest}m` : `Retry in ${hours}h`;

}



function capitalize(value: string) {

  return value.charAt(0).toUpperCase() + value.slice(1);

}



function formatTime(value: string) {

  const [hours, minutes] = value.split(":").map(Number);



  const suffix = hours >= 12 ? "PM" : "AM";



  const displayHours = ((hours + 11) % 12) + 1;



  return `${displayHours}:${String(minutes).padStart(2, "0")} ${suffix}`;

}



function Profile() {

  const navigate = useNavigate();



  // ---------------- PROFILE ----------------



  const [userId, setUserId] = useState<number | null>(null);



  const [username, setUsername] = useState("");



  const [bio, setBio] = useState("");



  const [savedBio, setSavedBio] = useState("");



  const [maxSessionDuration, setMaxSessionDuration] = useState(120);



  const [savedDuration, setSavedDuration] = useState(120);



  const [editingBio, setEditingBio] = useState(false);

  const [bioSaving, setBioSaving] = useState(false);

  const [settingsSaving, setSettingsSaving] = useState(false);

  const {
    emailNotifications,
    emailNotificationsLoading,
    toggleEmailNotifications,
  } = useNotifications();



  const [message, setMessageState] = useState<{

    id: number;

    text: string;

    type: "success" | "error";

  } | null>(null);

  // Each message gets a fresh id so the toast re-animates even if one is already showing.
  const setMessage = (
    next: { text: string; type: "success" | "error" } | null
  ) => {

    setMessageState(next ? { ...next, id: Date.now() } : null);

  };



  const [ratingAverage, setRatingAverage] = useState(0);

  const [ratingCount, setRatingCount] = useState(0);

  const [profileLoading, setProfileLoading] = useState(true);

  const [profileLoadError, setProfileLoadError] = useState("");



  // ---------------- SKILLS ----------------



  const [skills, setSkills] = useState<Skill[]>([]);



  const [mySkills, setMySkills] = useState<UserSkill[]>([]);



  const [otherTeach, setOtherTeach] = useState("");



  const [otherLearn, setOtherLearn] = useState("");



  const [selectedTeachSkill, setSelectedTeachSkill] = useState("");



  const [selectedLearnSkill, setSelectedLearnSkill] = useState("");

  // Which skill list has its "add" form open
  const [addingSkill, setAddingSkill] = useState<"teach" | "learn" | null>(null);



  // ---------------- AVAILABILITY ----------------



  const [slots, setSlots] = useState<AvailabilitySlot[]>([]);



  const [editingId, setEditingId] = useState<number | null>(null);



  const [slotError, setSlotError] = useState("");

  const [showSlotForm, setShowSlotForm] = useState(false);



  const [slotForm, setSlotForm] = useState({

    day: "monday",

    start_time: "",

    end_time: "",

  });



  // ---------------- LOAD DATA ----------------



  useEffect(() => {

    async function loadData() {

      setProfileLoading(true);
      setProfileLoadError("");

      try {

        const [

          profileData,

          skillsData,

          mySkillsData,

          availabilityData,

        ] = await Promise.all([

          getProfile(),

          getSkills(),

          getMySkills(),

          getAvailability(),

        ]);



        const duration =

          profileData.max_session_duration_minutes || 120;



        setUserId(profileData.user);



        setUsername(profileData.username || "");



        setBio(profileData.bio || "");



        setSavedBio(profileData.bio || "");



        setMaxSessionDuration(duration);



        setSavedDuration(duration);



        setRatingAverage(profileData.rating_average || 0);



        setRatingCount(profileData.rating_count || 0);



        setSkills(skillsData);



        setMySkills(mySkillsData);



        setSlots(availabilityData);

      } catch (error) {

        console.error(error);
        setProfileLoadError("Could not load your profile.");

      } finally {

        setProfileLoading(false);

      }

    }



    loadData();

  }, []);



  // Toast: shows briefly, then hides itself (CSS fades it out just before this fires).
  useEffect(() => {

    if (!message) return;

    const timer = setTimeout(() => setMessageState(null), TOAST_MS);

    return () => clearTimeout(timer);

  }, [message]);

  // ---------------- SAVE PROFILE ----------------




  // Bio and settings save separately so one never sends the other's unsaved edits.
  const saveBio = async () => {

    try {

      setBioSaving(true);

      setMessage(null);

      const saved = await updateProfile(bio);

      setBio(saved.bio || "");

      setSavedBio(saved.bio || "");

      setEditingBio(false);

      setMessage({

        text: "Bio saved.",

        type: "success",

      });

    } catch (error) {

      console.error(error);

      setMessage({

        text: "Could not save your bio.",

        type: "error",

      });

    } finally {

      setBioSaving(false);

    }

  };

  const cancelBioEdit = () => {

    setBio(savedBio);

    setEditingBio(false);

  };

  const saveSessionLength = async () => {

    try {

      setSettingsSaving(true);

      setMessage(null);

      const saved = await updateMaxSessionDuration(maxSessionDuration);

      setMaxSessionDuration(saved.max_session_duration_minutes);

      setSavedDuration(saved.max_session_duration_minutes);

      setMessage({

        text: "Settings saved.",

        type: "success",

      });

    } catch (error) {

      console.error(error);

      setMessage({

        text: "Could not save your settings.",

        type: "error",

      });

    } finally {

      setSettingsSaving(false);

    }

  };

  const handleEmailToggle = async () => {

    setMessage(null);

    const ok = await toggleEmailNotifications();

    if (!ok) {

      setMessage({

        text: "Could not update email notifications.",

        type: "error",

      });

    }

  };



  // ---------------- SKILLS ----------------



  const findOrCreateSkill = async (

    skillName: string

  ): Promise<Skill> => {

    const existingSkill = skills.find(

      (skill) =>

        skill.name.toLowerCase() === skillName.toLowerCase()

    );



    if (existingSkill) {

      return existingSkill;

    }



    const newSkill = await createSkill(skillName);



    setSkills((current) => [...current, newSkill]);



    return newSkill;

  };



  const hasSkill = (

    skillName: string,

    type: "teach" | "learn"

  ) =>

    mySkills.some(

      (item) =>

        item.skill_name.toLowerCase() === skillName.toLowerCase() &&

        item.skill_type === type

    );



  const toggleSkill = async (

    skillName: string,

    type: "teach" | "learn"

  ) => {

    try {

      const existingUserSkill = mySkills.find(

        (item) =>

          item.skill_name.toLowerCase() === skillName.toLowerCase() &&

          item.skill_type === type

      );



      if (existingUserSkill) {

        await deleteUserSkill(existingUserSkill.id);



        setMySkills((current) =>

          current.filter((item) => item.id !== existingUserSkill.id)

        );



        return;

      }



      const skill = await findOrCreateSkill(skillName);



      const newUserSkill = await addUserSkill(skill.id, type);



      setMySkills((current) => [...current, newUserSkill]);

    } catch (error) {

      console.error(error);

    }

  };



  const addExistingSkill = async (

    type: "teach" | "learn"

  ) => {

    const selectedId =

      type === "teach"

        ? selectedTeachSkill

        : selectedLearnSkill;



    if (!selectedId) {

      return;

    }



    const skill = skills.find(

      (item) => item.id === Number(selectedId)

    );



    if (!skill) {

      return;

    }



    if (hasSkill(skill.name, type)) {

      return;

    }



    try {

      const newUserSkill = await addUserSkill(

        skill.id,

        type

      );



      setMySkills((current) => [

        ...current,

        newUserSkill,

      ]);



      if (type === "teach") {

        setSelectedTeachSkill("");

      } else {

        setSelectedLearnSkill("");

      }

    } catch (error) {

      console.error(error);

    }

  };



  const addOtherSkill = async (

    type: "teach" | "learn"

  ) => {

    const value =

      type === "teach"

        ? otherTeach.trim()

        : otherLearn.trim();



    if (!value) {

      return;

    }



    if (hasSkill(value, type)) {

      setMessage({

        text: `You already added "${value}".`,

        type: "error",

      });



      return;

    }



    const existingSkill = skills.find(

      (skill) =>

        skill.name.toLowerCase() === value.toLowerCase()

    );



    if (existingSkill) {

      setMessage({

        text:

          existingSkill.is_approved === false

            ? `"${existingSkill.name}" already exists and is waiting for admin approval.`

            : `"${existingSkill.name}" already exists. Please select it from the dropdown.`,

        type: "error",

      });



      return;

    }



    try {

      const newSkill = await createSkill(value);



      setSkills((current) => [

        ...current,

        newSkill,

      ]);



      const newUserSkill = await addUserSkill(

        newSkill.id,

        type

      );



      setMySkills((current) => [

        ...current,

        newUserSkill,

      ]);



      if (type === "teach") {

        setOtherTeach("");

      } else {

        setOtherLearn("");

      }

    } catch (error) {

      console.error(error);

    }

  };



  const teachSkills = mySkills.filter(

    (skill) => skill.skill_type === "teach"

  );



  const learnSkills = mySkills.filter(

    (skill) => skill.skill_type === "learn"

  );



  // ---------------- AVAILABILITY ----------------



  const resetSlotForm = () => {

    setShowSlotForm(false);

    setEditingId(null);



    setSlotError("");



    setSlotForm({

      day: "monday",

      start_time: "",

      end_time: "",

    });

  };



  const handleSlotSubmit = async (e: FormEvent) => {

    e.preventDefault();



    if (!slotForm.start_time || !slotForm.end_time) {

      setSlotError("Please enter a start and end time.");



      return;

    }



    if (slotForm.start_time >= slotForm.end_time) {

      setSlotError("End time must be after start time.");



      return;

    }



    try {

      if (editingId !== null) {

        const updatedSlot = await updateAvailability(

          editingId,

          slotForm.day,

          slotForm.start_time,

          slotForm.end_time

        );



        setSlots((current) =>

          current.map((slot) =>

            slot.id === editingId ? updatedSlot : slot

          )

        );

      } else {

        const newSlot = await addAvailability(

          slotForm.day,

          slotForm.start_time,

          slotForm.end_time

        );



        setSlots((current) => [...current, newSlot]);

      }



      resetSlotForm();

    } catch (error) {

      console.error(error);



      setSlotError("Could not save this time slot.");

    }

  };



  const startEditingSlot = (slot: AvailabilitySlot) => {

    setEditingId(slot.id);



    setSlotError("");



    setSlotForm({

      day: slot.day,

      start_time: slot.start_time.slice(0, 5),

      end_time: slot.end_time.slice(0, 5),

    });

  };



  const removeSlot = async (id: number) => {

    try {

      await deleteAvailability(id);



      setSlots((current) =>

        current.filter((slot) => slot.id !== id)

      );



      if (editingId === id) {

        resetSlotForm();

      }

    } catch (error) {

      console.error(error);

    }

  };



  const sortedSlots = [...slots].sort(

    (a, b) =>

      DAYS.indexOf(a.day) - DAYS.indexOf(b.day) ||

      a.start_time.localeCompare(b.start_time)

  );



  // ---------------- RENDER HELPERS ----------------



  const renderTeachActions = (skill: UserSkill) => (

    <>

      {!skill.is_verified && skill.can_take_quiz ? (

        <button

          type="button"

          className="mp-btn mp-btn-quiz"

          onClick={() =>

            navigate(`/skills/${skill.skill}/quiz`)

          }

        >

          Verify with quiz

          {skill.has_quiz_attempt &&
          typeof skill.quiz_attempts_left === "number"
            ? ` · ${skill.quiz_attempts_left} ${
                skill.quiz_attempts_left === 1 ? "try" : "tries"
              } left`
            : ""}

        </button>

      ) : null}



      {!skill.is_verified &&

      !skill.can_take_quiz &&

      skill.has_quiz_attempt ? (

        <span

          className="mp-tag mp-tag-warn"

          title={

            skill.quiz_available_at

              ? `Available ${new Date(

                  skill.quiz_available_at

                ).toLocaleString()}`

              : undefined

          }

        >

          {retryLabel(skill.quiz_available_at)}



          {typeof skill.quiz_score === "number"

            ? ` · ${skill.quiz_score}/10`

            : ""}

        </span>

      ) : null}



      {skill.has_quiz_review ? (

        <Link

          to={`/skills/${skill.skill}/quiz/review`}

          className="mp-tag mp-tag-link"

          title="See which questions you got right or wrong"

        >

          Review answers

        </Link>

      ) : null}

    </>

  );



  const renderSkillSection = (
    type: "teach" | "learn"
  ) => {
    const selected =
      type === "teach" ? teachSkills : learnSkills;

    const otherValue =
      type === "teach" ? otherTeach : otherLearn;

    const setOtherValue =
      type === "teach" ? setOtherTeach : setOtherLearn;

    const availableSkills = skills.filter(
      (skill) =>
        skill.is_approved !== false &&
        !hasSkill(skill.name, type)
    );

    const selectedExistingSkill =
      type === "teach"
        ? selectedTeachSkill
        : selectedLearnSkill;

    const setSelectedExistingSkill =
      type === "teach"
        ? setSelectedTeachSkill
        : setSelectedLearnSkill;

    return (
      <div className={`mp-skill-group mp-theme-${type}`}>
        <div className="mp-group-head">
          <h3>
            {type === "teach" ? "I can teach" : "I want to learn"}
            <span className="mp-count">{selected.length}</span>
          </h3>

          <button
            type="button"
            className="mp-btn mp-btn-ghost mp-btn-small"
            onClick={() =>
              setAddingSkill(addingSkill === type ? null : type)
            }
            aria-expanded={addingSkill === type}
          >
            {addingSkill === type ? "Done" : "+ Add"}
          </button>
        </div>

        {selected.length === 0 ? (
          <p className="mp-empty">
            {type === "teach"
              ? "No teaching skills yet. Use + Add to list one."
              : "No learning skills yet. Use + Add to choose one."}
          </p>
        ) : (
          <ul className="mp-skill-list">
            {selected.map((skill) => (
              <li
                key={skill.id}
                className={
                  skill.is_verified
                    ? "mp-skill-row verified"
                    : "mp-skill-row"
                }
              >
                <div className="mp-skill-main">
                  <span className="mp-skill-initial" aria-hidden="true">
                    {skill.skill_name.slice(0, 2)}
                  </span>

                  <div className="mp-skill-copy">
                    <span className="mp-skill-name">
                      {skill.skill_name}
                    </span>

                    <div className="mp-skill-meta">
                      {type === "teach" && (
                        <VerifiedBadge
                          verified={skill.is_verified}
                        />
                      )}

                      {skill.skill_is_approved === false ? (
                        <span
                          className="mp-tag"
                          title="An admin needs to approve this skill before it shows in matches."
                        >
                          Pending approval
                        </span>
                      ) : null}
                    </div>
                  </div>
                </div>

                <div className="mp-skill-actions">
                  {type === "teach" &&
                    renderTeachActions(skill)}

                  <button
                    type="button"
                    className="mp-remove"
                    aria-label={`Remove ${skill.skill_name}`}
                    title="Remove"
                    onClick={() =>
                      toggleSkill(
                        skill.skill_name,
                        type
                      )
                    }
                  >
                    ×
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}

        {addingSkill === type && (
        <div className="mp-add">
          <span className="mp-label">
            Choose an existing skill
          </span>

          <form
            className="mp-add-form"
            onSubmit={(e) => {
              e.preventDefault();
              addExistingSkill(type);
            }}
          >
            <select
              value={selectedExistingSkill}
              onChange={(e) =>
                setSelectedExistingSkill(
                  e.target.value
                )
              }
            >
              <option value="">
                Select a skill...
              </option>

              {availableSkills.map((skill) => (
                <option
                  key={skill.id}
                  value={skill.id}
                >
                  {skill.name}
                </option>
              ))}
            </select>

            <button
              type="submit"
              className="mp-btn mp-btn-primary"
              disabled={!selectedExistingSkill}
            >
              Add
            </button>
          </form>

          {type === "teach" && (
            <>
              <span className="mp-label mp-request-label">
                Can't find your skill? Request a new one
              </span>

              <form
                className="mp-add-form"
                onSubmit={(e) => {
                  e.preventDefault();
                  addOtherSkill(type);
                }}
              >
                <input
                  type="text"
                  placeholder="Enter a new skill..."
                  value={otherValue}
                  onChange={(e) =>
                    setOtherValue(e.target.value)
                  }
                />

                <button
                  type="submit"
                  className="mp-btn mp-btn-secondary"
                  disabled={!otherValue.trim()}
                >
                  Request
                </button>
              </form>
            </>
          )}
        </div>
        )}
      </div>
    );
  };

  // ---------------- PAGE ----------------

  const initial = username
    ? username.charAt(0).toUpperCase()
    : "?";

  if (profileLoading || profileLoadError) {
    return (
      <main className="mp-page">

        <div className="mp-container">
          <section className="mp-card">
            <p className={profileLoadError ? "mp-error" : "mp-empty"}>
              {profileLoadError || "Loading your profile..."}
            </p>
          </section>
        </div>
      </main>
    );
  }

  const slotFormOpen = showSlotForm || editingId !== null;

  return (
    <main className="mp-page">

      <div className="mp-container">
        <header className="mp-hero">
          <div className="mp-hero-top">
            <div className="mp-hero-user">
              <div className="mp-avatar">
                {initial}
              </div>

              <div className="mp-hero-info">
                <div className="mp-name-row">
                  <h1>{username || "My profile"}</h1>

                  {ratingCount > 0 ? (
                    <span className="mp-rating">
                      <span className="mp-star">★</span>
                      <strong>{ratingAverage.toFixed(1)}</strong>
                      <span>
                        ({ratingCount} review
                        {ratingCount === 1 ? "" : "s"})
                      </span>
                    </span>
                  ) : (
                    <span className="mp-rating new">
                      New member
                    </span>
                  )}
                </div>

                <p className="mp-profile-caption">
                  Manage your skills, bio and weekly availability.
                </p>
              </div>
            </div>

            <div className="mp-summary-stats">
              <div className="mp-stat">
                <strong>{teachSkills.length}</strong>
                <span>Teaching Skills</span>
              </div>

              <div className="mp-stat">
                <strong>{learnSkills.length}</strong>
                <span>Learning Skills</span>
              </div>

              <div className="mp-stat">
                <strong>{slots.length}</strong>
                <span>Availability Slots</span>
              </div>
            </div>

            {userId !== null && (
              <Link
                to={`/users/${userId}`}
                className="mp-btn mp-btn-ghost mp-public-profile"
              >
                View Public Profile
              </Link>
            )}
          </div>
        </header>

        {message && (
          <div
            key={message.id}
            className={`mp-inline-message mp-toast ${message.type}`}
            role={message.type === "error" ? "alert" : "status"}
          >
            <span>{message.text}</span>
            <button
              type="button"
              aria-label="Dismiss message"
              onClick={() => setMessage(null)}
            >
              ×
            </button>
          </div>
        )}

        <div className="mp-sections">
          {/* About me */}
          <section className="mp-card mp-about-card">
            <div className="mp-card-head">
              <div className="mp-card-title">
                <h2>About Me</h2>
                <p>Shown on your public profile. A short intro helps people decide to swap with you.</p>
              </div>

              {!editingBio && (
                <button
                  type="button"
                  className="mp-btn mp-btn-ghost mp-btn-small"
                  onClick={() => setEditingBio(true)}
                >
                  {savedBio ? "Edit" : "+ Add"}
                </button>
              )}
            </div>

            {editingBio ? (
              <>
                <textarea
                  className="mp-textarea"
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="e.g. Frontend developer who loves teaching React. Looking to learn data analysis."
                  autoFocus
                />

                <div className="mp-section-actions">
                  <button
                    type="button"
                    className="mp-btn mp-btn-ghost"
                    onClick={cancelBioEdit}
                    disabled={bioSaving}
                  >
                    Cancel
                  </button>

                  <button
                    type="button"
                    className="mp-btn mp-btn-primary"
                    onClick={saveBio}
                    disabled={bioSaving || bio === savedBio}
                  >
                    {bioSaving ? "Saving..." : "Save"}
                  </button>
                </div>
              </>
            ) : savedBio ? (
              <p className="mp-bio-text">{savedBio}</p>
            ) : (
              <p className="mp-empty">You haven't written an intro yet.</p>
            )}
          </section>

          {/* Skills */}
          <section className="mp-card mp-skills-card">
            <div className="mp-card-head">
              <div className="mp-card-title">
                <h2>Skills</h2>
                <p>What you can teach and what you want to learn. Your matches are based on these.</p>
              </div>
            </div>

            <div className="mp-skills-grid">
              {renderSkillSection("teach")}
              {renderSkillSection("learn")}
            </div>
          </section>

          {/* Availability */}
          <section className="mp-card mp-availability-card">
            <div className="mp-card-head">
              <div className="mp-card-title">
                <h2>Weekly Availability</h2>
                <p>People can request sessions during these recurring times.</p>
              </div>

              {!slotFormOpen && (
                <button
                  type="button"
                  className="mp-btn mp-btn-ghost mp-btn-small"
                  onClick={() => setShowSlotForm(true)}
                >
                  + Add slot
                </button>
              )}
            </div>

            {sortedSlots.length === 0 ? (
              <p className="mp-empty">
                No time slots yet. Add one so people can book sessions with you.
              </p>
            ) : (
              <ul className="mp-slot-list">
                {sortedSlots.map((slot) => (
                  <li
                    key={slot.id}
                    className={
                      editingId === slot.id
                        ? "mp-slot editing"
                        : "mp-slot"
                    }
                  >
                    <span className="mp-slot-day">
                      {capitalize(slot.day).slice(0, 3)}
                    </span>

                    <span className="mp-slot-time">
                      {formatTime(slot.start_time)} –{" "}
                      {formatTime(slot.end_time)}
                    </span>

                    <div className="mp-slot-actions">
                      <button
                        type="button"
                        className="mp-link-btn"
                        onClick={() => startEditingSlot(slot)}
                      >
                        Edit
                      </button>

                      <button
                        type="button"
                        className="mp-link-btn danger"
                        onClick={() => removeSlot(slot.id)}
                      >
                        Delete
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}

            {slotFormOpen && (
              <form
                className="mp-slot-form"
                onSubmit={handleSlotSubmit}
              >
                <span className="mp-label">
                  {editingId !== null
                    ? "Edit recurring slot"
                    : "Add recurring slot"}
                </span>

                <div className="mp-slot-fields">
                  <label>
                    <span>Day</span>

                    <select
                      value={slotForm.day}
                      onChange={(e) =>
                        setSlotForm({
                          ...slotForm,
                          day: e.target.value,
                        })
                      }
                    >
                      {DAYS.map((day) => (
                        <option key={day} value={day}>
                          {capitalize(day)}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label>
                    <span>From</span>

                    <input
                      type="time"
                      value={slotForm.start_time}
                      onChange={(e) =>
                        setSlotForm({
                          ...slotForm,
                          start_time: e.target.value,
                        })
                      }
                    />
                  </label>

                  <label>
                    <span>To</span>

                    <input
                      type="time"
                      value={slotForm.end_time}
                      onChange={(e) =>
                        setSlotForm({
                          ...slotForm,
                          end_time: e.target.value,
                        })
                      }
                    />
                  </label>

                  <div className="mp-slot-submit">
                    <button
                      type="submit"
                      className="mp-btn mp-btn-primary"
                    >
                      {editingId !== null ? "Save" : "Add Slot"}
                    </button>

                    <button
                      type="button"
                      className="mp-btn mp-btn-ghost"
                      onClick={resetSlotForm}
                    >
                      Cancel
                    </button>
                  </div>
                </div>

                {slotError && (
                  <p className="mp-error">
                    {slotError}
                  </p>
                )}
              </form>
            )}
          </section>

          {/* Settings */}
          <section className="mp-card mp-settings-card">
            <div className="mp-card-head">
              <div className="mp-card-title">
                <h2>Settings</h2>
                <p>Session preferences and notifications.</p>
              </div>
            </div>

            <div className="mp-setting">
              <div>
                <strong>Maximum Session Length</strong>
                <span>Sessions can be shorter, but never longer than this.</span>
              </div>

              <div className="mp-setting-controls">
                <select
                  value={maxSessionDuration}
                  onChange={(e) =>
                    setMaxSessionDuration(Number(e.target.value))
                  }
                >
                  {sessionDurationOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>

                <button
                  type="button"
                  className="mp-btn mp-btn-primary mp-duration-save"
                  onClick={saveSessionLength}
                  disabled={
                    settingsSaving ||
                    maxSessionDuration === savedDuration
                  }
                >
                  {settingsSaving ? "Saving..." : "Save"}
                </button>
              </div>
            </div>

            <div className="mp-setting">
              <div>
                <strong>Email Notifications</strong>
                <span>Emails about requests, sessions and reviews. Saved as soon as you switch it.</span>
              </div>

              <button
                type="button"
                role="switch"
                aria-checked={emailNotifications}
                aria-label="Email notifications"
                className={emailNotifications ? "mp-switch on" : "mp-switch"}
                onClick={handleEmailToggle}
                disabled={emailNotificationsLoading}
              >
                <span className="mp-switch-knob" />
              </button>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}

export default Profile;
