import { Injectable } from '@nestjs/common';
import { Connection } from 'typeorm';
import { tableQueries } from './table-queries'; // Import the SQL queries

@Injectable()
export class SqliteTableCreationService {
  constructor(private readonly connection: Connection) {}

  async createTablesAndViews() {
    console.log('Creating tables and views...');

    // Loop through each table query and execute
    for (const [tableName, query] of Object.entries(tableQueries)) {
      try {
        console.log(`Creating table or view: ${tableName}`);
        await this.connection.query(query);
      } catch (error) {
        console.error(`Error creating table ${tableName}:`, error);
      }
    }
    
    console.log('Tables and views created successfully');
  }

  
}
