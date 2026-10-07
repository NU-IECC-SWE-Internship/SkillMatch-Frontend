import { useState } from "react";
import type { CSSProperties } from "react";
import { useNavigate } from "react-router-dom";

import AboutMeStep from "../components/onboarding/AboutMeStep";
import SkillsStep from "../components/onboarding/SkillsStep";
import AvailabilityStep from "../components/onboarding/AvailabilityStep";
import { completeOnboarding } from "../api/profileApi";
import { handleCursorGlow } from "../lib/cursorGlow";

import "./Onboarding.css";

const STEP_THEMES = ["violet", "teal", "blue", "amber"];

export default function Onboarding() {
  const [step, setStep] = useState(1);
  const navigate = useNavigate();

  const steps = [
    "About Me",
    "Teach",
    "Learn",
    "Availability",
  ];

  function nextStep() {
    setStep(step + 1);
  }

  async function finishOnboarding() {
    await completeOnboarding();
    navigate("/dashboard");
  }

  return (
    <main className="onboarding-page fx-backdrop" onPointerMove={handleCursorGlow}>
      <div className="onboarding-wrapper">

        <div className="onboarding-header fx-rise">
          <h1 className="onboarding-logo">SkillMatch</h1>
          <p>Let&apos;s build your profile</p>
        </div>

        <div
          className="progress-steps fx-rise fx-d1"
          style={
            {
              "--progress": `${((step - 1) / (steps.length - 1)) * 80}%`,
            } as CSSProperties
          }
        >
          {steps.map((name, index) => {
            const number = index + 1;

            return (
              <div
                key={name}
                className={`progress-step ${
                  step === number ? "active" : ""
                } ${
                  step > number ? "completed" : ""
                }`}
              >
                <div className="progress-circle">
                  {step > number ? "✓" : number}
                </div>

                <span>{name}</span>
              </div>
            );
          })}
        </div>

        <section
          key={step}
          className={`onboarding-card fx-glow fx-accent-top fx-pop fx-theme-${STEP_THEMES[step - 1]}`}
        >
          <p className="step-label">
            STEP {step} OF 4
          </p>

          {step === 1 && (
            <AboutMeStep onNext={nextStep} />
          )}

          {step === 2 && (
            <SkillsStep
              type="teach"
              onNext={nextStep}
            />
          )}

          {step === 3 && (
            <SkillsStep
              type="learn"
              onNext={nextStep}
            />
          )}

          {step === 4 && (
            <AvailabilityStep
              onFinish={finishOnboarding}
            />
          )}
        </section>

      </div>
    </main>
  );
}