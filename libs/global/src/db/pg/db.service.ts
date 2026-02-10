import { Injectable, Logger } from '@nestjs/common';
import { Pool } from 'pg';
import { QueryBuilderService } from './query-builder.service';
import { ConfigService } from '@nestjs/config';
import { promises as fs } from 'fs';
import * as path from 'path';
import { schemaType } from '@app/global/interfaces/db.interface';

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
    this.pool = new Pool(cfg);

    this.pool.on('error', (err, client) => {
      this.logger.error('Unexpected error on idle client', err);
      process.exit(-1);
    });
  }

  async rowQuery(text: string, params?: any[]): Promise<any> {
    try {
      const start = Date.now();
      const res = await this.pool.query(text, params);
      return { success: true, data: res?.rows || [] };
    } catch (error) {
      this.logger.error('Error executing query', { text, error: error.message });
      // throw error; // Rethrow the error to be handled by the caller
      return { success: false, error: error.message };
    }
  }
  async query(text: string, params?: any[]): Promise<any> {
    try {
      const start = Date.now();
      const res = await this.pool.query(text, params);
      const duration = Date.now() - start;
      // console.log('executed query', { text, duration });
      return { success: true, data: res.filter(m => m.command == 'FETCH').map(a => a.rows) };
    } catch (error) {
      this.logger.error('Error executing query', { text, error: error.message });
      // throw error; // Rethrow the error to be handled by the caller
      return { success: false, error: error.message };
    }
  }




  async executeRef(fun_name: string, params: any, schema?: schemaType): Promise<any> {
    try {
      let refs = params.ref ? params.ref : 1;
      delete params.ref;
      let query = await this.queryBuilder.buildQuery(params, fun_name, refs, schema);
      // await fs.writeFile('query.txt', '\n\r\n\r\n\r\n\r\n\r\n\r\n\r\n\r\n\r\n\r\n\r\n\r\n\r\n\r\n\r' +  query);
      let responce = await this.query(query);
      return responce;

    } catch (error) {
      return { success: false, error: error };
    }
  }

}
