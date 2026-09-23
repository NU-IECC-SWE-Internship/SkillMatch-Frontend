export interface Match {
  user_id: number;
  username: string;
  teach_me: string[];
  teach_them: string[];
  rating_average?: number;
  rating_count?: number;
}

export interface SkillItem {
  id: number;
  name: string;
}