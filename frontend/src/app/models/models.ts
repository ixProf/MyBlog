export interface BlogPost {
  id: number;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  tags: string;
  relatedPostIds?: string;
  readTimeMinutes: number;
  publishedAt: string;
  updatedAt?: string;
}

export interface AcademicNote {
  id: number;
  subject: string;
  title: string;
  slug: string;
  order: number;
  content: string;
  updatedAt: string;
}

export interface GroupedSubject {
  subject: string;
  count: number;
  notes: {
    id: number;
    subject: string;
    title: string;
    slug: string;
    order: number;
    updatedAt: string;
  }[];
}

export type QuestionStatus = 'pending' | 'answered' | 'dismissed';

export interface Question {
  id: string;
  question_text: string;
  answer_text: string | null;
  status: QuestionStatus;
  is_anonymous: boolean;
  asker_name: string;
  likes_count: number;
  parent_id?: string | null;
  parent_question_text?: string | null;
  display_number?: number | null;
  created_at: string;
  answered_at: string | null;

  // Optional compatibility fields
  questionText?: string;
  answerText?: string | null;
  askerName?: string;
  isAnswered?: boolean;
  createdAt?: string;
  answeredAt?: string | null;
}

export interface ProfileBio {
  alias_ar: string;
  alias_en: string;
  name_ar: string;
  name_en: string;
  bio_ar: string;
  bio_en: string;
  linkedin: string;
  github: string;
}

export interface QuestionSubmission {
  question_text: string;
  asker_name?: string;
  is_anonymous?: boolean;
  parent_id?: string | null;
}

export interface FeedStats {
  total_answered: number;
  total_likes: number;
  total_pending?: number;
}

export interface TocItem {
  id: string;
  text: string;
  level: number;
  children: TocItem[];
}

export interface PortfolioMetric {
  label: string;
  value: string;
}

export interface PortfolioProject {
  title: string;
  url: string;
  highlights: string;
  tags: string[];
}

export interface PortfolioExperience {
  role: string;
  company: string;
  location: string;
  period: string;
  details: string;
}

export interface SkillCategory {
  category: string;
  items: string[];
}

export interface PortfolioData {
  name: string;
  alias: string;
  title: string;
  location: string;
  summary: string;
  metrics: PortfolioMetric[];
  projects: PortfolioProject[];
  experience: PortfolioExperience[];
  technicalSkills: SkillCategory[];
  education: {
    institution: string;
    degree: string;
    period: string;
    location: string;
  };
  training: {
    program: string;
    track: string;
    period: string;
  }[];
  links: {
    linkedIn: string;
    gitHub: string;
  };
}

export interface AuthState {
  token: string | null;
  username: string | null;
  displayName: string | null;
  isAdmin: boolean;
}
