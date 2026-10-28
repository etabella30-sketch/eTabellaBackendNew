import { Injectable, Logger } from '@nestjs/common';
import { Pool, PoolClient } from 'pg';
import { QueryBuilderService } from './query-builder.service';
import { ConfigService } from '@nestjs/config';
import { promises as fs } from 'fs';
import * as path from 'path';
import { schemaType } from '@app/global/interfaces/db.interface';
import { assertCaseModeWrite, assertQfactDelete, assertQfactShareWrite, qfactPermissionRow, privateQfactListRows, modeRestrictedWrite } from '@app/permissions';
import { isDomainError } from '@app/api-kernel';
import { currentSaveTransaction, failedSaveRow, saveTransaction, SaveTransaction } from './save-transaction';
import { registerWallClockTimestamps } from './db-timestamp';

@Injectable()
export class DbService {
  private pool: Pool;

  private readonly logger = new Logger('query');
  constructor(public queryBuilder: QueryBuilderService, private configService: ConfigService) {
    let cfg: any = {
      // Connection configuration
      user: this.configService.get<string>('DB_USERNAME'),
      host: this.configService.get<string>('DB_HOST'),
      database: this.configService.get<string>('DB_DATABASE'),
      password: this.configService.get<string>('DB_PASSWORD'),
      port: this.configService.get<Number>('DB_PORT'),
      max: this.configService.get<Number>('DB_MAX'),
      idleTimeoutMillis: this.configService.get<Number>('DB_TIMEOUT')
    }

    const sslConnection = this.configService.get<number>('DB_SSL')
    this.logger.log('\n\r\n\r\n\r\n\r\n SSL CONNET', sslConnection > 0 ? 'Y' : 'N')
    if (sslConnection > 0) { //process.env.NODE_ENV == 'production' &&
      cfg.ssl = {
        rejectUnauthorized: false, // Set to true if you want to validate the certificate fully
        // cert: fs.readFileSync(this.configService.get<string>('SSL_PG_CERT')).toString(), // The .crt file
      }
    }
    // this.log.report(`Conneting to server ${JSON.stringify(cfg)}`, `${this.logApplication}/pg`);
    // R3-006: `timestamp without time zone` columns leave as the stored wall clock, never as a shifted instant.
    registerWallClockTimestamps();
    this.pool = new Pool(cfg);

    this.pool.on('error', (err, client) => {
      this.logger.error('Unexpected error on idle client', err);
      process.exit(-1);
    });
  }

  async rowQuery(text: string, params?: any[]): Promise<any> {
    try {
      const start = Date.now();
      const res = await (currentSaveTransaction()?.client ?? this.pool).query(text, params);
      return { success: true, data: res?.rows || [] };
    } catch (error) {
      const transaction = currentSaveTransaction();
      if (transaction) transaction.failure ??= error;
      this.logger.error('Error executing query', { text, error: error.message });
      // throw error; // Rethrow the error to be handled by the caller
      return { success: false, error: error.message };
    }
  }
  async query(text: string, params?: any[]): Promise<any> {
    try {
      const start = Date.now();
      const res = await (currentSaveTransaction()?.client ?? this.pool).query(text, params);
      const duration = Date.now() - start;
      // console.log('executed query', { text, duration });
      return { success: true, data: res.filter(m => m.command == 'FETCH').map(a => a.rows) };
    } catch (error) {
      const transaction = currentSaveTransaction();
      if (transaction) transaction.failure ??= error;
      this.logger.error('Error executing query', { text, error: error.message });
      // throw error; // Rethrow the error to be handled by the caller
      return { success: false, error: error.message };
    }
  }




  async saveAtomically<T>(save: () => Promise<T>): Promise<T | { msg: -1; value: string }> {
    if (currentSaveTransaction()) return save();
    const client = await this.pool.connect();
    const transaction: SaveTransaction = { client, active: true, afterCommit: [] };
    try {
      await client.query('BEGIN');
      return await saveTransaction.run(transaction, async () => {
        const result = await save();
        const failure = transaction.failure ?? failedSaveRow(result);
        if (failure) {
          await client.query('ROLLBACK');
          transaction.active = false;
          // Never attach a rolled-back id to the fallback: a retry must not edit a ghost.
          if (failedSaveRow(result)) return result;
          return { msg: -1 as const, value: 'Save failed. Your changes have not been saved.' };
        }
        await client.query('COMMIT');
        transaction.active = false;
        for (const publish of transaction.afterCommit) {
          try { Promise.resolve(publish()).catch(() => this.logger.warn('Post-save notification failed')); }
          catch (error) { this.logger.warn('Post-save notification failed'); }
        }
        return result;
      });
    } catch (error) {
      await client.query('ROLLBACK').catch(() => {});
      throw error;
    } finally { transaction.active = false; client.release(); }
  }

  async executeRef(fun_name: string, params: any, schema?: schemaType): Promise<any> {
    let client: PoolClient | undefined;
    const transaction = currentSaveTransaction();
    const ownsTransaction = !transaction && modeRestrictedWrite(fun_name);
    try {
      client = transaction?.client;
      if (ownsTransaction) {
        client = await this.pool.connect();
        await client.query('BEGIN');
      }
      if (modeRestrictedWrite(fun_name)) {
        // The mode row's share lock and the write use one transaction. A concurrent
        // switch waits for this save, and a stale tab cannot pass a pre-switch check.
        await assertQfactDelete({ rows: async (sql, values) =>
          (await client.query(sql, [...values])).rows }, fun_name, params);
        await assertQfactShareWrite({ rows: async (sql, values) =>
          (await client.query(sql, [...values])).rows }, fun_name, params);
        await assertCaseModeWrite({ rows: async (sql, values) =>
          (await client.query(sql, [...values])).rows }, fun_name, params);
      }
      let refs = params.ref ? params.ref : 1;
      delete params.ref;
      let query = await this.queryBuilder.buildQuery(params, fun_name, refs, schema);
      // await fs.writeFile('query.txt', '\n\r\n\r\n\r\n\r\n\r\n\r\n\r\n\r\n\r\n\r\n\r\n\r\n\r\n\r\n\r' +  query);
      if (!client) {
        const answer = await this.query(query);
        if (fun_name.toLowerCase() === 'fact_permissions' && answer.success && answer.data?.[0]?.[0]) {
          answer.data[0][0] = await qfactPermissionRow({ rows: async (sql, values) => {
            const result = await this.pool.query(sql, [...values]); return result.rows;
          } }, params.nUserid ?? params.nMasterid, params.nFSid, answer.data[0][0]);
        }
        if (answer.success) answer.data = await privateQfactListRows({ rows: async (sql, values) =>
          (await this.pool.query(sql, [...values])).rows }, fun_name, params.nMasterid ?? params.nUserid, answer.data);
        return answer;
      }
      const result = await client.query(query);
      const results = Array.isArray(result) ? result : [result];
      let data = results.filter(r => r.command === 'FETCH').map(r => r.rows);
      data = await privateQfactListRows({ rows: async (sql, values) =>
        (await client.query(sql, [...values])).rows }, fun_name, params.nMasterid ?? params.nUserid, data);
      if (fun_name.toLowerCase() === 'fact_permissions' && data?.[0]?.[0]) {
        data[0][0] = await qfactPermissionRow({ rows: async (sql, values) =>
          (await client.query(sql, [...values])).rows }, params.nUserid ?? params.nMasterid, params.nFSid, data[0][0]);
      }
      if (transaction) {
        transaction.failure ??= failedSaveRow(data);
        // SPs reuse r1/r2/r3; an outer transaction keeps their portals alive.
        for (let i = 1; i <= refs; i++) await client.query(`CLOSE "r${i}"`);
      }
      if (ownsTransaction) await client.query('COMMIT');
      return { success: true, data };

    } catch (error) {
      if (transaction) transaction.failure ??= error;
      if (client && ownsTransaction) await client.query('ROLLBACK').catch(() => {});
      return { success: false, error: isDomainError(error) ? error.message : error };
    } finally {
      if (ownsTransaction) client?.release();
    }
  }

}
