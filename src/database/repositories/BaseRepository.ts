import { Document, Model } from "mongoose";

export abstract class BaseRepository<T extends Document> {
  constructor(protected model: Model<T>) {}

  async create(data: Partial<T>): Promise<T> {
    return await this.model.create(data);
  }

  async findById(id: string): Promise<T | null> {
    return await this.model.findById(id);
  }

  async findOne(filter: Partial<T>): Promise<T | null> {
    return await this.model.findOne(filter as any);
  }

  async find(filter: Partial<T> = {}, limit?: number): Promise<T[]> {
    const query = this.model.find(filter as any);
    if (limit) query.limit(limit);
    return await query;
  }

  async updateOne(filter: Partial<T>, update: Partial<T>): Promise<T | null> {
    return await this.model.findOneAndUpdate(filter as any, update as any, {
      new: true,
      upsert: false,
    });
  }

  async upsert(filter: Partial<T>, update: Partial<T>): Promise<T> {
    return await this.model.findOneAndUpdate(filter as any, update as any, {
      new: true,
      upsert: true,
    });
  }

  async deleteOne(filter: Partial<T>): Promise<boolean> {
    const result = await this.model.deleteOne(filter as any);
    return result.deletedCount > 0;
  }

  async count(filter: Partial<T> = {}): Promise<number> {
    return await this.model.countDocuments(filter as any);
  }
}
