import { Injectable } from '@nestjs/common';
import { filterList } from '../../interfaces/navigation.interface';

@Injectable()
export class FilterService {


  getFilter(jFilter: any, mdl: any) {
    try {
      const list: filterList[] = JSON.parse(jFilter);

      let whereClause = '';

      list.forEach((item) => {
        if(item.type == 'CLAIM'){
          whereClause += ` @> to_jsonb() '${item.value}'`
          
        }
      })
      

    } catch (error) {
    }
  }

}
