import { Injectable } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
@Injectable()
export class PasswordHashService {


    async hashPassword(password: string): Promise<string> {
        const saltRounds = 10; // The cost factor controls how much time is needed to calculate a single bcrypt hash. Higher is slower.
        const hash = await bcrypt.hash(password, saltRounds);
        return hash;
    }

    async verifyPassword(password: string, hash: string): Promise<boolean> {
        return await bcrypt.compare(password, hash);
    }
}
