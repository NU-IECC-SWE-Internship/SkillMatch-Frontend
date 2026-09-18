import { useState } from "react";
import type { FormEvent } from "react";

import { updateProfile } from "../../api/profileApi";

interface Props {
  onNext: () => void;
}

export default function AboutMeStep({ onNext }: Props) {
  const [bio, setBio] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!bio.trim()) {
      setError("Please write something about yourself.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      await updateProfile(bio.trim());
      onNext();
    } catch {
      setError("Could not save your profile.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <h1>Tell us about yourself</h1>

      <p>Write a short introduction about yourself.</p>

      <form onSubmit={handleSubmit}>
        <textarea
          value={bio}
          onChange={(event) => setBio(event.target.value)}
          placeholder="Write something about yourself..."
          rows={6}
        />

        {error && <p>{error}</p>}

        <button type="submit" disabled={loading}>
          {loading ? "Saving..." : "Continue"}
        </button>
      </form>
    </div>
  );
}