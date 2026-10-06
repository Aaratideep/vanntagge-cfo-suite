import { Injectable } from '@nestjs/common';

@Injectable()
export class LeadsService {
  private leads = [];

  async create(leadDto: any) {
    const lead = { ...leadDto, id: `lead-${Date.now()}`, createdAt: new Date() };
    this.leads.push(lead);
    return lead;
  }

  async findAll() {
    return this.leads;
  }

  async findOne(id: string) {
    return this.leads.find((l) => l.id === id);
  }

  async update(id: string, updateDto: any) {
    const idx = this.leads.findIndex((l) => l.id === id);
    if (idx !== -1) {
      this.leads[idx] = { ...this.leads[idx], ...updateDto, updatedAt: new Date() };
      return this.leads[idx];
    }
    return null;
  }

  async remove(id: string) {
    const idx = this.leads.findIndex((l) => l.id === id);
    if (idx !== -1) {
      const deleted = this.leads[idx];
      this.leads = this.leads.filter((l) => l.id !== id);
      return deleted;
    }
    return null;
  }
}
