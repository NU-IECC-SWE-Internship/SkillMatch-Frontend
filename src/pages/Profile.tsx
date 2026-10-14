import { useEffect, useState } from "react";



import type { FormEvent } from "react";



import { Link, useNavigate } from "react-router-dom";



import {

  getProfile,

  updateEmailNotifications,

  updateProfileSettings,

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



import NotificationBell from "../components/NotificationBell";
import { logout } from "../lib/auth";



import "./MyProfile.css";
import "./ProfileRedesign.css";



const DAYS = [

  "monday",

  "tuesday",

  "wednesday",

  "thursday",

  "friday",

  "saturday",

  "sunday",

];



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



  const [profileSaving, setProfileSaving] = useState(false);



  const [message, setMessage] = useState<{

    text: string;

    type: "success" | "error";

  } | null>(null);



  const [ratingAverage, setRatingAverage] = useState(0);

  const [emailNotifications, setEmailNotifications] = useState(true);

  const [notificationsLoading, setNotificationsLoading] = useState(false);

  const [notificationFeedback, setNotificationFeedback] = useState("");



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



  // ---------------- AVAILABILITY ----------------



  const [slots, setSlots] = useState<AvailabilitySlot[]>([]);



  const [editingId, setEditingId] = useState<number | null>(null);



  const [slotError, setSlotError] = useState("");



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



        setEmailNotifications(

          profileData.email_notifications_enabled ?? true

        );



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



  // ---------------- SAVE PROFILE ----------------




  const saveProfile = async () => {

    try {

      setProfileSaving(true);



      setMessage(null);



      const saved = await updateProfileSettings({

        bio,

        max_session_duration_minutes: maxSessionDuration,

      });



      setBio(saved.bio || "");



      setSavedBio(saved.bio || "");



      setMaxSessionDuration(saved.max_session_duration_minutes);



      setSavedDuration(saved.max_session_duration_minutes);



      setMessage({

        text: "Changes saved.",

        type: "success",

      });

    } catch (error) {

      console.error(error);



      setMessage({

        text: "Could not save your changes.",

        type: "error",

      });

    } finally {

      setProfileSaving(false);

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
      <section className={`mp-card mp-skill-card mp-theme-${type}`}>
        <div className="mp-card-head">
          <div className="mp-card-title">
            <h2>
              {type === "teach"
                ? "Skills I Can Teach"
                : "Skills I Want to Learn"}
            </h2>

            <p>
              {type === "teach"
                ? "Manage the skills you can offer to other learners."
                : "Choose the skills you want to learn from other people."}
            </p>
          </div>

          <span className="mp-count">
            {selected.length} {type === "teach" ? "Listed" : "Desired"}
          </span>
        </div>

        {selected.length === 0 ? (
          <p className="mp-empty">
            {type === "teach"
              ? "No teaching skills yet. Add an existing skill or request a new one below."
              : "No learning skills yet. Choose an existing skill below."}
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
      </section>
    );
  };

  // ---------------- PAGE ----------------

  const initial = username
    ? username.charAt(0).toUpperCase()
    : "?";

  function handleLogout() {
    logout();
    navigate("/login", { replace: true });
  }

  if (profileLoading || profileLoadError) {
    return (
      <main className="mp-page">
        <header className="profile-topbar">
          <div className="profile-topbar-main">
            <button
              type="button"
              className="profile-brand"
              onClick={() => navigate("/dashboard")}
            >
              <span className="profile-brand-icon" aria-hidden="true">
                ↔
              </span>
              <span>SkillSwap</span>
            </button>

            <nav className="profile-main-nav" aria-label="Main navigation">
              <button type="button" onClick={() => navigate("/dashboard")}>
                Dashboard
              </button>
              <button type="button" onClick={() => navigate("/skillbrowse")}>
                Browse Skills
              </button>
              <button type="button" onClick={() => navigate("/requests")}>
                Requests
              </button>
              <button type="button" onClick={() => navigate("/meetings")}>
                Sessions
              </button>
              <button
                type="button"
                className="active"
                onClick={() => navigate("/profile")}
              >
                Profile
              </button>
            </nav>

            <div className="profile-topbar-actions">
              <NotificationBell />
              <button
                type="button"
                className="profile-logout"
                onClick={handleLogout}
              >
                Logout
              </button>
            </div>
          </div>

          <div className="profile-mobile-nav">
            <button type="button" onClick={() => navigate("/dashboard")}>
              Dashboard
            </button>
            <button type="button" onClick={() => navigate("/skillbrowse")}>
              Browse
            </button>
            <button type="button" onClick={() => navigate("/requests")}>
              Requests
            </button>
            <button type="button" onClick={() => navigate("/meetings")}>
              Sessions
            </button>
            <button
              type="button"
              className="active"
              onClick={() => navigate("/profile")}
            >
              Profile
            </button>
          </div>
        </header>

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

  return (
    <main className="mp-page">
      <header className="profile-topbar">
        <div className="profile-topbar-main">
          <button
            type="button"
            className="profile-brand"
            onClick={() => navigate("/dashboard")}
          >
            <span className="profile-brand-icon" aria-hidden="true">
              ↔
            </span>
            <span>SkillSwap</span>
          </button>

          <nav className="profile-main-nav" aria-label="Main navigation">
            <button type="button" onClick={() => navigate("/dashboard")}>
              Dashboard
            </button>
            <button type="button" onClick={() => navigate("/skillbrowse")}>
              Browse Skills
            </button>
            <button type="button" onClick={() => navigate("/requests")}>
              Requests
            </button>
            <button type="button" onClick={() => navigate("/meetings")}>
              Sessions
            </button>
            <button
              type="button"
              className="active"
              onClick={() => navigate("/profile")}
            >
              Profile
            </button>
          </nav>

          <div className="profile-topbar-actions">
            <NotificationBell />
            <button
              type="button"
              className="profile-logout"
              onClick={handleLogout}
            >
              Logout
            </button>
          </div>
        </div>

        <div className="profile-mobile-nav">
          <button type="button" onClick={() => navigate("/dashboard")}>
            Dashboard
          </button>
          <button type="button" onClick={() => navigate("/skillbrowse")}>
            Browse
          </button>
          <button type="button" onClick={() => navigate("/requests")}>
            Requests
          </button>
          <button type="button" onClick={() => navigate("/meetings")}>
            Sessions
          </button>
          <button
            type="button"
            className="active"
            onClick={() => navigate("/profile")}
          >
            Profile
          </button>
        </div>
      </header>

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

          <section className="mp-hero-about">
            <div className="mp-card-head">
              <div className="mp-card-title">
                <h2>About Me</h2>
                <p>A short intro helps people decide to swap with you.</p>
              </div>
            </div>

            <textarea
              className="mp-textarea"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="e.g. Frontend developer who loves teaching React. Looking to learn data analysis."
            />

            <div className="mp-about-footer">
              <span>Visible on your public profile.</span>

              <button
                type="button"
                className="mp-btn mp-btn-primary"
                onClick={saveProfile}
                disabled={profileSaving || bio === savedBio}
              >
                {profileSaving ? "Saving..." : "Save Bio"}
              </button>
            </div>
          </section>
        </header>

        {message && (
          <div className={`mp-inline-message ${message.type}`}>
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

        <div className="mp-profile-layout">
          <div className="mp-profile-column">
            {renderSkillSection("teach")}
          </div>

          <div className="mp-profile-column">
            {renderSkillSection("learn")}

            <section className="mp-card mp-availability-card">
              <div className="mp-card-head">
                <div className="mp-card-title">
                  <h2>Weekly Availability</h2>
                  <p>
                    People can request sessions during these times.
                  </p>
                </div>

                <span className="mp-count">
                  Recurring
                </span>
              </div>

              <div className="mp-setting">
                <div>
                  <strong>
                    Maximum Session Length
                  </strong>

                  <span>
                    Sessions can be shorter, but never longer than this.
                  </span>
                </div>

                <div className="mp-setting-controls">
                  <select
                    value={maxSessionDuration}
                    onChange={(e) =>
                      setMaxSessionDuration(
                        Number(e.target.value)
                      )
                    }
                  >
                    {sessionDurationOptions.map(
                      (option) => (
                        <option
                          key={option.value}
                          value={option.value}
                        >
                          {option.label}
                        </option>
                      )
                    )}
                  </select>

                  <button
                    type="button"
                    className="mp-btn mp-btn-primary mp-duration-save"
                    onClick={saveProfile}
                    disabled={
                      profileSaving ||
                      maxSessionDuration === savedDuration
                    }
                  >
                    {profileSaving ? "Saving..." : "Save"}
                  </button>
                </div>
              </div>

              <div className="mp-slot-section">
                <span className="mp-label">
                  Active recurring slots
                </span>

                {sortedSlots.length === 0 ? (
                  <p className="mp-empty">
                    No time slots yet. Add your first one below.
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
                            onClick={() =>
                              startEditingSlot(slot)
                            }
                          >
                            Edit
                          </button>

                          <button
                            type="button"
                            className="mp-link-btn danger"
                            onClick={() =>
                              removeSlot(slot.id)
                            }
                          >
                            Delete
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

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
                        <option
                          key={day}
                          value={day}
                        >
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
                          start_time:
                            e.target.value,
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
                          end_time:
                            e.target.value,
                        })
                      }
                    />
                  </label>

                  <div className="mp-slot-submit">
                    <button
                      type="submit"
                      className="mp-btn mp-btn-primary"
                    >
                      {editingId !== null
                        ? "Save"
                        : "Add Slot"}
                    </button>

                    {editingId !== null && (
                      <button
                        type="button"
                        className="mp-btn mp-btn-ghost"
                        onClick={resetSlotForm}
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                </div>

                {slotError && (
                  <p className="mp-error">
                    {slotError}
                  </p>
                )}
              </form>
            </section>
          </div>
        </div>

        <section className="mp-notification-card">
          <div>
            <strong>Email notifications</strong>
            <span>
              Receive email updates for requests, changes and meeting cancellations.
            </span>
          </div>

          <label className="mp-notification-toggle">
            <input
              type="checkbox"
              checked={emailNotifications}
              disabled={notificationsLoading}
              onChange={async () => {
                const nextVal = !emailNotifications;
                setEmailNotifications(nextVal);
                setNotificationsLoading(true);
                setNotificationFeedback("");

                try {
                  await updateEmailNotifications(nextVal);
                  setNotificationFeedback(
                    nextVal
                      ? "Email notifications turned on"
                      : "Email notifications paused"
                  );
                  setTimeout(() => setNotificationFeedback(""), 3500);
                } catch (err) {
                  console.error(err);
                  setEmailNotifications(!nextVal);
                  setNotificationFeedback("Failed to update setting");
                } finally {
                  setNotificationsLoading(false);
                }
              }}
            />

            <span>
              {emailNotifications ? "Enabled" : "Disabled"}
            </span>
          </label>

          {notificationFeedback && (
            <p className="mp-notification-feedback">
              {notificationFeedback}
            </p>
          )}
        </section>

      </div>
    </main>
  );
}

export default Profile;