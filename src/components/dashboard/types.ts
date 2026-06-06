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
  activities?: string;
  testCases?: string;
  testEvidence?: string;
  testObservations?: string;
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
  bio?: string;
  photoURL?: string;
  linkedin?: string;
  github?: string;
  instagram?: string;
  specialty?: string;
  formation?: string;
  curiosities?: string;
  hobbies?: string;
  location?: string;
  yearsExp?: number | null;
  // campos estruturados
  mission?: string;
  missionPublic?: boolean;
  responsibilities?: string;
  responsibilitiesPublic?: boolean;
  objectives?: string;
  objectivesPublic?: boolean;
  expectations?: string;
  expectationsPublic?: boolean;
  phrase?: string;
  phrasePublic?: boolean;
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
  | 'cases'
  | 'bot'
  | 'posts'
  | 'sales'
  | 'products'
  | 'client-contact';

// ─── Produtos / Planos ────────────────────────────────────────────────────────

export interface Product {
  id: string;
  name: string;
  description?: string;
  category: string;
  type: 'product' | 'plan' | 'service';
  price: number;
  currency: string;
  active: boolean;
  features?: string[];
  tags?: string[];
  createdAt: string;
}

// ─── Vendas ───────────────────────────────────────────────────────────────────

export type SaleStatus = 'lead' | 'negotiation' | 'won' | 'lost' | 'cancelled';
export type SalePaymentMethod = 'pix' | 'card' | 'boleto' | 'transfer' | 'cash' | 'other';

export interface Sale {
  id: string;
  clientName: string;
  clientEmail?: string;
  clientPhone?: string;
  productId: string;
  productName: string;
  productCategory: string;
  value: number;
  status: SaleStatus;
  paymentMethod?: SalePaymentMethod;
  notes?: string;
  origin?: string;
  closedAt?: string;
  createdAt: string;
  updatedAt?: string;
}

// ─── Mensagens Prontas / Contato ──────────────────────────────────────────────

export type MessageCategory =
  | 'approach'
  | 'followup'
  | 'proposal'
  | 'closing'
  | 'support'
  | 'onboarding'
  | 'recovery'
  | 'upsell'
  | 'general';

export interface ReadyMessage {
  id: string;
  userId?: string;
  title: string;
  category: MessageCategory;
  productId?: string;
  productName?: string;
  body: string;
  tags?: string[];
  isDefault?: boolean;
  isFavorite?: boolean;
  createdAt: string;
}

export type ContactStatus =
  | 'new'          // Novo — ainda não contactado
  | 'pending'      // Aguardando entrar em contato
  | 'contacted'    // Contatado (mensagem enviada)
  | 'no_answer'    // Não atendeu / não respondeu
  | 'callback'     // Pediu para ligar depois / retornar
  | 'interested'   // Demonstrou interesse
  | 'negotiation'  // Em negociação
  | 'won'          // Fechou / virou cliente
  | 'not_interested' // Não tem interesse
  | 'invalid'      // Número/contato inválido
  | 'closed';      // Encerrado sem conversão

export interface ClientContact {
  id: string;
  userId?: string;
  // Dados do cliente / estabelecimento
  clientName: string;
  establishmentName?: string;
  ownerName?: string;
  clientPhone?: string;
  clientPhone2?: string;
  clientEmail?: string;
  city?: string;
  segment?: string;
  // Relacionamentos
  saleId?: string;
  productName?: string;
  messageId?: string;
  messageTitle?: string;
  // Contato
  channel: 'whatsapp' | 'email' | 'phone' | 'other';
  status: ContactStatus;
  priority: 'low' | 'medium' | 'high';
  notes?: string;
  scheduledAt?: string;
  lastContactAt?: string;
  contactCount?: number;
  createdAt: string;
}
