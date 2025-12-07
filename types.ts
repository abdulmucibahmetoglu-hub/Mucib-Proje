
export enum ProjectStatus {
  PLANNING = 'Planning',
  IN_PROGRESS = 'In Progress',
  ON_HOLD = 'On Hold',
  COMPLETED = 'Completed'
}

export enum TaskPriority {
  LOW = 'Low',
  MEDIUM = 'Medium',
  HIGH = 'High',
  CRITICAL = 'Critical'
}

export interface TaskHistory {
  id: string;
  date: string;
  action: string;
  user: string;
}

export interface Task {
  id: string;
  title: string;
  status: 'To Do' | 'In Progress' | 'Review' | 'Done';
  priority: TaskPriority;
  dueDate: string;
  startDate?: string; // Gantt için Başlangıç
  assignee?: string;
  description?: string;
  history?: TaskHistory[];
  weight?: number; // Pursantaj (0-100) - Proje genelindeki ağırlığı
}

export interface ProjectDocument {
  id: string;
  name: string;
  type: 'PDF' | 'EXCEL' | 'DWG' | 'IMAGE' | 'OTHER';
  url: string;
  uploadDate: string;
  size?: string;
}

export interface Project {
  id: string;
  name: string;
  location: string;
  status: ProjectStatus;
  progress: number; // 0-100
  budget: number;
  spent: number;
  startDate: string;
  endDate: string;
  description?: string;
  tasks?: Task[];
  documents?: ProjectDocument[];
  client?: string; // İdare / İşveren
  siteManager?: string; // Şantiye Şefi
  imageUrl?: string; // Proje Görseli
}

export interface DailyReport {
  id: string;
  projectId: string;
  projectName: string; // Denormalized for display
  date: string;
  weather: string;
  
  // Resources
  mpEmployer: string;
  mpSub: string;
  eqEmployer: string;
  eqSub: string;
  
  // Content
  rawContent: string; // The user's input notes
  formattedContent: string; // The AI generated/final report
  
  images?: string[]; // Report images
}

// --- Safety Types Updated ---

export interface RiskAnalysis {
  riskLevel: 'Low' | 'Medium' | 'High' | 'Critical';
  concerns: string[];
  recommendations: string[];
  ppe: string[]; // Kişisel Koruyucu Donanımlar
  requirements: string[]; // Ekipman ve Prosedür Gereksinimleri
}

export interface SafetyReport {
  id: string;
  projectName: string;
  location: string;
  date: string;
  preparedBy: string;
  jobDescription: string;
  analysis: RiskAnalysis;
}

// --- End Safety Types ---

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: Date;
}

// --- Financial Types Updated ---

export interface Subcontractor {
  id: string;
  name: string;
  taxId: string;
  trade: string; // e.g., 'Kaba İnşaat', 'Elektrik'
  phone?: string;
  email?: string;
  contactPerson?: string; // Yetkili Kişi
  rating?: number; // 0-10 Puanlama
  totalScore?: number; // Yılın taşeronu için kümülatif puan
  avatarUrl?: string; // Logo veya Yetkili Fotoğrafı
}

export interface ContractItem {
  id: string;
  code: string;
  description: string;
  unit: string;
  unitPrice: number;
}

export interface ContractClauses {
  paymentTerms: string;
  penaltyTerms: string;
  safetyTerms: string; // İSG
  terminationTerms: string; // Fesih
  qualityTerms: string;
  generalTerms: string;
}

export interface Contract {
  id: string;
  subcontractorId: string;
  projectId: string;
  items: ContractItem[];
  startDate: string;
  endDate: string;
  durationDays: number; // Calculated calendar days
  status: 'Taslak' | 'Aktif' | 'Tamamlandı' | 'Feshedildi';
  signedDocumentUrl?: string; // URL to uploaded PDF
  clauses?: ContractClauses;
}

export interface PaymentItemDetail {
  itemId: string;
  quantity: number;
  total: number;
}

export interface PaymentRecord {
  id: string;
  date: string; // Changed from month to full date usually, but keeping string for simplicity
  month: string; // Display label like 'Ocak 2024'
  amount: number;
  type: 'Idare' | 'Taseron';
  projectId?: string;
  subcontractorId?: string;
  items?: PaymentItemDetail[]; // For detailed subcontractor payments
}

// --- End Financial Types ---

export interface InventoryItem {
  id: string;
  name: string;
  sku: string;
  category: 'Malzeme' | 'El Aleti' | 'Ekipman';
  quantity: number;
  unit: string;
  location: string;
  status: 'Stokta' | 'Kritik Stok' | 'Zimmetli/Sahada';
  projectId?: string; // Hangi projeye ait
  unitPrice?: number; // Birim Fiyat
}

export interface PunchItem {
  id: string;
  title: string;
  location: string;
  status: 'Açık' | 'Çözüldü' | 'Onaylandı';
  severity: 'Düşük' | 'Orta' | 'Yüksek';
  assignee: string;
  imageUrl?: string;
  description?: string;
  date?: string;
}

// --- Tender (İhale) Types ---

export interface Tender {
  id: string;
  registrationNumber: string; // İKN (İhale Kayıt No)
  name: string;
  authority: string; // Kurum / İdare
  date: string; // İhale Tarihi
  time: string; // İhale Saati
  location: string;
  estimatedBudget: number; // Yaklaşık Maliyet (Tahmini)
  bondAmount: number; // Teminat Tutarı
  status: 'Hazırlık' | 'Teklif Verildi' | 'Kazanıldı' | 'Kaybedildi' | 'İptal';
  description?: string;
  analysis?: TenderAnalysis;
}

export interface TenderAnalysis {
  winProbability: number; // 0-100
  risks: string[];
  requiredDocuments: string[];
  strategy: string;
}

// --- Teams Types ---

export interface TeamMember {
  id: string;
  name: string;
  role: string;
  phone: string;
  email: string;
  status: 'Sahada' | 'Ofiste' | 'İzinli';
  avatarUrl?: string;
  skills: string[];
}

export type UserRole = 'Proje Müdürü' | 'Şantiye Şefi' | 'Saha Mühendisi';
