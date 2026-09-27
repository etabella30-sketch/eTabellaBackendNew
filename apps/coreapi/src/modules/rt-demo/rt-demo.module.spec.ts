import { RtDemoModule } from './rt-demo.module';
import { RtDemoController } from '../../controllers/rt-demo/rt-demo.controller';
import { JwtMiddleware } from '@app/global/middleware/jwt.middleware';

function recordConsumer() {
    const chains: { middleware: any[]; exclude: any[]; routes: any[] }[] = [];
    const consumer: any = {
        apply: (...middleware: any[]) => {
            const chain = { middleware, exclude: [], routes: [] };
            chains.push(chain);
            const proxy = {
                exclude: (...routes: any[]) => { chain.exclude.push(...routes); return proxy; },
                forRoutes: (...routes: any[]) => { chain.routes.push(...routes); return consumer; },
            };
            return proxy;
        },
    };
    return { consumer, chains };
}

describe('RtDemoModule middleware wiring', () => {
    it('requires sign-in on every route and nothing case-scoped (nobody is a member of the source case)', () => {
        const { consumer, chains } = recordConsumer();
        new RtDemoModule().configure(consumer);
        expect(chains).toEqual([{ middleware: [JwtMiddleware], exclude: [], routes: [RtDemoController] }]);
    });
});
