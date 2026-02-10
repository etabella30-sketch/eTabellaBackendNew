import { Injectable } from '@nestjs/common';
import { join } from 'path';
type Post = {
    id: number
    title: string
  };
  
  type Data = {
    posts: Post[]
  };


@Injectable()
export class LowdbService {
    private dbs = new Map<string, any>();
    defaultData: Data = {
        posts: [],
    }
    private async getDb(filename: string): Promise<any> {
        if (!this.dbs.has(filename)) {
            const file = join(__dirname, `${filename}.json`);
            // Dynamically import the Lowdb libraries as they are ES Modules
            const { Low } = await import('lowdb');

            const {  JSONFile } = await import('JSONFile');

            const adapter = new JSONFile(file,this.defaultData);
            const db = new Low(adapter,{});

            await db.read();
            db.data ||= { entries: [] };
            await db.write();

            this.dbs.set(filename, db);
        }
        return this.dbs.get(filename);
    }

    // The rest of your service methods remain the same
    async getAllEntries(filename: string) {
        const db = await this.getDb(filename);
        await db.read();
        return db.data.entries;
    }

    async addEntry(filename: string, entry: any) {
        const db = await this.getDb(filename);
        db.data.entries.push(entry);
        await db.write();
    }

    async deleteEntry(filename: string, id: number) {
        const db = await this.getDb(filename);
        db.data.entries = db.data.entries.filter(entry => entry.id !== id);
        await db.write();
    }

    async updateEntry(filename: string, id: number, newValues: any) {
        const db = await this.getDb(filename);
        const entry = db.data.entries.find(entry => entry.id === id);
        if (entry) {
            Object.assign(entry, newValues);
            await db.write();
        }
    }
}
