/**
 * @app/rt-features — one folder per RT feature, shared by authapi, coreapi, realtime-server and the venue box
 * (apps/rt-edge). Phase 1 of the shared-libraries plan (2026-10-06) holds only this skeleton; Phase 5 adds the first
 * feature, team-users. Rules: README.md in this folder, enforced by rt-features.purity.spec.ts.
 *
 * Layout of a feature folder `src/<feature>/` (plan §3.2):
 *   index.ts                   barrel; hosts import `@app/rt-features/<feature>`
 *   dto/                       request classes with class-validator rules; never @nestjs/swagger (D9: live docs are
 *                              applied by libs/platform-cloud/src/docs/<feature>.docs.ts at live boot)
 *   <feature>.operations.ts    the operations port: `<FEATURE>_OPS` token + interface over domain data only; the
 *                              box binds a relay adapter or a local executor to it, the cloud binds the service
 *   <feature>.service.ts       the live executor over SP_EXECUTOR / ROW_QUERY / EVENT_DELIVERY (@app/api-kernel)
 *   http/                      the shared controllers, at controller scope @UseGuards(CallerGuard, CaseScopeGuard),
 *                              @UsePipes(new ValidationPipe(SHARED_VALIDATION)) and @UseFilters(DomainErrorFilter),
 *                              and ONE HTTP module class per URL family (a Nest module class mounts under one
 *                              RouterModule prefix only): e.g. TeamUsersCoreHttpModule, TeamUsersRealtimeHttpModule,
 *                              each `register({ operations })` over the same service
 *   testing/conformance.ts     fixtures and assertions every host's spec runs (gate G2)
 *   <feature>.purity.spec.ts   feature-level rules beyond the lib-wide R2 / R3 guard
 *
 * This root barrel exports nothing on purpose: a root re-export of every feature would pull every feature's
 * controllers into any bundle that needs one of them, and the box bundle must carry only what it mounts. Hosts
 * import a feature by its folder alias, `@app/rt-features/<feature>` (tsconfig `@app/rt-features/*`).
 */
export {};
