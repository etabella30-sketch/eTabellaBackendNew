import { NOTIFICATION_TARGET_SQL, resolveNotificationTarget } from './notification-target';
const USER='11111111-1111-4111-8111-111111111111',CASE='22222222-2222-4222-8222-222222222222',DOC='33333333-3333-4333-8333-333333333333';
describe('notification recipient access port',()=>{
  it('uses recipient and case as parameterized trusted IDs and returns only fresh resolved metadata',async()=>{
    const target={type:'document' as const,documentId:DOC,caseId:CASE};const resolved={...target,name:'Current permitted name'};const db={rows:jest.fn().mockResolvedValue([{target:resolved}])};
    expect(await resolveNotificationTarget(db,USER,target,CASE)).toEqual(resolved);expect(db.rows).toHaveBeenCalledWith(NOTIFICATION_TARGET_SQL,[USER,JSON.stringify(target),CASE]);
  });
  it('refuses invalid identities without querying, and fails closed on null resolver result',async()=>{
    const db={rows:jest.fn().mockResolvedValue([{target:null}])};const target={type:'information' as const};
    expect(await resolveNotificationTarget(db,'bad',target)).toBeNull();expect(db.rows).not.toHaveBeenCalled();expect(await resolveNotificationTarget(db,USER,target)).toBeNull();
  });
  it('propagates storage failures so a producer cannot deliver using unverified old labels',async()=>{
    const db={rows:jest.fn().mockRejectedValue(new Error('unavailable'))};await expect(resolveNotificationTarget(db,USER,{type:'information'})).rejects.toThrow('unavailable');
  });
});
