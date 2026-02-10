import { Injectable } from '@nestjs/common';
import { OpenFgaService } from '../open-fga/open-fga.service';

type Consistency = 'fully-consistent' | 'prefer-fast' | 'best-effort';

@Injectable()
export class DocFgaService {
  constructor(private readonly openFga: OpenFgaService) {}

  async insertFGATuples(
    nDocid: string,
    users: {
      nUserid: string;
      bCanEdit: boolean;
      bCanReshare: boolean;
      bCanComment: boolean;
      bCanCopy: boolean;
    }[],
  ) {
    console.log('\n\r\n\rTotal To Share', users?.length);
    const tuples = users.map((user) => {
      const userRef = `user:${user.nUserid}`;
      const doclinkRef = `doclink:${nDocid}`;

      const userTuples = [];

      userTuples.push({
        user: userRef,
        relation: 'viewer',
        object: doclinkRef,
      });



      return userTuples;
    });

    // Flatten the array of arrays
    const flatTuples = tuples.flat();

    if (flatTuples.length) {
      console.log('step-102', flatTuples);
      await this.openFga.writeTuplesSafe(flatTuples);
    }
  }
}
