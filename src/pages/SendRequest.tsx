import { useState } from "react";
import { useParams } from "react-router-dom";
import "./SendRequest.css";

interface AvailabilitySlot {
  id: number;
  day: string;
  time: string;
}

function SendRequest() {
  const { userId } = useParams();

  const [selectedSkill, setSelectedSkill] = useState<string | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<number | null>(null);

  // Temporary data
  const user = {
    username: "Sara",
    canTeachMe: ["React", "Figma"],
    iCanTeachThem: ["Python", "SQL"],
  };

  const availableSlots: AvailabilitySlot[] = [
    {
      id: 1,
      day: "Tuesday",
      time: "6:00 PM - 8:00 PM",
    },
    {
      id: 2,
      day: "Thursday",
      time: "4:00 PM - 6:00 PM",
    },
    {
      id: 3,
      day: "Saturday",
      time: "2:00 PM - 4:00 PM",
    },
  ];

  const handleSendRequest = () => {
    if (selectedSkill === null) {
      alert("Please select a skill you want to learn.");
      return;
    }

    if (selectedSlot === null) {
      alert("Please select a time slot.");
      return;
    }

    console.log("Sending request to user:", userId);
    console.log("Skill:", selectedSkill);
    console.log("Selected slot:", selectedSlot);

    alert("Match request sent!");
  };

  return (
    <main className="send-request-page">
      <div className="send-request-panel">
        <p className="send-request-brand">SkillMatch</p>

        <h1>Send Match Request</h1>

        <p className="send-request-intro">
          Choose one skill you want to learn from {user.username}.
        </p>

        <div className="user-section">
          <h2>{user.username}</h2>
        </div>

        <div className="skills-section">
          <div>
            <h3>They can teach you</h3>

            <div className="skill-list">
              {user.canTeachMe.map((skill) => (
                <button
                  type="button"
                  key={skill}
                  className={`skill-choice ${
                    selectedSkill === skill ? "selected" : ""
                  }`}
                  onClick={() => setSelectedSkill(skill)}
                >
                  {skill}
                </button>
              ))}
            </div>
          </div>

          <div>
            <h3>You can teach them</h3>

            <div className="skill-list">
              {user.iCanTeachThem.map((skill) => (
                <span className="skill-tag" key={skill}>
                  {skill}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="availability-section">
          <h2>Choose a time</h2>

          <div className="slot-list">
            {availableSlots.map((slot) => (
              <button
                type="button"
                key={slot.id}
                className={`slot-button ${
                  selectedSlot === slot.id ? "selected" : ""
                }`}
                onClick={() => setSelectedSlot(slot.id)}
              >
                <span>{slot.day}</span>
                <small>{slot.time}</small>
              </button>
            ))}
          </div>
        </div>

        <button
          type="button"
          className="send-request-button"
          onClick={handleSendRequest}
        >
          Send Request
        </button>
      </div>
    </main>
  );
}

export default SendRequest;