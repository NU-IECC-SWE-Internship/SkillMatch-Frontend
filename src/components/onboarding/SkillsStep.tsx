import { useState } from "react";
import type { FormEvent } from "react";

import {
  getSkills,
  getMySkills,
  createSkill,
  addUserSkill,
} from "../../api/profileApi";

const suggestedSkills = [
  "Python",
  "JavaScript",
  "React",
  "Django",
  "Machine Learning",
  "Data Analysis",
  "Figma",
  "UI/UX",
];

interface Props {
  type: "teach" | "learn";
  onNext: () => void;
}

export default function SkillsStep({ type, onNext }: Props) {
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [otherSkill, setOtherSkill] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function toggleSkill(skill: string) {
    if (selectedSkills.includes(skill)) {
      setSelectedSkills(
        selectedSkills.filter((item) => item !== skill)
      );
    } else {
      setSelectedSkills([...selectedSkills, skill]);
    }
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

    setSelectedSkills([...selectedSkills, newSkill]);
    setOtherSkill("");
    setError("");
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
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
            item.name.toLowerCase() === skillName.toLowerCase()
        );

        if (!skill) {
          skill = await createSkill(skillName);
        }

        const alreadyAdded = mySkills.some(
          (item) =>
            item.skill === skill.id &&
            item.skill_type === type
        );

        if (!alreadyAdded) {
          await addUserSkill(skill.id, type);
        }
      }

      onNext();
    } catch {
      setError("Could not save your skills.");
    } finally {
      setLoading(false);
    }
  }

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
        <div className="skills-list">
          {suggestedSkills.map((skill) => (
            <button
              key={skill}
              type="button"
              className={`skill-chip ${
                selectedSkills.includes(skill)
                  ? "selected"
                  : ""
              }`}
              onClick={() => toggleSkill(skill)}
            >
              {selectedSkills.includes(skill) ? "✓ " : ""}
              {skill}
            </button>
          ))}

          {selectedSkills
            .filter(
              (skill) => !suggestedSkills.includes(skill)
            )
            .map((skill) => (
              <button
                key={skill}
                type="button"
                className="skill-chip selected"
                onClick={() => toggleSkill(skill)}
              >
                ✓ {skill}
              </button>
            ))}
        </div>

        <div className="other-skill-row">
          <input
            type="text"
            value={otherSkill}
            onChange={(event) =>
              setOtherSkill(event.target.value)
            }
            placeholder="Other skill"
          />

          <button
            type="button"
            className="add-skill-button"
            onClick={addOtherSkill}
          >
            Add
          </button>
        </div>

        {error && (
          <p className="form-error">{error}</p>
        )}

        <button type="submit" disabled={loading}>
          {loading ? "Saving..." : "Continue"}
        </button>
      </form>
    </div>
  );
}