import { Process, Processor } from '@nestjs/bull';
import { Job } from 'bull';

@Processor('feed-updates')
export class FeedProcessor {
  constructor(private readonly connection: any) {}  // Inject your database connection here

  @Process('update-feed')
  async handleFeedUpdate(job: Job) {
    const { nSesid, line_index, timestamp, line_number, page_number, formate, data } = job.data;

    const query = `
      INSERT INTO feed (nSesid, line_index, timestamp, line_number, page_number, formate, data, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, NULL)
      ON CONFLICT(nSesid, line_index) DO UPDATE SET
        line_index = excluded.line_index,
        timestamp = excluded.timestamp,
        line_number = excluded.line_number,
        page_number = excluded.page_number,
        formate = excluded.formate,
        data = excluded.data,
        updated_at = ?
    `;

    try {
      await this.connection.query(query, [
        nSesid,
        line_index || 0,
        timestamp || '',
        line_number || 0,
        page_number || 0,
        formate || '',
        JSON.stringify(data || []) || '[]',
        new Date().toISOString(),
        new Date().toISOString()
      ]);
    } catch (error) {
      console.error(`Failed to update data in feed:`, error);
    }
  }
}
