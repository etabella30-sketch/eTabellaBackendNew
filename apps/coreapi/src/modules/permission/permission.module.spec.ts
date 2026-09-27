import { RequestMethod } from '@nestjs/common';
import { METHOD_METADATA, PATH_METADATA } from '@nestjs/common/constants';
import { PermissionModule } from './permission.module';
import { PermissionController } from '../../controllers/permission/permission.controller';
import { JwtMiddleware } from '@app/global/middleware/jwt.middleware';
import { CaseAdminMiddleware } from '@app/global/middleware/case.admin.middleware';

/** Records what configure() applies, excludes and binds. */
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

/** Every handler of PermissionController as { path: 'permission/<x>', method }. */
function controllerRoutes() {
    const proto = PermissionController.prototype as any;
    return Object.getOwnPropertyNames(proto)
        .filter((name) => name !== 'constructor' && Reflect.hasMetadata(PATH_METADATA, proto[name]))
        .map((name) => ({
            path: `permission/${Reflect.getMetadata(PATH_METADATA, proto[name])}`,
            method: Reflect.getMetadata(METHOD_METADATA, proto[name]) as RequestMethod,
        }));
}

describe('PermissionModule middleware wiring', () => {
    const { consumer, chains } = recordConsumer();
    new PermissionModule().configure(consumer);
    const [jwtChain, caseAdminChain] = chains;

    it('authenticates every permission route first', () => {
        expect(jwtChain.middleware).toEqual([JwtMiddleware]);
        expect(jwtChain.routes).toEqual([PermissionController]);
        expect(jwtChain.exclude).toEqual([]);
    });

    it('then requires case-admin rights on the controller', () => {
        expect(chains).toHaveLength(2);
        expect(caseAdminChain.middleware).toEqual([CaseAdminMiddleware]);
        expect(caseAdminChain.routes).toEqual([PermissionController]);
    });

    it("exempts only the two GET reads of the caller's own permissions", () => {
        expect(caseAdminChain.exclude).toEqual([
            { path: 'permission/casepermission', method: RequestMethod.GET },
            { path: 'permission/permissionlist', method: RequestMethod.GET },
        ]);
        const routes = controllerRoutes();
        for (const ex of caseAdminChain.exclude) {
            expect(routes).toContainEqual(ex);
        }
    });

    it('gates every write route', () => {
        const writes = controllerRoutes().filter((r) => r.method !== RequestMethod.GET);
        expect(writes.map((r) => r.path).sort()).toEqual([
            'permission/resetpermission', 'permission/rolestatus', 'permission/updatemodule',
            'permission/updatequota', 'permission/usermanage',
        ]);
        for (const w of writes) {
            expect(caseAdminChain.exclude.some((ex) => ex.path === w.path)).toBe(false);
        }
    });
});
