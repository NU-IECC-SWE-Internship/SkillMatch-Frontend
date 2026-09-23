import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { Link } from "react-router-dom";

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

import "./Profile.css";


const defaultSkills = [
  "Python",
  "JavaScript",
  "React",
  "Django",
  "Machine Learning",
  "Data Analysis",
  "Figma",
  "UI/UX",
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


function Profile() {
  // ---------------- PROFILE ----------------

  const [username, setUsername] = useState("");
  const [bio, setBio] = useState("");

  const [profileSaving, setProfileSaving] =
    useState(false);

  const [message, setMessage] = useState("");

  const [
    maxSessionDuration,
    setMaxSessionDuration,
  ] = useState(120);

  const [ratingAverage, setRatingAverage] = useState(0);
  const [ratingCount, setRatingCount] = useState(0);


  // ---------------- SKILLS ----------------

  const [skills, setSkills] =
    useState<Skill[]>([]);

  const [mySkills, setMySkills] =
    useState<UserSkill[]>([]);

  const [otherTeach, setOtherTeach] =
    useState("");

  const [otherLearn, setOtherLearn] =
    useState("");


  // ---------------- AVAILABILITY ----------------

  const [slots, setSlots] =
    useState<AvailabilitySlot[]>([]);

  const [editingId, setEditingId] =
    useState<number | null>(null);

  const [slotForm, setSlotForm] = useState({
    day: "monday",
    start_time: "",
    end_time: "",
  });


  // ---------------- LOAD DATA ----------------

  useEffect(() => {
    async function loadData() {
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

        setUsername(
          profileData.username || ""
        );

        setBio(
          profileData.bio || ""
        );

        setMaxSessionDuration(
          profileData.max_session_duration_minutes || 120
        );

        setRatingAverage(
          profileData.rating_average || 0
        );

        setRatingCount(
          profileData.rating_count || 0
        );

        setSkills(skillsData);

        setMySkills(mySkillsData);

        setSlots(availabilityData);

      } catch (error) {
        console.error(error);
      }
    }

    loadData();

  }, []);


  // ---------------- SAVE PROFILE ----------------

  const saveProfile = async () => {
    try {
      setProfileSaving(true);
      setMessage("");

      await Promise.all([
        updateProfile(bio),
        updateMaxSessionDuration(
          maxSessionDuration
        ),
      ]);

      setMessage(
        "Profile saved successfully."
      );

    } catch (error) {
      console.error(error);

      setMessage(
        "Could not save profile."
      );

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
        skill.name.toLowerCase() ===
        skillName.toLowerCase()
    );

    if (existingSkill) {
      return existingSkill;
    }

    const newSkill =
      await createSkill(skillName);

    setSkills((current) => [
      ...current,
      newSkill,
    ]);

    return newSkill;
  };


  const hasSkill = (
    skillName: string,
    type: "teach" | "learn"
  ) => {

    return mySkills.some(
      (item) =>
        item.skill_name.toLowerCase() ===
          skillName.toLowerCase() &&
        item.skill_type === type
    );
  };


  const toggleSkill = async (
    skillName: string,
    type: "teach" | "learn"
  ) => {

    try {
      const existingUserSkill =
        mySkills.find(
          (item) =>
            item.skill_name.toLowerCase() ===
              skillName.toLowerCase() &&
            item.skill_type === type
        );


      // DELETE

      if (existingUserSkill) {

        await deleteUserSkill(
          existingUserSkill.id
        );

        setMySkills((current) =>
          current.filter(
            (item) =>
              item.id !==
              existingUserSkill.id
          )
        );

        return;
      }


      // ADD

      const skill =
        await findOrCreateSkill(
          skillName
        );

      const newUserSkill =
        await addUserSkill(
          skill.id,
          type
        );

      setMySkills((current) => [
        ...current,
        newUserSkill,
      ]);

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

      if (type === "teach") {
        setOtherTeach("");
      } else {
        setOtherLearn("");
      }

      return;
    }


    await toggleSkill(
      value,
      type
    );


    if (type === "teach") {
      setOtherTeach("");
    } else {
      setOtherLearn("");
    }
  };


  const teachSkills =
    mySkills.filter(
      (skill) =>
        skill.skill_type === "teach"
    );


  const learnSkills =
    mySkills.filter(
      (skill) =>
        skill.skill_type === "learn"
    );


  // ---------------- AVAILABILITY ----------------

  const handleSlotSubmit = async (
    e: FormEvent
  ) => {

    e.preventDefault();


    if (
      !slotForm.start_time ||
      !slotForm.end_time
    ) {

      alert(
        "Please enter the start and end time."
      );

      return;
    }


    if (
      slotForm.start_time >=
      slotForm.end_time
    ) {

      alert(
        "End time must be after start time."
      );

      return;
    }


    try {

      // EDIT

      if (editingId !== null) {

        const updatedSlot =
          await updateAvailability(
            editingId,
            slotForm.day,
            slotForm.start_time,
            slotForm.end_time
          );

        setSlots((current) =>
          current.map((slot) =>
            slot.id === editingId
              ? updatedSlot
              : slot
          )
        );

        setEditingId(null);
      }


      // ADD

      else {

        const newSlot =
          await addAvailability(
            slotForm.day,
            slotForm.start_time,
            slotForm.end_time
          );

        setSlots((current) => [
          ...current,
          newSlot,
        ]);
      }


      setSlotForm({
        day: "monday",
        start_time: "",
        end_time: "",
      });


    } catch (error) {
      console.error(error);
    }
  };


  const startEditingSlot = (
    slot: AvailabilitySlot
  ) => {

    setEditingId(slot.id);

    setSlotForm({
      day: slot.day,
      start_time: slot.start_time,
      end_time: slot.end_time,
    });
  };


  const removeSlot = async (
    id: number
  ) => {

    try {

      await deleteAvailability(id);

      setSlots((current) =>
        current.filter(
          (slot) =>
            slot.id !== id
        )
      );


      if (editingId === id) {
        cancelEdit();
      }


    } catch (error) {
      console.error(error);
    }
  };


  const cancelEdit = () => {

    setEditingId(null);

    setSlotForm({
      day: "monday",
      start_time: "",
      end_time: "",
    });
  };


  // ---------------- PAGE ----------------

  return (
    <main className="profile-page">

      <div className="profile-container">


        {/* TOP LINKS */}

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "24px",
          }}
        >

          <Link
            to="/dashboard"
            style={{
              textDecoration: "none",
              color: "#4f46e5",
              fontWeight: 600,
            }}
          >
            ← Back to Dashboard
          </Link>


          <Link
            to="/meetings"
            style={{
              textDecoration: "none",
              color: "#2563eb",
              fontWeight: 600,
            }}
          >
            🎥 Meetings →
          </Link>

        </div>


        {/* HEADER */}

        <header className="profile-header">

          <div>

            <p className="small-title">
              SKILLMATCH
            </p>

            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
              <h1>
                {username || "Profile"}
              </h1>

              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  background: 'rgba(255, 255, 255, 0.95)',
                  padding: '0.35rem 0.85rem',
                  borderRadius: '20px',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                  border: '1px solid #e2e8f0',
                  fontSize: '0.9rem',
                  fontWeight: 650,
                  margin: '0.25rem 0',
                }}
              >
                {ratingCount > 0 ? (
                  <>
                    <span style={{ color: '#f59e0b', fontSize: '1.1rem' }}>★</span>
                    <span style={{ color: '#1e293b', fontWeight: 700 }}>{ratingAverage.toFixed(1)}</span>
                    <span style={{ color: '#64748b', fontSize: '0.8rem' }}>({ratingCount} review{ratingCount === 1 ? '' : 's'})</span>
                  </>
                ) : (
                  <span style={{ color: '#2563eb', fontSize: '0.82rem' }}>★ New Member</span>
                )}
              </div>
            </div>

            <p>
              Manage your skills and
              availability.
            </p>

          </div>

        </header>


        {/* ABOUT */}

        <section className="profile-card">

          <div className="section-heading">

            <h2>
              About Me
            </h2>

            <p>
              Write a short introduction
              about yourself.
            </p>

          </div>


          <textarea
            className="bio-input"
            value={bio}
            onChange={(e) =>
              setBio(e.target.value)
            }
            placeholder="Tell others about yourself..."
          />

        </section>


        {/* TEACH */}

        <section className="profile-card">

          <div className="section-heading">

            <h2>
              Skills I Can Teach
            </h2>

            <p>
              Choose the skills you can teach.
            </p>

          </div>


          <div className="skills-grid">

            {defaultSkills.map(
              (skill) => (

                <button
                  key={skill}
                  type="button"
                  className={
                    hasSkill(
                      skill,
                      "teach"
                    )
                      ? "skill-chip selected"
                      : "skill-chip"
                  }
                  onClick={() =>
                    toggleSkill(
                      skill,
                      "teach"
                    )
                  }
                >

                  {hasSkill(
                    skill,
                    "teach"
                  )
                    ? "✓ "
                    : ""}

                  {skill}

                </button>

              )
            )}

          </div>


          <div className="other-skill">

            <input
              type="text"
              placeholder="Other skill..."
              value={otherTeach}
              onChange={(e) =>
                setOtherTeach(
                  e.target.value
                )
              }
            />


            <button
              type="button"
              onClick={() =>
                addOtherSkill("teach")
              }
            >
              + Add
            </button>

          </div>


          {teachSkills.length > 0 && (

            <div className="selected-area">

              <p>
                Selected:
              </p>


              <div className="selected-list">

                {teachSkills.map(
                  (skill) => (

                    <span
                      key={skill.id}
                      className="selected-tag"
                    >

                      {skill.skill_name}

                      <button
                        type="button"
                        onClick={() =>
                          toggleSkill(
                            skill.skill_name,
                            "teach"
                          )
                        }
                      >
                        ×
                      </button>

                    </span>

                  )
                )}

              </div>

            </div>

          )}

        </section>


        {/* LEARN */}

        <section className="profile-card">

          <div className="section-heading">

            <h2>
              Skills I Want to Learn
            </h2>

            <p>
              Choose the skills you want
              to learn.
            </p>

          </div>


          <div className="skills-grid">

            {defaultSkills.map(
              (skill) => (

                <button
                  key={skill}
                  type="button"
                  className={
                    hasSkill(
                      skill,
                      "learn"
                    )
                      ? "skill-chip selected"
                      : "skill-chip"
                  }
                  onClick={() =>
                    toggleSkill(
                      skill,
                      "learn"
                    )
                  }
                >

                  {hasSkill(
                    skill,
                    "learn"
                  )
                    ? "✓ "
                    : ""}

                  {skill}

                </button>

              )
            )}

          </div>


          <div className="other-skill">

            <input
              type="text"
              placeholder="Other skill..."
              value={otherLearn}
              onChange={(e) =>
                setOtherLearn(
                  e.target.value
                )
              }
            />


            <button
              type="button"
              onClick={() =>
                addOtherSkill("learn")
              }
            >
              + Add
            </button>

          </div>


          {learnSkills.length > 0 && (

            <div className="selected-area">

              <p>
                Selected:
              </p>


              <div className="selected-list">

                {learnSkills.map(
                  (skill) => (

                    <span
                      key={skill.id}
                      className="selected-tag"
                    >

                      {skill.skill_name}

                      <button
                        type="button"
                        onClick={() =>
                          toggleSkill(
                            skill.skill_name,
                            "learn"
                          )
                        }
                      >
                        ×
                      </button>

                    </span>

                  )
                )}

              </div>

            </div>

          )}

        </section>


        {/* AVAILABILITY */}

        <section className="profile-card">

          <div className="section-heading">

            <h2>
              Available Slots
            </h2>

            <p>
              Add the time slots when
              you are available.
            </p>

          </div>


          {/* MAX SESSION */}

          <div className="session-duration-box">

            <div>

              <h3>
                Maximum Session Duration
              </h3>

              <p>
                Sessions can be shorter,
                but cannot be longer than
                this duration.
              </p>

            </div>


            <div className="session-duration-control">

              <select
                value={maxSessionDuration}
                onChange={(e) =>
                  setMaxSessionDuration(
                    Number(
                      e.target.value
                    )
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

            </div>

          </div>


          {/* AVAILABILITY FORM */}

          <form
            className="availability-form"
            onSubmit={handleSlotSubmit}
          >

            <div className="form-group">

              <label>
                Day
              </label>

              <select
                value={slotForm.day}
                onChange={(e) =>
                  setSlotForm({
                    ...slotForm,
                    day: e.target.value,
                  })
                }
              >

                <option value="monday">
                  Monday
                </option>

                <option value="tuesday">
                  Tuesday
                </option>

                <option value="wednesday">
                  Wednesday
                </option>

                <option value="thursday">
                  Thursday
                </option>

                <option value="friday">
                  Friday
                </option>

                <option value="saturday">
                  Saturday
                </option>

                <option value="sunday">
                  Sunday
                </option>

              </select>

            </div>


            <div className="form-group">

              <label>
                Start Time
              </label>

              <input
                type="time"
                value={
                  slotForm.start_time
                }
                onChange={(e) =>
                  setSlotForm({
                    ...slotForm,
                    start_time:
                      e.target.value,
                  })
                }
              />

            </div>


            <div className="form-group">

              <label>
                End Time
              </label>

              <input
                type="time"
                value={
                  slotForm.end_time
                }
                onChange={(e) =>
                  setSlotForm({
                    ...slotForm,
                    end_time:
                      e.target.value,
                  })
                }
              />

            </div>


            <div className="availability-actions">

              <button
                type="submit"
                className="primary-button"
              >

                {editingId !== null
                  ? "Save Changes"
                  : "+ Add Slot"}

              </button>


              {editingId !== null && (

                <button
                  type="button"
                  className="secondary-button"
                  onClick={cancelEdit}
                >
                  Cancel
                </button>

              )}

            </div>

          </form>


          {/* SAVED SLOTS */}

          <div className="slots-list">

            {slots.length === 0 ? (

              <div className="empty-state">
                No available slots yet.
              </div>

            ) : (

              slots.map((slot) => (

                <div
                  className="slot-card"
                  key={slot.id}
                >

                  <div>

                    <strong>

                      {slot.day
                        .charAt(0)
                        .toUpperCase() +
                        slot.day.slice(1)}

                    </strong>

                    <span>
                      {slot.start_time}
                      {" - "}
                      {slot.end_time}
                    </span>

                  </div>


                  <div className="slot-buttons">

                    <button
                      type="button"
                      className="edit-button"
                      onClick={() =>
                        startEditingSlot(
                          slot
                        )
                      }
                    >
                      Edit
                    </button>


                    <button
                      type="button"
                      className="delete-button"
                      onClick={() =>
                        removeSlot(
                          slot.id
                        )
                      }
                    >
                      Delete
                    </button>

                  </div>

                </div>

              ))

            )}

          </div>

        </section>


        {/* SAVE PROFILE AT BOTTOM */}

        <div className="profile-save-footer">

          {message && (
            <p className="profile-message">
              {message}
            </p>
          )}


          <button
            type="button"
            className="primary-button save-profile-button"
            onClick={saveProfile}
            disabled={profileSaving}
          >

            {profileSaving
              ? "Saving..."
              : "Save Profile"}

          </button>

        </div>


      </div>

    </main>
  );
}


export default Profile;