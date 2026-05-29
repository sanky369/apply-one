// Core data model for ApplyOne. See plan §5.

export type Link = { label: string; url: string };

export type Contact = {
  name: string;
  title?: string;
  email?: string;
  phone?: string;
  location?: string;
  links?: Link[];
};

export type Role = {
  company: string;
  title: string;
  location?: string;
  start?: string;
  end?: string;
  bullets: string[];
};

export type Project = {
  name: string;
  url?: string;
  stack?: string;
  bullets: string[];
};

export type SkillGroup = { group: string; items: string[] };

export type Education = { school: string; credential: string; year?: string };

export type MasterResume = {
  contact: Contact;
  summary: string;
  skills: SkillGroup[];
  experience: Role[];
  projects: Project[];
  education: Education[];
  certifications: string[];
  keywords: string[];
};

export type JobPosting = {
  url?: string;
  title: string;
  company: string;
  location?: string;
  description: string;
};

export type MatchScore = {
  score: number;
  matchedKeywords: string[];
  missingKeywords: string[];
  notes: string[];
};

export type ATSBreakdown = {
  formatting: number;
  keywords: number;
  clarity: number;
  quantification: number;
  structure: number;
};

export type ATSReport = {
  score: number;
  breakdown: ATSBreakdown;
  fixes: string[];
};

export type ColdEmail = { subject: string; body: string };

// A question the fixer needs answered before it can apply a fact-dependent fix.
export type FixQuestion = {
  id: string;
  question: string;
  // Optional hint about what kind of answer is expected.
  placeholder?: string;
};

export type FixAnswer = { id: string; question: string; answer: string };

export type ApplyFixesResult = {
  updatedResume: MasterResume;
  applied: string[];
  questions: FixQuestion[];
};

export type ApplicationPackage = {
  id: string;
  createdAt: number;
  job: JobPosting;
  tailoredResume: MasterResume;
  coverLetter: string;
  coldEmail: ColdEmail;
  match: MatchScore;
};

// A saved master-résumé working session, listed in History so the front page
// can always start fresh while past work stays reachable.
export type ResumeDraft = {
  id: string;
  createdAt: number;
  updatedAt: number;
  name: string;
  resume: MasterResume;
  report: ATSReport | null;
};

// The app-wide state machine (plan §4).
export type AppPhase =
  | "idle"
  | "parsing"
  | "ready"
  | "extracting-job"
  | "generating"
  | "results";

// Shape returned by the streaming /api/generate route, minus the persisted id.
export type GeneratedPackage = {
  tailoredResume: MasterResume;
  coverLetter: string;
  coldEmail: ColdEmail;
  matchScore: MatchScore;
};

// Helper: an empty master resume scaffold for safe rendering.
export function emptyResume(): MasterResume {
  return {
    contact: { name: "" },
    summary: "",
    skills: [],
    experience: [],
    projects: [],
    education: [],
    certifications: [],
    keywords: [],
  };
}
