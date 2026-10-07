interface UserStatusBadgeProps {
  isActive: boolean;
  isStaff: boolean;
  onboardingCompleted: boolean;
}

/** Same rules as the backend status filter: deactivated > onboarding > active. */
export default function UserStatusBadge({
  isActive,
  isStaff,
  onboardingCompleted,
}: UserStatusBadgeProps) {
  if (!isActive) return <span className="admin-badge red">Deactivated</span>;
  if (!isStaff && !onboardingCompleted) {
    return (
      <span className="admin-badge amber" title="Signed up but hasn't finished setting up their profile">
        Onboarding
      </span>
    );
  }
  return <span className="admin-badge green">Active</span>;
}
