import type { Timestamp } from 'firebase/firestore';

export type UserRole = 'admin' | 'user';

export interface AppUser {
  uid: string;
  email: string | null;
  name: string | null;
  role: UserRole;
}

export type VisitReason = 'Research' | 'Study' | 'Borrowing';
export type College = 'CAS' | 'COE' | 'CBA';
export type VisitorType = 'Student' | 'Employee';

export interface Visit {
  id?: string;
  timestamp: Timestamp | Date | string;
  reason: VisitReason;
  college: College;
  visitorType: VisitorType;
  isEmployee: boolean;
}
