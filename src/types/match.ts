export interface Match {
  user_id: number;
  username: string;
  teach_me: string[];
  teach_them: string[];
}

export interface SkillItem {
  id: number;
  name: string;
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