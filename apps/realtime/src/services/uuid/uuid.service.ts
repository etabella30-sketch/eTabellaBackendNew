import { Injectable } from '@nestjs/common';
const { v4: uuidv4 } = require('uuid');

@Injectable()
export class UuidService {

    generateUUID(): string {
        return uuidv4();
    }

}
