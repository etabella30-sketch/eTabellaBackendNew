import { Injectable } from '@nestjs/common';
import {
  ClientListObjectsRequest,
  OpenFgaClient,
  ClientReadRequest,
  ClientConfiguration,
} from '@openfga/sdk';

@Injectable()
export class OpenFgaService {
  private fga: OpenFgaClient;
  private readonly MAX_RETRIES = 3;
  private readonly RETRY_DELAY = 100; // ms

  constructor() {
    // Use the OpenFgaClient constructor properly
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
    return false;
    try {
      const request: ClientReadRequest = {
        user: tuple.user,
        relation: tuple.relation,
        object: tuple.object,
      };
      const response = await this.fga.read(request);
      return response.tuples && response.tuples.length > 0;
    } catch (error) {
      console.error('Error checking tuple existence:', error);
      return false; // If we can't check, assume it doesn't exist to be safe
    }
  }

  async readTuples(params?: {
    user?: string;
    relation?: string;
    object?: string;
  }): Promise<any[]> {
    return [];
    try {
      const request: ClientReadRequest = {};
      if (params?.user) request.user = params.user;
      if (params?.relation) request.relation = params.relation;
      if (params?.object) request.object = params.object;

      const response = await this.fga.read(request);
      return response.tuples || [];
    } catch (error) {
      console.error('Error reading tuples from OpenFGA:', error);
      return [];
    }
  }

  async writeTuples(
    tuples: { user: string; relation: string; object: string }[],
  ) {
    return null;
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
      return null;
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
      return null;
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
      return null;
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

  async listObjects(params: {
    user: string;
    relation: string;
    type: string;
    consistency?: 'fully-consistent' | 'prefer-fast' | 'best-effort';
  }) {
      return null;
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
  async listViewableFactIds(userId: string): Promise<string[]> {
      return null;
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


  // add inside OpenFgaService
  async readAllTuples(params?: {
    user?: string;
    relation?: string;
    object?: string;
    pageSize?: number; // Add page size control
  }): Promise<Array<{ user: string; relation: string; object: string }>> {
      return null;
    const out: Array<{ user: string; relation: string; object: string }> = [];
    let continuation_token: string | undefined = undefined;
    const pageSize = params?.pageSize || 200; // Larger page size for fewer requests

    do {
      const resp = await this.fga.read({
        user: params?.user,
        relation: params?.relation,
        object: params?.object,
        continuation_token,
        page_size: pageSize, // Use larger page size
      } as any);

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

  async listViewableDocLinkIds(userId: string): Promise<string[]> {
      return null;
    console.log('Listing viewable DocLink IDs for user:', userId);
    const res = await this.fga.listObjects({
      user: `user:"${userId}"`,
      relation: 'can_view',
      type: 'doclink',
    });
    console.log('List Viewable DocLink IDs Response:', res);

    const ids = (res.objects ?? []).map((o) => {
      const m = /^doclink:"(.+)"$/.exec(o);
      return m ? m[1] : o; // raw doclink id
    });
    console.log('Extracted DocLink IDs:', ids);
    return ids;
  }
}
