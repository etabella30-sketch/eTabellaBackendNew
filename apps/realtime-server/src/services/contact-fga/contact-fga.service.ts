import { Injectable } from '@nestjs/common';
import { OpenFgaService } from '../open-fga/open-fga.service';


@Injectable()
export class ContactFgaService {
  constructor(private readonly openFgaService: OpenFgaService) {}

  async createIssuePermissions(
    contactId: string,
    userId: string,
    caseId: string,
  ): Promise<any> {
    const tuples = [
      {
        user: `user:"${userId}"`,
        relation: 'owner',
        object: `contact:"${contactId}"`,
      },
      {
        user: `case:"${caseId}"`,
        relation: 'in_case',
        object: `contact:"${contactId}"`,
      },
    ];

    return await this.openFgaService.writeTuplesSafe(tuples);
  }

   async deleteAllIssuePermissions(issueId: string): Promise<any> {
    console.log(`Deleting all permissions for issue: ${issueId}`);

    try {
      // Get all existing tuples for this issue by reading them first
      const allTuples = await this.getAllIssueTuples(issueId);

      if (allTuples.length > 0) {
        return await this.openFgaService.deleteTuplesSafe(allTuples);
      } else {
        console.log(`No tuples found for issue: ${issueId}`);
        return { success: true, message: 'No tuples to delete' };
      }
    } catch (error) {
      console.error(`Error deleting permissions for issue ${issueId}:`, error);
      throw error;
    }
  }

    private async getAllIssueTuples(issueId: string): Promise<any[]> {
    console.log(`Reading all existing tuples for issue: ${issueId}`);

    try {
      // Read all tuples for this specific issue object
      const tuples = await this.openFgaService.readTuples({
        object: `issue:"${issueId}"`,
      });

      console.log(
        `Found ${tuples.length} tuples for issue ${issueId}:`,
        tuples,
      );

      // Convert tuples to the format expected by deleteTuples
      const formattedTuples = tuples.map((tuple) => ({
        user: tuple.key.user,
        relation: tuple.key.relation,
        object: tuple.key.object,
      }));

      return formattedTuples;
    } catch (error) {
      console.error(`Error reading tuples for issue ${issueId}:`, error);
      // Fallback: return empty array and let deleteTuplesSafe handle it
      return [];
    }
  }
}
