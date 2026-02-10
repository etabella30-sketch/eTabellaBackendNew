import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectConnection } from '@nestjs/typeorm';
import { Connection } from 'typeorm';
import async from 'async';
import { CurrentJob } from '../../interfaces/session.interface';
import * as fs from 'fs';
import { UtilityService } from '../../utility/utility.service';
import { SqliteTableCreationService } from './sqlite-table-creation.service'; // Import the new service
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import { HttpService } from '@nestjs/axios';
import * as path from 'path';
import { promisify } from 'util'; // To work with promises for async fs
import { UuidService } from '../uuid/uuid.service';

@Injectable()
export class SqllitedbService implements OnModuleInit {
  private readonly queue;

  commandCounter: number = 0;
  logger: any = new Logger('SqllitedbService');
  constructor(@InjectConnection() private readonly connection: Connection, private utilityService: UtilityService,
    private readonly tableCreationService: SqliteTableCreationService, private config: ConfigService, private httpService: HttpService, private readonly uuid: UuidService) {
    // Create a queue with a concurrency of 1 (one task at a time)
    /*  this.queue = async.queue(async (task) => {
        try {
          // await task();  // Execute the task (which is an async function)
          this.printQuerylog(`Task execute: ${task.commandCounter} Method : ${task.method} `);
          if (task.method == 'FEED') {
            await this.updateFeedDataToSql(task.nSesid, task.line_index, task.timestamp, task.line_number, task.page_number, task.formate, task.data);
          } else if (task.method == 'DELETE') {
            await this.deleteDataInFeed(task.nSesid, task.startInd, task.endInd);
          }
          // if (callback) {
          //   callback(null);    // Call the callback to indicate task completion
          // }
  
        } catch (error) {
          console.error('Error processing task:', error);
          // if (callback) {
          //   callback(error);  // Call the callback with the error to indicate failure
          // }
        }
        return true;
      }, 1); // Concurrency 1*/

    this.queue = async.queue(async (task, callback) => {
      // this.printQuerylog(`Task execute: ${this.commandCounter} `);
      await task(); // Execute the task
      // this.printQuerylog(`Task End: ${this.commandCounter}`);
      callback();   // Notify the queue that the task is complete
    }, 1);
    this.queue.drain(() => {
      // console.warn("\n All tasks have been processed", new Date());
    });

  }



  async getPrimaryValue(tabel: string): Promise<{ key: string, value: string } | null> {
    try {
      
      const query = ` PRAGMA table_info('${tabel}') `; //`SELECT * FROM pragma_table_info('${tabel}') where pk = 1 and type = 'TEXT'`; //
      const data = await this.connection.query(query);
      const obj = data.find(a => a.pk == 1 && a.type == 'TEXT');
      if (obj) {
        return { key: obj.name, value: this.uuid.generateUUID() };
      }
    } catch (error) {
      this.logger.error(`Failed to get UUID from ${tabel}:`, error);
    }
    return null;

  }


  async insert(table: string, columns: { [key: string]: any }): Promise<number> {
    

    const primaryValue = await this.getPrimaryValue(table);
    let primaryKey = null;
    if (primaryValue) {
      columns[primaryValue.key] = primaryValue.value;
      primaryKey = primaryValue.value;
    }

    const keys = Object.keys(columns).join(', ');
    const values = Object.values(columns);



    const placeholders = values.map(() => '?').join(', ');
    const query = `INSERT INTO ${table} (${keys}) VALUES (${placeholders})`;
    try {
      await this.connection.query(query, values);
      if (primaryKey) {
        return primaryKey;
      } else {
        const result = await this.connection.query('SELECT last_insert_rowid() AS id');
        return result[0].id;
      }

    } catch (error) {
      console.error(`Failed to insert data into ${table}:`, error);
      return null;
    }
  }

  async insertMany(table: string, rows: { [key: string]: any }[]): Promise<string[]> {
    if (rows.length === 0) return [];

    // Check primary key info
    const primaryValue = await this.getPrimaryValue(table);

    // If primary key is TEXT-based and missing in some rows, add generated UUID
    if (primaryValue) {
      for (const row of rows) {
        if (!row.hasOwnProperty(primaryValue.key)) {
          row[primaryValue.key] = this.uuid.generateUUID();
        }
      }
    }

    const keys = Object.keys(rows[0]);
    const columns = keys.join(', ');
    const placeholders = `(${keys.map(() => '?').join(', ')})`;
    const query = `INSERT INTO ${table} (${columns}) VALUES ${rows.map(() => placeholders).join(', ')}`;

    const values = rows.flatMap(row => keys.map(key => row[key]));

    try {
      await this.connection.query(query, values);

      // Collect all generated UUIDs if applicable
      if (primaryValue) {
        return rows.map(row => row[primaryValue.key]);
      }

      // Otherwise return numeric row IDs
      const result = await this.connection.query(`SELECT last_insert_rowid() AS id`);
      return result.map(row => row.id);
    } catch (error) {
      console.error(`Failed to insert multiple rows into ${table}:`, error);
      return null;
    }
  }



  /* async insertMany(table: string, rows: { [key: string]: any }[]): Promise<number[]> {
     if (rows.length === 0) return [];
 
     const keys = Object.keys(rows[0]).join(', ');
     const values = rows.map(row => Object.values(row));
     const placeholders = `(${Object.keys(rows[0]).map(() => '?').join(', ')})`;
     const query = `INSERT INTO ${table} (${keys}) VALUES ${rows.map(() => placeholders).join(', ')}`;
 
     const flatValues = values.flat();
     try {
       await this.connection.query(query, flatValues);
       const result = await this.connection.query(`SELECT last_insert_rowid() AS id FROM ${table}`);
       return result.map(row => row.id);
     } catch (error) {
       console.error(`Failed to insert multiple rows into ${table}:`, error);
       return null;
     }
   }*/

  async insertManyWithConflict(
    table: string,
    rows: { [key: string]: any }[],
    conflictColumns: string[]
  ): Promise<string[]> {
    if (rows.length === 0) return [];

    // Get TEXT primary key column
    const primaryValue = await this.getPrimaryValue(table);

    // Add UUIDs where necessary
    if (primaryValue) {
      for (const row of rows) {
        if (!row.hasOwnProperty(primaryValue.key)) {
          row[primaryValue.key] = this.uuid.generateUUID();
        }
      }
    }

    const keys = Object.keys(rows[0]);
    const columns = keys.join(', ');
    const placeholders = `(${keys.map(() => '?').join(', ')})`;
    const query = `
    INSERT INTO ${table} (${columns}) 
    VALUES ${rows.map(() => placeholders).join(', ')}
    ON CONFLICT(${conflictColumns.join(', ')}) DO NOTHING
  `;
    const flatValues = rows.flatMap(row => keys.map(k => row[k]));

    try {
      await this.connection.query(query, flatValues);

      // Return generated UUIDs or empty
      if (primaryValue) {
        return rows.map(row => row[primaryValue.key]);
      }

      // No reliable way to return auto-increment IDs in bulk
      return [];
    } catch (error) {
      console.error(`Failed to insert with conflict handling into ${table}:`, error);
      return null;
    }
  }

  // async insertManyWithConflict(
  //   table: string,
  //   rows: { [key: string]: any }[],
  //   conflictColumns: string[]
  // ): Promise<number[]> {
  //   if (rows.length === 0) return [];

  //   // Create keys for columns and placeholders
  //   const keys = Object.keys(rows[0]).join(', ');
  //   const values = rows.map(row => Object.values(row));
  //   const placeholders = `(${Object.keys(rows[0]).map(() => '?').join(', ')})`;

  //   const conflictColumnsClause = conflictColumns.join(', ');

  //   const query = `
  //       INSERT INTO ${table} (${keys}) VALUES ${rows.map(() => placeholders).join(', ')}
  //       ON CONFLICT(${conflictColumnsClause}) DO NOTHING
  //     `;
  //   const flatValues = values.flat();
  //   try {
  //     await this.connection.query(query, flatValues);
  //     // Retrieve IDs of inserted rows
  //     const result = await this.connection.query(`SELECT last_insert_rowid() AS id FROM ${table}`);
  //     return result.map(row => row.id);
  //   } catch (error) {
  //     console.error(`Failed to insert multiple rows with conflict handling into ${table}:`, error);
  //     return null;
  //   }
  // }

  /*
async insertManyWithConflict(
table: string,
rows: { [key: string]: any }[],
conflictColumns: string[]
): Promise<void> {
if (rows.length === 0) return;

// Extract column keys
const keys = Object.keys(rows[0]);
const columnList = keys.join(', ');

// Construct the SELECT query part using UNION ALL for each row
const selectClauses = rows
  .map(
    () =>
      `SELECT ${keys.map(() => '?').join(', ')}`
  )
  .join(' UNION ALL ');

// Flatten all the row values into a single array
const values = rows.flatMap(row => Object.values(row));

// Build the WHERE condition for conflict detection
const conflictCondition = conflictColumns
  .map(column => `${table}.${column} = new.${column}`)
  .join(' AND ');

// Build the final query
const query = `
      INSERT INTO ${table} (${columnList})
      SELECT * FROM (${selectClauses}) AS new
      WHERE NOT EXISTS (
        SELECT 1 FROM ${table}
        WHERE ${conflictCondition}
      )
    `;

try {
  await this.connection.query(query, values);
  console.log(`Successfully inserted rows into ${table} without conflicts`);
} catch (error) {
  console.error(`Failed to insert multiple rows with conflict handling into ${table}:`, error);
  // throw error;
}
}*/



  async get(table: string, whereClause: string = '1=1', whereParams: any[] = []): Promise<any[]> {
    const query = `SELECT * FROM ${table} WHERE ${whereClause}`;
    try {
      return await this.connection.query(query, whereParams);
    } catch (error) {
      console.error(`Failed to get data from ${table}:`, error);
      return null;
    }
  }

  async getCustomQuery(query: string, params: any[]): Promise<any[]> {
    try {
      return await this.connection.query(query, params);
    } catch (error) {
      console.error('Error executing custom query:', error);
      // throw error;
      return [];
    }
  }

  async update(table: string, columns: { [key: string]: any }, whereClause: string, whereParams: any[]): Promise<void> {
    const setClause = Object.keys(columns).map(key => `${key} = ?`).join(', ');
    const values = Object.values(columns);
    const query = `UPDATE ${table} SET ${setClause} WHERE ${whereClause}`;
    try {
      await this.connection.query(query, [...values, ...whereParams]);
    } catch (error) {
      console.error(`Failed to update data in ${table}:`, error);
      return null;
    }
  }

  async delete(table: string, whereClause: string, whereParams: any[]): Promise<void> {
    const query = `DELETE FROM ${table} WHERE ${whereClause}`;
    try {
      await this.connection.query(query, whereParams);
    } catch (error) {
      console.error(`Failed to delete data from ${table}:`, error);
      // throw error;

    }
  }

  // async truncate(table: string): Promise<void> {
  //   const query = `DELETE FROM ${table}`;
  //   try {
  //     await this.connection.query(query);
  //     await this.connection.query(`VACUUM`);
  //   } catch (error) {
  //     console.error(`Failed to truncate table ${table}:`, error);
  //     throw error;
  //   }
  // }

  async truncate(table: string): Promise<void> {
    const query = `DELETE FROM ${table}`;
    try {
      await this.connection.query(query);
      // Reset the auto-increment counter for the table
      await this.connection.query(`DELETE FROM sqlite_sequence WHERE name = ?`, [table]);
      await this.connection.query(`VACUUM`);
    } catch (error) {
      console.error(`Failed to truncate table ${table}:`, error);
      // throw error;
    }
  }

  async fetchFeed(whereClause: string = '1=1', whereParams: any[] = []): Promise<any[]> {
    // const query = `SELECT * FROM feed WHERE ${whereClause} order by line_index asc`;
    const query = `SELECT * FROM feed WHERE ${whereClause} order by CAST(SUBSTR(timestamp, 1, 2) AS INTEGER),
  CAST(SUBSTR(timestamp, 4, 2) AS INTEGER),
  CAST(SUBSTR(timestamp, 7, 2) AS INTEGER),
  CAST(SUBSTR(timestamp, 10) AS INTEGER), line_index asc`;
    try {
      const data = await this.connection.query(query, whereParams);
      const finalData = (data || []).map((a) => ([a.timestamp, JSON.parse(a.data), a.line_index, a.formate, a.page_number, a.line_number]));

      return finalData;
    } catch (error) {
      console.error(`Failed to get data from feed:`, error);
      return null;
    }
  }


  async deleteData(nSesid: string, startInd: number, endInd: number, currentJob: CurrentJob): Promise<any> {
    this.commandCounter++;
    // this.queue.push({ method: 'DELETE', commandCounter: this.commandCounter, nSesid: nSesid, startInd: startInd, endInd: endInd });
    // Adding tasks to the queue
    this.queue.push(async () => {
      // console.log('Starting Task 1...');
      await this.deleteDataInFeed(nSesid, startInd, endInd, this.commandCounter);
      // console.log('Task 1 complete');
      // return 'DELETE';
    });
    // this.commandCounter++;
    // this.queue.push(async () => {
    //   console.log('Starting Task 1.1...');
    //   await this.rearrangeLines(nSesid, startInd,this.commandCounter);
    //   console.log('Task 1.1 complete');
    //   return 'REARRANGE';
    // });


  }

  async deleteDataInFeed(nSesid: string, startInd: number, endInd: number, commandCounter: number) {
    await new Promise(async (resolve, reject) => {
      try {
        // this.printQuerylog(`Task execute: ${commandCounter}  `);
        const query1 = `delete from feed where nSesid = ? and line_index between  ? and  ?`;
        this.printQuerylog(`${commandCounter} : ${query1} \n ${JSON.stringify([nSesid, startInd, endInd])}`);
        const data = await this.connection.query(query1, [nSesid, startInd, endInd]);

      } catch (error) {
        this.printQuerylog(`${commandCounter} : Failed to delete data from feed: `);
      }



      resolve(true);
    })

  }



  async rearrangeLines(nSesid: string, startInd: number, commandCounter: number) {
    await new Promise(async (resolve, reject) => {
      try {

        const query2 = `update feed set line_index = line_index - 1,line_number = line_number - 1 where nSesid = ? and line_index > ?`;

        this.printQuerylog(`${commandCounter} : ${JSON.stringify([nSesid, startInd])}`);
        this.printQuerylog(`${commandCounter} : ${query2}`);
        const data = await this.connection.query(query2, [nSesid, startInd]);
      } catch (error) {
        this.printQuerylog(`${commandCounter} : Failed to rearrage Lines data in feed: ${JSON.stringify(error)}`);
      }
      resolve(true);
    })
  }

  /*
    async updateIndexInDb(nSesid: string, ind: number, currentJob: CurrentJob): Promise<any[]> {
      
  
      try {
        const query1 = `delete from feed where nSesid = ? and line_index = ?`;
        const data = await this.connection.query(query1, [nSesid, ind]);
      } catch (error) {
  
      }
  
  
      try {
  
        const query2 = `update feed set line_index = line_index - 1,line_number = line_number - 1 where nSesid = ? and line_index > ?`;
  
        const data = await this.connection.query(query2, [nSesid, ind]);
      } catch (error) {
  
      }
  
      return null;
    }*/



  /*
    async feedUpdate(nSesid: string, line_index: number, timestamp: string, line_number: number, page_number: number, formate: string, data: any): Promise<any> {
      if (!nSesid) {
        console.error(`Failed to update data in feed: nSesid is required`);
        return null;
      }
      const query = `
                    INSERT INTO feed (nSesid, line_index, timestamp, line_number, page_number,formate, data, created_at)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                    ON CONFLICT(nSesid, line_index) DO UPDATE SET
                      line_index = excluded.line_index,
                      timestamp = excluded.timestamp,
                      line_number = excluded.line_number,
                      page_number = excluded.page_number,
                      formate = excluded.formate,
                      data = excluded.data
                  `;
      try {
        await this.connection.query(query, [nSesid, line_index || 0, timestamp || '', line_number || 0, page_number || 0, formate || '', JSON.stringify(data) || '[]', new Date().toISOString()]);
      } catch (error) {
        console.error(`Failed to update data in feed:`, error);
        return null;
      }
    }*/
  async feedUpdate(nSesid: string, line_index: number, timestamp: string, line_number: number, page_number: number, formate: string, data: any): Promise<any> {
    if (!nSesid) {
      console.log(`Failed to update data in feed: nSesid is required`);
      return null;
    }
    this.commandCounter++;
    // this.queue.push({ method: 'FEED', commandCounter: this.commandCounter, nSesid: nSesid, line_index: line_index, timestamp: timestamp, line_number: line_number, page_number: page_number, formate: formate, data: data });

    this.queue.push(async () => {
      // console.log('Starting Task 1...');
      await this.updateFeedDataToSql(nSesid, line_index, timestamp, line_number, page_number, formate, data, this.commandCounter);
      // console.log('Task 1 complete');
      // return 'UPDATE';
    });

    // this.commandCounter++;
    // if(){}
    // this.queue.push(async () => {
    //   console.log('Starting Task 1.1...');
    //   await this.rearrangeLines(nSesid, (line_index), this.commandCounter);
    //   console.log('Task 1.1 complete');
    //   return 'REARRANGE';
    // });

    return true;
  }


  async updateFeedDataToSql(nSesid: string, line_index: number, timestamp: string, line_number: number, page_number: number, formate: string, data: any, commandCounter: number) {
    await new Promise(async (resolve, reject) => {
      try {
        // this.printQuerylog(`Task execute: ${commandCounter}`);
        this.printQuerylog(`${commandCounter} :  ${JSON.stringify([nSesid, line_index || 0, timestamp || '', line_number || 0, page_number || 0, formate || '', JSON.stringify(data || []) || '[]', new Date().toISOString(), null])}`);
        const validateQuery = `select * from feed where nSesid = ? and line_index = ?`;
        this.printQuerylog(`${commandCounter} : ${validateQuery}`);
        const list = await this.connection.query(validateQuery, [nSesid, line_index]) || [];
        if (list?.length > 0) {
          const updateQuery = `update feed set line_index = ?, timestamp = ?, line_number = ?, page_number = ?, formate = ?, data = ? ,updated_at = ? where nSesid = ? and line_index = ?`;
          this.printQuerylog(`${commandCounter} : ${updateQuery}`);
          await this.connection.query(updateQuery, [line_index || 0, timestamp || '', line_number || 0, page_number || 0, formate || '', JSON.stringify(data || []) || '[]', new Date().toISOString(), nSesid, line_index]);
        } else {
          const insertQuery = ` INSERT INTO feed (nSesid, line_index, timestamp, line_number, page_number, formate, data, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
          this.printQuerylog(`${commandCounter} : ${insertQuery}`);
          await this.connection.query(insertQuery, [
            nSesid,
            line_index || 0,
            timestamp || '',
            line_number || 0,
            page_number || 0,
            formate || '',
            JSON.stringify(data || []) || '[]',
            new Date().toISOString(), null]);
        }
      } catch (error) {
        console.error(`Failed to update data in feed:`, error);
        this.printQuerylog(`${commandCounter} : Failed to update data in feed:`);
      }
      resolve(true);
    })

    /*return;

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
    this.printQuerylog(`${query} \n ${JSON.stringify([
      nSesid,
      line_index || 0,
      timestamp || '',
      line_number || 0,
      page_number || 0,
      formate || '',
      JSON.stringify(data || []) || '[]',
      new Date().toISOString(),
      new Date().toISOString()
    ])}`);
    try {
      const resOfQuery = await this.connection.query(query, [
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
      this.printQuerylog('Query Responce :' + JSON.stringify(resOfQuery));
      return true;

    } catch (error) {
      console.error(`Failed to update data in feed:`, error);
      this.printQuerylog('Failed to update data in feed:');
      return null;
    }*/
  }

  async onModuleInit() {
    // console.log('\n\r\n\rCreating tables...');

    // await this.connection.query(`drop table if exists RIssueDetail`);
    // await this.connection.query(`drop table if exists RIssueMapid`);
    // await this.connection.query(`drop table if exists RIssueMaster`);
    // await this.connection.query(`drop table if exists IssueCategory`);
    // await this.connection.query(`drop table if exists users`);
    // await this.connection.query(`drop table if exists sessions`);
    // await this.connection.query(`drop table if exists servers`);
    // await this.truncate('feed');
    // await this.connection.query(`alter table deletesessions add column nLSesid INTEGER NOT NULL`);

    // await this.tableCreationService.createTablesAndViews();


    // this.logger.verbose('Tables successfully created');
    /*  await this.truncate('IssueCategory');
      await this.truncate('RHighlightMapid');
      await this.truncate('RHighlights');
      await this.truncate('RIssueDetail');
      await this.truncate('RIssueMapid');
      await this.truncate('RIssueMaster');
      await this.truncate('RSessionDetail');
      await this.truncate('assignment');
      await this.truncate('delete_log');
      await this.truncate('deletesessions');
      await this.truncate('servers');
      await this.truncate('sessions');
      await this.truncate('sync_log');
      await this.truncate('users');
      await this.truncate('caseusers');*/

    // await this.insertRefreshType();

    // await this.insertCodeMaster();
    // await this.insertServer();
    // await this.insertUser();

    // this.sysnLogSession()
    // try {
      // isTranscript
      // await this.connection.query(`alter table "sessions" add column "isTranscript" BOOLEAN NOT NULL DEFAULT 0`);
    // } catch (error) {

    // }


    // const data = await this.get('users', null, []);
    // console.log('\n\r\n\r\n\r\n\r user data :', data);
  }



  async insertRefreshType() {
    const refreshType = await this.get('refreshtype', '1=1', []);
    if (refreshType?.length === 0) {
      this.insert('refreshtype', { cType: 'all' });
    }
  }

  printQuerylog(logdata: string) {
    try {
      const log_msg = `${logdata}\n\r\n\r\n\r\n`
      fs.appendFile('query_log.txt', log_msg + '\n', (err) => {
        if (err) {
          console.error('Error appending to file:', err);
          // throw err;
        }
        // console.log('File updated successfully!');
      });
    } catch (error) {
      console.log('ERROR', error);
    }

  }

  async insertOrUpdateFeedById(
    id: number | null, // Primary key or null
    nSesid: string,
    line_index: number,
    timestamp: string,
    line_number: number,
    page_number: number,
    formate: string,
    data: any
  ): Promise<number | null> {
    if (!nSesid) {
      console.error(`Failed to insert/update data in feed: nSesid is required`);
      return null;
    }

    try {
      let insertedOrUpdatedId: number | null = null;

      if (id) {
        // Check if the record with the given ID exists
        const existingRecord = await this.connection.query(
          `SELECT id FROM feed WHERE id = ?`,
          [id]
        );

        if (existingRecord.length > 0) {
          // Update existing record
          const updateQuery = `
            UPDATE feed SET
              nSesid = ?,
              line_index = ?,
              timestamp = ?,
              line_number = ?,
              page_number = ?,
              formate = ?,
              data = ?,
              updated_at = ?
            WHERE id = ?
          `;
          await this.connection.query(updateQuery, [
            nSesid,
            line_index || 0,
            timestamp || '',
            line_number || 0,
            page_number || 0,
            formate || '',
            JSON.stringify(data) || '[]',
            new Date().toISOString(),
            id,
          ]);
          insertedOrUpdatedId = id; // Return the ID of the updated record
        } else {
          // The record with this ID does not exist, proceed to insert a new record
          id = null; // Clear the ID so we insert a new row
        }
      }

      if (!id) {
        // Insert new record since no valid ID was provided or the ID did not exist
        const insertQuery = `
          INSERT INTO feed (nSesid, line_index, timestamp, line_number, page_number, formate, data, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, NULL)
        `;
        await this.connection.query(insertQuery, [
          nSesid,
          line_index || 0,
          timestamp || '',
          line_number || 0,
          page_number || 0,
          formate || '',
          JSON.stringify(data) || '[]',
          new Date().toISOString(),
        ]);

        // Get the last inserted row ID
        const result = await this.connection.query('SELECT last_insert_rowid() AS id');
        insertedOrUpdatedId = result[0]?.id;
      }

      return insertedOrUpdatedId;
    } catch (error) {
      console.error(`Failed to insert/update data in feed:`, error);
      return null;
    }
  }


  async deleteFeedLine(id: number): Promise<boolean> {
    if (!id) {
      console.error(`Failed to delete data from feed: nSesid is required`);
      return false;
    }
    try {
      const query = `DELETE FROM feed WHERE id = ?`;

      this.utilityService.fileLog('deletequery_log', '\n' + query + ' ' + id, "deletequery_log");
      await this.connection.query(query, [id]);
      return true;
    } catch (error) {
      console.error(`Failed to delete data from feed:`, error);
      return false;
    }
  }

  async insertCodeMaster() {
    try {

      const codemasterData = await this.get('Codemaster', '1=1', []);

      if (codemasterData?.length === 0) {
        // Insert data only if the Codemaster table is empty

        const response = await this.makePostRequest('codemastersdata', {});
        if (!response?.length) return;

        this.insertMany('Codemaster', response);

        //       await this.connection.query(`
        //   INSERT INTO Codemaster (nCodeid, nCategoryid, cCodename, nSerialno, nParentcodeid, nUserid, jOther, jParents) 
        //   VALUES 
        //   (13, 4, 'Critical', 1, 0, 0, '[]', '[]'),
        //   (14, 4, 'High', 2, 0, 0, '[]', '[]'),
        //   (15, 4, 'Medium', 3, 0, 0, '[]', '[]'),
        //   (16, 4, 'Low', 4, 0, 0, '[]', '[]'),
        //   (17, 4, 'Neutral', 5, 0, 0, '[]', '[]'),
        //   (19, 5, 'For us', 2, 0, 0, '[]', '[]'),
        //   (21, 5, 'Heavily against us', 4, 0, 0, '[]', '[]'),
        //   (23, 5, 'Unsure', 6, 0, 0, '[]', '[]'),
        //   (18, 5, 'Against us', 5, 0, 0, '[]', '[]'),
        //   (20, 5, 'Heavily for us', 1, 0, 0, '[]', '[]'),
        //   (22, 5, 'Neutral', 3, 0, 0, '[]', '[]');
        // `);
        console.log('Codemaster data inserted');
      } else {
        console.log('Codemaster data already exists, skipping insertion');
      }
    } catch (error) {
      console.log('insert codemaster error', error)
    }

  }



  async insertServer() {
    try {
      const serverlist = await this.get('servers');
      if (serverlist.length === 0) {
        this.insert('servers', {
          nUserid: 0,
          cName: 'Live',
          cUrl: `${this.config.get('LIVE_IP')}`,
          nPort: this.config.get('LIVE_PORT')
        })
      }
    } catch (error) {
      console.log('Failed to create')
    }
  }


  async insertUser() {
    try {
      const users = await this.get('users')
      if (!users?.length)
        this.insert('users', {
          cFname: 'etabella',
          cLname: '',
          nUserid: this.config.get('DEFAULT_USER_ID'),
          cEmail: `${this.config.get('DEFAULT_EMAIL')}`,
          cIsvarify: 'Y',
          isAdmin: 1
        })
    } catch (error) {

    }

    // setTimeout(() => {
    //   throw new Error('Test For crash')
    // }, 15000);
  }

  async makePostRequest(apipath: string, body: any): Promise<any> {
    try {
      const url = new URL(this.config.get('LIVE_SERVER') + '/sync/' + apipath);
      const response = await firstValueFrom(
        this.httpService.post(url.toString(), body)
      );
      return response.data ? response.data : { msg: -1, value: 'Failed' };
    } catch (error) {
      console.error('Failed to post data to:', apipath, error?.message);
      return { msg: -1, value: 'Failed' };
    }
  }


  // Method to export SQLite table to CSV
  async backupTableToCSV(tableName: string, filePath: string): Promise<void> {
    const query = `SELECT * FROM ${tableName}`;
    try {
      // Query the database


      // Ensure directory exists
      this.ensureDirectoryExists(filePath);

      const rows = await this.connection.query(query);

      // Check if rows are available
      if (!rows || rows.length === 0) {
        console.log(`No data found in table: ${tableName}`);
        return;
      }

      // Convert rows to CSV
      const csvContent = this.convertRowsToCSV(rows);

      // Write CSV to file
      await promisify(fs.writeFile)(filePath, csvContent, 'utf-8');
      console.log(`Backup successful: Data from ${tableName} saved to ${filePath}`);
    } catch (error) {
      console.error(`Failed to back up table ${tableName} to CSV:`, error);
    }
  }

  // Convert JSON rows to CSV format
  private convertRowsToCSV(rows: any[]): string {
    if (rows.length === 0) return '';

    const headers = Object.keys(rows[0]).join(','); // Extract headers
    const csvRows = rows.map(row =>
      Object.values(row).map(value => (value !== null ? `"${value}"` : '')).join(',')
    );

    return [headers, ...csvRows].join('\n');
  }
  // Method to ensure the directory exists
  private ensureDirectoryExists(filePath: string): void {
    const dir = path.dirname(filePath); // Get the directory from the file path

    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true }); // Create directory, including any intermediate directories
      console.log(`Directory created: ${dir}`);
    }
  }

  async sysnLogSession() {
    try {
      const rows = await this.getCustomQuery(`select * from logsession`, []);
      if (!rows?.length) {
        this.insert('logsession', {
          cSession: this.generateRandomId(12)
        })
      }
    } catch (error) {

    }
  }
  generateRandomId(length = 8) {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let randomId = '';
    for (let i = 0; i < length; i++) {
      randomId += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return randomId;
  }
}