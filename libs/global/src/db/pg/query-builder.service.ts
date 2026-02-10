import { schemaType } from '@app/global/interfaces/db.interface';
import { Injectable, Logger } from '@nestjs/common';

export interface Model {
    [key: string]: any; // Adjust as needed for your specific model structure.
}

export enum PrefixType {
    Number = 'n',
    Boolean = 'b',
    Date = 'd',
    Character = 'c',
    Json = 'j'
}


@Injectable()
export class QueryBuilderService {

  private readonly logger = new Logger('query');

    setNullValues(model: Model): Model {
        Object.keys(model).forEach((key) => {
            const prefix = key[0];
            const value = model[key];

            switch (prefix) {
                case PrefixType.Number:
                    model[key] = value; // Number(value) || 0;
                    break;
                case PrefixType.Boolean:
                    // Boolean values are assumed to be handled correctly in the input.
                    break;
                case PrefixType.Date:
                    if (value) {
                        let date = new Date(value);
                        if (date.getFullYear() < 0) {
                            date.setFullYear(-date.getFullYear());
                            model[key] = date;
                        }
                    }
                    break;
                case PrefixType.Character:
                    model[key] = value || '';
                    break;
                case PrefixType.Json:
                    model[key] = value ? ((typeof value)=='string' ? value : JSON.stringify(value).replace(/'/g, "''")) : null;
                    break;
                default:
                    if (Array.isArray(value) && !key.includes('detail')) {
                        model[key] = value ? value.toString() : '';
                    } else if (!Array.isArray(value)) {
                        model[key] = value || '';
                    }
                    break;
            }
        });

        return model;
    }

    buildQuery(model: Model, apiFunction: string, refs: number,schema?:schemaType): string {
        let qr = '';
        try {
            let prs1 = '';
            let prs2 = '';

            for (let i = 1; i <= refs; i++) {
                prs1 += `${i > 1 ? ',' : ''}'r${i}'`;
                prs2 += `;fetch all in "r${i}"`;
            }

            const cleanedModel = this.setNullValues({ ...model });
            delete cleanedModel.$$hashKey;
            const modelString = JSON.stringify(cleanedModel).replace(/'/g, "''");

            qr = `select * from ${schema || 'public'}.et_${apiFunction} ('${modelString}',${prs1})${prs2};`;
        } catch (error) {
            this.logger.error(error);
        }

        // Assuming print_query is a side-effect you still want to perform:
        this.print_query(qr);
        return qr;
    }

    print_query(query: string): void {
        this.logger.log(query);
    }


}
