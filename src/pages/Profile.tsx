import { useEffect, useState } from "react";
import type { FormEvent } from "react";

import {
  getProfile,
  updateProfile,
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


function Profile() {
  // PROFILE
  const [bio, setBio] = useState("");
  const [profileSaving, setProfileSaving] = useState(false);
  const [message, setMessage] = useState("");

  // SKILLS
  const [skills, setSkills] = useState<Skill[]>([]);
  const [mySkills, setMySkills] = useState<UserSkill[]>([]);

  const [otherTeach, setOtherTeach] = useState("");
  const [otherLearn, setOtherLearn] = useState("");

  // AVAILABILITY
  const [slots, setSlots] = useState<AvailabilitySlot[]>([]);
  const [editingId, setEditingId] = useState<number | null>(null);

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

        setBio(profileData.bio || "");
        setSkills(skillsData);
        setMySkills(mySkillsData);
        setSlots(availabilityData);
      } catch (error) {
        console.error(error);
      }
    }

    loadData();
  }, []);



  const saveProfile = async () => {
    try {
      setProfileSaving(true);
      setMessage("");

      await updateProfile(bio);

      setMessage("Profile saved successfully.");
    } catch (error) {
      console.error(error);
      setMessage("Could not save profile.");
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

    const newSkill = await createSkill(skillName);

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
      const existingUserSkill = mySkills.find(
        (item) =>
          item.skill_name.toLowerCase() ===
            skillName.toLowerCase() &&
          item.skill_type === type
      );

      // DELETE
      if (existingUserSkill) {
        await deleteUserSkill(existingUserSkill.id);

        setMySkills((current) =>
          current.filter(
            (item) =>
              item.id !== existingUserSkill.id
          )
        );

        return;
      }

      // ADD
      const skill =
        await findOrCreateSkill(skillName);

      const newUserSkill = await addUserSkill(
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

    if (!value) return;

    if (hasSkill(value, type)) {
      if (type === "teach") {
        setOtherTeach("");
      } else {
        setOtherLearn("");
      }

      return;
    }

    await toggleSkill(value, type);

    if (type === "teach") {
      setOtherTeach("");
    } else {
      setOtherLearn("");
    }
  };


  const teachSkills = mySkills.filter(
    (skill) => skill.skill_type === "teach"
  );

  const learnSkills = mySkills.filter(
    (skill) => skill.skill_type === "learn"
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
      slotForm.start_time >= slotForm.end_time
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


  const removeSlot = async (id: number) => {
    try {
      await deleteAvailability(id);

      setSlots((current) =>
        current.filter(
          (slot) => slot.id !== id
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

        <header className="profile-header">
          <div>
            <p className="small-title">
              SKILLMATCH
            </p>

            <h1>My Profile</h1>

            <p>
              Manage your skills and
              availability.
            </p>
          </div>
        </header>


        {/* ABOUT */}

        <section className="profile-card">

          <div className="section-heading">
            <h2>About Me</h2>

            <p>
              Write a short introduction about
              yourself.
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

          <button
            type="button"
            className="primary-button"
            onClick={saveProfile}
            disabled={profileSaving}
          >
            {profileSaving
              ? "Saving..."
              : "Save Profile"}
          </button>

          {message && (
            <p className="profile-message">
              {message}
            </p>
          )}

        </section>


        {/* TEACH */}

        <section className="profile-card">

          <div className="section-heading">
            <h2>Skills I Can Teach</h2>

            <p>
              Choose the skills you can teach.
            </p>
          </div>

          <div className="skills-grid">

            {defaultSkills.map((skill) => (

              <button
                key={skill}
                type="button"
                className={
                  hasSkill(skill, "teach")
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
                {hasSkill(skill, "teach")
                  ? "✓ "
                  : ""}

                {skill}

              </button>

            ))}

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

              <p>Selected:</p>

              <div className="selected-list">

                {teachSkills.map((skill) => (

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

                ))}

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
              Choose the skills you want to
              learn.
            </p>

          </div>


          <div className="skills-grid">

            {defaultSkills.map((skill) => (

              <button
                key={skill}
                type="button"
                className={
                  hasSkill(skill, "learn")
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

                {hasSkill(skill, "learn")
                  ? "✓ "
                  : ""}

                {skill}

              </button>

            ))}

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

              <p>Selected:</p>

              <div className="selected-list">

                {learnSkills.map((skill) => (

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

                ))}

              </div>

            </div>

          )}

        </section>


        {/* AVAILABILITY */}

        <section className="profile-card">

          <div className="section-heading">

            <h2>Available Slots</h2>

            <p>
              Add the time slots when you are
              available.
            </p>

          </div>


          <form
            className="availability-form"
            onSubmit={handleSlotSubmit}
          >

            <div className="form-group">

              <label>Day</label>

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

              <label>Start Time</label>

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

              <label>End Time</label>

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
                      {slot.start_time} -{" "}
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
                        removeSlot(slot.id)
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

      </div>

    </main>
  );
}

export default Profile;