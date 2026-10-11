import { useEffect, useState } from "react";
import type { FormEvent } from "react";

import {
  getSkills,
  getMySkills,
  createSkill,
  addUserSkill,
} from "../../api/profileApi";

import type { Skill } from "../../api/profileApi";

interface Props {
  type: "teach" | "learn";
  onNext: () => void;
}

export default function SkillsStep({ type, onNext }: Props) {
  const [skills, setSkills] = useState<Skill[]>([]);
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [selectedSkillId, setSelectedSkillId] = useState("");
  const [otherSkill, setOtherSkill] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [skillsLoading, setSkillsLoading] = useState(true);

  useEffect(() => {
    async function loadSkills() {
      try {
        const data = await getSkills();

        setSkills(
          data.filter((skill) => skill.is_approved !== false)
        );
      } catch {
        setError("Could not load skills.");
      } finally {
        setSkillsLoading(false);
      }
    }

    loadSkills();
  }, []);

  function addExistingSkill() {
    if (!selectedSkillId) {
      return;
    }

    const skill = skills.find(
      (item) => item.id === Number(selectedSkillId)
    );

    if (!skill) {
      return;
    }

    const alreadySelected = selectedSkills.some(
      (item) =>
        item.toLowerCase() === skill.name.toLowerCase()
    );

    if (alreadySelected) {
      setError("This skill is already selected.");
      return;
    }

    setSelectedSkills([
      ...selectedSkills,
      skill.name,
    ]);

    setSelectedSkillId("");
    setError("");
  }

  function addOtherSkill() {
    const newSkill = otherSkill.trim();

    if (!newSkill) {
      return;
    }

    const alreadySelected = selectedSkills.some(
      (skill) =>
        skill.toLowerCase() === newSkill.toLowerCase()
    );

    if (alreadySelected) {
      setError("This skill is already selected.");
      return;
    }

    const existingSkill = skills.find(
      (skill) =>
        skill.name.toLowerCase() === newSkill.toLowerCase()
    );

    if (existingSkill) {
      setError(
        `"${existingSkill.name}" already exists. Please select it from the dropdown.`
      );
      return;
    }

    setSelectedSkills([
      ...selectedSkills,
      newSkill,
    ]);

    setOtherSkill("");
    setError("");
  }

  function removeSkill(skillName: string) {
    setSelectedSkills(
      selectedSkills.filter(
        (skill) => skill !== skillName
      )
    );
  }

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (selectedSkills.length === 0) {
      setError("Please choose at least one skill.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const allSkills = await getSkills();
      const mySkills = await getMySkills();

      for (const skillName of selectedSkills) {
        let skill = allSkills.find(
          (item) =>
            item.name.toLowerCase() ===
            skillName.toLowerCase()
        );

        if (!skill) {
          if (type === "learn") {
            continue;
          }

          skill = await createSkill(skillName);
        }

        const alreadyAdded = mySkills.some(
          (item) =>
            item.skill === skill.id &&
            item.skill_type === type
        );

        if (!alreadyAdded) {
          await addUserSkill(
            skill.id,
            type
          );
        }
      }

      onNext();
    } catch {
      setError("Could not save your skills.");
    } finally {
      setLoading(false);
    }
  }

  const availableSkills = skills.filter(
    (skill) =>
      !selectedSkills.some(
        (selected) =>
          selected.toLowerCase() ===
          skill.name.toLowerCase()
      )
  );

  const title =
    type === "teach"
      ? "What can you teach?"
      : "What do you want to learn?";

  const description =
    type === "teach"
      ? "Choose the skills you feel comfortable teaching."
      : "Choose the skills you would like to learn.";

  return (
    <div>
      <h1>{title}</h1>

      <p>{description}</p>

      <form onSubmit={handleSubmit}>
        {selectedSkills.length > 0 && (
          <div className="skills-list">
            {selectedSkills.map((skill) => (
              <button
                key={skill}
                type="button"
                className="skill-chip selected"
                onClick={() =>
                  removeSkill(skill)
                }
              >
                ✓ {skill} ×
              </button>
            ))}
          </div>
        )}

        <div className="other-skill-row">
          <select
            value={selectedSkillId}
            onChange={(event) =>
              setSelectedSkillId(
                event.target.value
              )
            }
            disabled={skillsLoading}
          >
            <option value="">
              {skillsLoading
                ? "Loading skills..."
                : "Select a skill..."}
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
            type="button"
            className="add-skill-button"
            onClick={addExistingSkill}
            disabled={!selectedSkillId}
          >
            Add
          </button>
        </div>

        {type === "teach" && (
          <div className="other-skill-row">
            <input
              type="text"
              value={otherSkill}
              onChange={(event) =>
                setOtherSkill(
                  event.target.value
                )
              }
              placeholder="Request a new skill"
            />

            <button
              type="button"
              className="add-skill-button"
              onClick={addOtherSkill}
              disabled={!otherSkill.trim()}
            >
              Request
            </button>
          </div>
        )}

        {error && (
          <p className="form-error">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
        >
          {loading
            ? "Saving..."
            : "Continue"}
        </button>
      </form>
    </div>
  );
}