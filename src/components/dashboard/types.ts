export interface Project {
  id: string;
  name: string;
  description: string;
  status: 'active' | 'completed' | 'on-hold';
  clientName: string;
  category?: string;
  progress?: number;
  deadline?: string;
  visibility?: 'public' | 'private';
  allowedUsers?: string[];
  createdAt: any;
  goals?: string[];
  financials?: string;
  history?: string;
}

export interface Feature {
  id: string;
  key: string;
  projectId: string;
  sprintId?: string;
  title: string;
  description: string;
  status: 'todo' | 'in-progress' | 'review' | 'testing' | 'done';
  priority?: 'low' | 'medium' | 'high' | 'critical';
  category?: string;
  deadline?: string;
  testScenarios?: string;
  businessRules?: string;
  assignedTo?: string;
  reporter?: string;
  isValidated?: boolean;
  validatedBy?: string;
  tags?: string[];
  points?: number;
  type?: 'story' | 'task' | 'bug' | 'epic';
  parentId?: string;
}

export interface Sprint {
  id: string;
  projectId: string;
  name: string;
  goal?: string;
  startDate?: string;
  endDate?: string;
  status: 'planned' | 'active' | 'completed';
  createdAt: string;
}

export interface SprintReport {
  sprintId: string;
  totalPoints: number;
  completedPoints: number;
  dailyPointsRemaining: { date: string; points: number }[];
}

export interface Message {
  id: string;
  projectId: string;
  senderId: string;
  senderName: string;
  text: string;
  createdAt: any;
}

export interface TeamMemberSite {
  id: string;
  name: string;
  role: string;
  bio: string;
  photoURL?: string;
  linkedin?: string;
  github?: string;
  order?: number;
}

export interface SiteValues {
  mission: string;
  vision: string;
  values: { title: string; description: string }[];
}

export type ActiveTab =
  | 'overview'
  | 'projects'
  | 'summary'
  | 'backlog'
  | 'board'
  | 'timeline'
  | 'chat'
  | 'tests'
  | 'members'
  | 'portfolio'
  | 'team'
  | 'site-values'
  | 'blog'
  | 'cases';
