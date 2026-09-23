export interface MatchSkill {
  name: string;
  is_verified: boolean;
}

export interface Match {
  user_id: number;
  username: string;
  teach_me: MatchSkill[];
  teach_them: MatchSkill[];
  teach_me_ids?: number[];
  teach_them_ids?: number[];
  rating_average?: number;
  rating_count?: number;
}

export interface SkillItem {
  id: number;
  name: string;
  is_verified?: boolean;
}

export interface Teacher {
  user_id: number;
  username: string;
  skills: SkillItem[];
}

export interface TeachersResponse {
  learning_skills: SkillItem[];
  teachers: Teacher[];
}
