export interface MatchSkill {
  name: string;
  is_verified: boolean;
  is_matching?: boolean;
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
  // True when it's a skill the current user wants to learn
  wanted?: boolean;
}

// A skill someone teaches, for the Browse Skills filter
export interface CatalogSkill {
  id: number;
  name: string;
  teacher_count: number;
  wanted: boolean;
}

export interface Teacher {
  user_id: number;
  username: string;
  skills: SkillItem[];
  rating_average?: number;
  rating_count?: number;
}

export interface TeachersResponse {
  learning_skills: SkillItem[];
  all_skills?: CatalogSkill[];
  teachers: Teacher[];
}
