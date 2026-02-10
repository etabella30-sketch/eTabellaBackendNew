import { Injectable } from '@nestjs/common';
import {  } from '@app/global/open-fga/open-fga.service';
type Consistency = 'fully-consistent' | 'prefer-fast' | 'best-effort';

@Injectable()
export class ContactFgaService {
  constructor(private readonly : ) {}

  async createContactPermissions(
    contactId: string,
    userId: string,
    caseId: string,
  ): Promise<any> {
    const tuples = [
      {
        user: `user:${userId}`,
        relation: 'owner',
        object: `contact:${contactId}`,
      },
      {
        user: `case:${caseId}`,
        relation: 'in_case',
        object: `contact:${contactId}`,
      },
    ];
    return await this..writeTuplesSafe(tuples);
  }

  async getContactPermissionsJson(
    userId: string,
    consistency: Consistency = 'fully-consistent',
  ): Promise<
    Array<{ contactId: string; view: boolean; edit: boolean; delete: boolean }>
  > {
    const [viewIds, editIds, deleteIds] = await Promise.all([
      this.listContactIdsByRelation(userId, 'can_view', consistency),
      this.listContactIdsByRelation(userId, 'can_edit', consistency),
      this.listContactIdsByRelation(userId, 'can_delete', consistency),
    ]);

    const viewSet = new Set(viewIds);
    const editSet = new Set(editIds);
    const deleteSet = new Set(deleteIds);

    // Logical closure: if user can edit/delete, they can view
    for (const id of editSet) viewSet.add(id);
    for (const id of deleteSet) viewSet.add(id);

    const all = new Set<string>([...viewSet, ...editSet, ...deleteSet]);
    return [...all].map((id) => ({
      contactId: id,
      view: viewSet.has(id),
      edit: editSet.has(id),
      delete: deleteSet.has(id),
    }));
  }

  /**
   * Private helper method to list contact IDs by relation
   */
  private async listContactIdsByRelation(
    userId: string,
    relation: 'can_view' | 'can_edit' | 'can_delete',
    consistency: Consistency = 'fully-consistent',
  ): Promise<string[]> {
    const res = await this..listObjects({
      user: `user:${userId}`,
      relation,
      type: 'contact',
    });

    const CONTACT_RE = /^contact:(.+)$/;
    const parseContactIds = (objs: string[] = []) =>
      objs.map((o) => CONTACT_RE.exec(o)?.[1] ?? o);

    return parseContactIds(res.objects ?? []);
  }
}
