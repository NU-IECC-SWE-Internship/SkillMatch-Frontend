export interface MatchSkill {
  name: string;
  is_verified: boolean;
}

export interface Match {
  user_id: number;
  username: string;
  teach_me: MatchSkill[];
  teach_them: MatchSkill[];
  rating_average?: number;
  rating_count?: number;
}

export interface SkillItem {
  id: number;
  name: string;
}
