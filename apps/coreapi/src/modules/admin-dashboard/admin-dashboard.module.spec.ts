import { RequestMethod } from '@nestjs/common';
import { METHOD_METADATA, PATH_METADATA } from '@nestjs/common/constants';
import { AdminDashboardModule } from './admin-dashboard.module';
import { AdminDashboardController } from '../../controllers/admin-dashboard/admin-dashboard.controller';
import { JwtMiddleware } from '@app/global/middleware/jwt.middleware';
import { AdminMiddleware } from '@app/global/middleware/admin.middleware';

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

function controllerRoutes() {
    const proto = AdminDashboardController.prototype as any;
    return Object.getOwnPropertyNames(proto)
        .filter((name) => name !== 'constructor' && Reflect.hasMetadata(PATH_METADATA, proto[name]))
        .map((name) => ({
            path: `admin-dashboard/${Reflect.getMetadata(PATH_METADATA, proto[name])}`,
            method: Reflect.getMetadata(METHOD_METADATA, proto[name]) as RequestMethod,
        }));
}

describe('AdminDashboardModule middleware wiring', () => {
    const { consumer, chains } = recordConsumer();
    new AdminDashboardModule().configure(consumer);

    it('signs in, then requires super admin, on the whole controller with no exceptions', () => {
        expect(chains).toEqual([
            { middleware: [JwtMiddleware], exclude: [], routes: [AdminDashboardController] },
            { middleware: [AdminMiddleware], exclude: [], routes: [AdminDashboardController] },
        ]);
    });

    it('serves the RT Simulation source read and write behind that gate', () => {
        const routes = controllerRoutes();
        expect(routes).toContainEqual({ path: 'admin-dashboard/rtsimsource', method: RequestMethod.GET });
        expect(routes).toContainEqual({ path: 'admin-dashboard/rtsimsource', method: RequestMethod.POST });
    });
});
