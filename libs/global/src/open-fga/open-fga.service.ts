import { Injectable } from '@nestjs/common';
import {
  ClientListObjectsRequest,
  OpenFgaClient,
  ClientReadRequest,
  ReadRequest,
} from '@openfga/sdk';

@Injectable()
export class OpenFgaService {
  private fga: OpenFgaClient;

  constructor() {
    this.fga = new OpenFgaClient({
      apiUrl: process.env.OPENFGA_API_URL!,
      storeId: process.env.OPENFGA_STORE_ID!,
      authorizationModelId: process.env.OPENFGA_AUTHORIZATION_MODEL_ID,
    });
  }

  async checkTupleExists(tuple: {
    user: string;
    relation: string;
    object: string;
  }): Promise<boolean> {
    try {
      const request = {
        user: tuple.user,
        relation: tuple.relation,
        object: tuple.object,
      };

      // Use check, not read
      const response = await this.fga.check(request);

      return response.allowed === true;
    } catch (error) {
      console.error('Error checking tuple existence:', error);
      return false; // fail safe
    }
  }

  /*  async readTuples(params?: {
      user?: string;
      relation?: string;
      object?: string;
    }): Promise<any[]> {
      try {
        const request = {
          tuple_key: {
            user: params?.user,
            relation: params?.relation,
            object: params?.object,
          },
        } as any;
        const response = await this.fga.read(request);
        return response.tuples || [];
      } catch (error) {
        console.error('Error reading tuples from OpenFGA:', error);
        return [];
      }
    }*/


  async readTuples(params?: {
    user?: string;
    relation?: string;
    object?: string;
  }): Promise<any[]> {
    try {
      // The OpenFGA SDK's read method expects parameters directly, not under tuple_key
      const request: any = {};

      if (params?.user) {
        request.user = params.user;
      }
      if (params?.relation) {
        request.relation = params.relation;
      }
      if (params?.object) {
        request.object = params.object;
      }

      console.log('OpenFGA read request (corrected):', JSON.stringify(request, null, 2));

      const response = await this.fga.read(request);

      console.log('OpenFGA read response:', JSON.stringify(response, null, 2));

      return response.tuples || [];
    } catch (error) {
      console.error('Error reading tuples from OpenFGA:', error);
      return [];
    }
  }


  async writeTuples(
    tuples: { user: string; relation: string; object: string }[],
  ) {
    console.log('Writing tuples to OpenFGA:', tuples);
    try {
      return this.fga.writeTuples(tuples);
    } catch (error) {
      console.error('Error writing tuples to OpenFGA:', error);
      throw error;
    }
  }

  async writeTuplesSafe(
    tuples: { user: string; relation: string; object: string }[],
  ) {
    console.log('Safely writing tuples to OpenFGA:', tuples);
    try {
      // Check which tuples already exist
      const existenceChecks = await Promise.all(
        tuples.map(async (tuple) => ({
          tuple,
          exists: await this.checkTupleExists(tuple),
        })),
      );

      // Filter out existing tuples
      const newTuples = existenceChecks
        .filter(({ exists }) => !exists)
        .map(({ tuple }) => tuple);

      const existingTuples = existenceChecks
        .filter(({ exists }) => exists)
        .map(({ tuple }) => tuple);

      if (existingTuples.length > 0) {
        console.log('Skipping existing tuples:', existingTuples);
      }

      if (newTuples.length > 0) {
        console.log('Writing new tuples:', newTuples);
        return await this.fga.writeTuples(newTuples);
      } else {
        console.log('No new tuples to write');
        return { success: true, message: 'No new tuples to write' };
      }
    } catch (error) {
      console.error('Error safely writing tuples to OpenFGA:', error);
      throw error;
    }
  }

  async deleteTuples(
    tuples: { user: string; relation: string; object: string }[],
  ) {
    console.log('Deleting tuples from OpenFGA:', tuples);
    try {
      return this.fga.deleteTuples(tuples);
    } catch (error) {
      console.error('Error deleting tuples from OpenFGA:', error);
      throw error;
    }
  }

  async deleteTuplesSafe(
    tuples: { user: string; relation: string; object: string }[],
  ) {
    console.log('Safely deleting tuples from OpenFGA:', tuples);
    try {
      // Check which tuples actually exist before trying to delete
      const existenceChecks = await Promise.all(
        tuples.map(async (tuple) => ({
          tuple,
          exists: await this.checkTupleExists(tuple),
        })),
      );

      // Filter to only delete existing tuples
      const existingTuples = existenceChecks
        .filter(({ exists }) => exists)
        .map(({ tuple }) => tuple);

      const nonExistingTuples = existenceChecks
        .filter(({ exists }) => !exists)
        .map(({ tuple }) => tuple);

      if (nonExistingTuples.length > 0) {
        console.log('Skipping non-existing tuples:', nonExistingTuples);
      }

      if (existingTuples.length > 0) {
        console.log('Deleting existing tuples:', existingTuples);
        return await this.fga.deleteTuples(existingTuples);
      } else {
        console.log('No existing tuples to delete');
        return { success: true, message: 'No existing tuples to delete' };
      }
    } catch (error) {
      console.error('Error safely deleting tuples from OpenFGA:', error);
      throw error;
    }
  }

  // async listObjects(params: { user: string; relation: string; type: string }) {
  //   try {
  //     const request: ClientListObjectsRequest = {
  //       user: params.user,
  //       relation: params.relation,
  //       type: params.type,
  //     };
  //     return this.fga.listObjects(request);
  //   } catch (error) {
  //     console.error('Error listing objects from OpenFGA:', error);
  //     throw error;
  //   }
  // }


  async listObjects(params: {
    user: string;
    relation: string;
    type: string;
    consistency?: 'fully-consistent' | 'prefer-fast' | 'best-effort';
  }) {
    try {
      const envConsistency = (process.env.FGA_DEFAULT_CONSISTENCY || '').trim() as any;
      const defaultConsistency: 'fully-consistent' | 'prefer-fast' | 'best-effort' =
        envConsistency === 'fully-consistent' || envConsistency === 'prefer-fast' || envConsistency === 'best-effort'
          ? envConsistency
          : 'prefer-fast';
      const request: ClientListObjectsRequest = {
        user: params.user,
        relation: params.relation,
        type: params.type,
        // Add consistency parameter for performance tuning (env override via FGA_DEFAULT_CONSISTENCY)
        consistency: params.consistency ?? defaultConsistency,
      } as any;
      return this.fga.listObjects(request);
    } catch (error) {
      console.error('Error listing objects from OpenFGA:', error);
      throw error;
    }
  }
  /**
   * Return explicit assignee subjects written on a task
   * (e.g., user:u1, team:eng#member, case:c42#member).
   */
  async readAssigneeSubjects(taskObject: string): Promise<string[]> {
    try {
      const res = await this.fga.read({
        tuple_key: {
          object: taskObject, // e.g., task:123
          relation: 'assignee',
        }
      } as any);
      const subjects = (res.tuples ?? [])
        .map((t: any) => t?.key?.user ?? t?.tuple_key?.user)
        .filter(Boolean);
      return subjects;
    } catch (e) {
      console.error('readAssigneeSubjects error:', e);
      return [];
    }
  }


  // // Drop-in replacement for your listAssigneeUsers
  // async listAssigneeUsers(taskObject: string): Promise<string[]> {
  //   // helper to normalize "user:<id>" or 'user:"<id>"' -> <id>
  //   const norm = (s: string) =>
  //     s
  //       .trim()
  //       .replace(/^user:\s*/i, '')
  //       .replace(/^"(.*)"$/, '$1')
  //       .replace(/^'(.*)'$/, '$1')
  //       .trim();

  //   // Prefer OpenFGA ListUsers if available
  //   const clientAny = this.fga as any;
  //   if (typeof clientAny.listUsers === 'function') {
  //     try {
  //       const res = await clientAny.listUsers({
  //         object: taskObject,           // e.g., "task:123"
  //         relation: 'assignee',
  //         user_filters: [{ type: 'user' }],
  //       });

  //       const ids = (res?.users ?? [])
  //         .map((u: any) => (typeof u?.object === 'string'
  //           ? norm(u.object)                       // "user:abc" or 'user:"abc"'
  //           : (typeof u?.id === 'string' ? u.id : ''))) // some SDKs return { id, type }
  //         .filter(Boolean);

  //       return Array.from(new Set(ids));
  //     } catch (e) {
  //       console.warn('listUsers failed, falling back. Error:', e);
  //     }
  //   }

  //   // Fallback: read tuples and keep only direct users
  //   const readRes = await this.fga.read({
  //     tuple_key: { object: taskObject, relation: 'assignee' },
  //   } as any);

  //   const ids = (readRes.tuples ?? [])
  //     .map((t: any) => t?.key?.user ?? t?.tuple_key?.user)
  //     .filter((s: any) => typeof s === 'string' && s.startsWith('user:'))
  //     .map((s: string) => norm(s));

  //   return Array.from(new Set(ids));
  // }




  // add inside OpenFgaService
  async readAllTuples(params?: {
    user?: string;
    relation?: string;
    object?: string;
  }): Promise<Array<{ user: string; relation: string; object: string }>> {
    const out: Array<{ user: string; relation: string; object: string }> = [];
    let continuation_token: string | undefined = undefined;

    do {
      const resp = await this.fga.read({
        user: params?.user,
        relation: params?.relation,
        object: params?.object,
        continuation_token,
      } as any); // SDK accepts continuation_token; cast if your types are older

      (resp.tuples ?? []).forEach((t) => {
        out.push({
          user: t.key!.user!,
          relation: t.key!.relation!,
          object: t.key!.object!,
        });
      });

      continuation_token = resp.continuation_token || undefined;
    } while (continuation_token);

    return out;
  }




  async listViewableFactIds(userId: string): Promise<string[]> {
    const res = await this.fga.listObjects({
      user: `user:${userId}`,
      relation: 'can_view',
      type: 'fact',
      // if you need read-your-writes: consistency: 'fully-consistent',
    });
    console.log('List Viewable Fact IDs Response:', res);

    const ids = (res.objects ?? []).map((o) => {
      const m = /^fact:(.+)$/.exec(o);
      return m ? m[1] : o; // raw fact id
    });
    //console.log('Extracted Fact IDs:', ids);
    return ids; // ← keep as string[]
  }

  async listViewableDocIds(userId: string): Promise<string[]> {
    const res = await this.fga.listObjects({
      user: `user:${userId}`,
      relation: 'can_view',
      type: 'doclink',
      // if you need read-your-writes: consistency: 'fully-consistent',
    });
    console.log('List Viewable doclink IDs Response:', res);

    const ids = (res.objects ?? []).map((o) => {
      const m = /^doclink:(.+)$/.exec(o);
      return m ? m[1] : o; // raw fact id
    });
    //console.log('Extracted Fact IDs:', ids);
    return ids; // ← keep as string[]
  }





}
