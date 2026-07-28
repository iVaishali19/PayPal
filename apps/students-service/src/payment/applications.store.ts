import { Injectable } from '@nestjs/common';

export interface Application {
  id: number;
  applicationId: string;
  studentId: string;
  universityId: string;
  amount: string;
  currency: string;
  paymentStatus: 'UNPAID' | 'PAID';
}

// A tiny in-memory "database" of student applications, seeded with a couple
// of rows. In a real service this would be PostgreSQL/MongoDB. Kept in memory
// so the tutorial runs without a second database.
@Injectable()
export class ApplicationsStore {
  private readonly applications = new Map<number, Application>();

  constructor() {
    this.seed({ id: 42, studentId: 'student-42', universityId: 'univ-1', amount: '500.00' });
    this.seed({ id: 7, studentId: 'student-7', universityId: 'univ-2', amount: '150.00' });
  }

  private seed(data: { id: number; studentId: string; universityId: string; amount: string }) {
    this.applications.set(data.id, {
      id: data.id,
      applicationId: `APP-${data.id}`,
      studentId: data.studentId,
      universityId: data.universityId,
      amount: data.amount,
      currency: 'USD',
      paymentStatus: 'UNPAID',
    });
  }

  findById(id: number): Application | undefined {
    return this.applications.get(id);
  }

  markPaid(referenceId: string) {
    const id = Number(referenceId);
    const app = this.applications.get(id);
    if (app) {
      app.paymentStatus = 'PAID';
      this.applications.set(id, app);
    }
    return app;
  }
}
