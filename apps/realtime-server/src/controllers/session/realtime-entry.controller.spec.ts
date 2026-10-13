import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { RealtimeEntryController } from './realtime-entry.controller';
import { RealtimeEntryService } from '../../services/session/realtime-entry.service';
import { RealtimeServerModule } from '../../realtime-server.module';
import { RealtimeAuthMiddleware } from '../../middleware/realtime-auth.middleware';

const ME='10000000-0000-4000-8000-000000000001',CASE='20000000-0000-4000-8000-000000000001';
const SES='30000000-0000-4000-8000-000000000001',EVENT='40000000-0000-4000-8000-000000000001';
describe('Realtime entry HTTP contract',()=>{
 let app:INestApplication; const user={userId:ME,isAdmin:false};
 const entry={status:jest.fn(async()=>({caseId:CASE,current:{sessionId:SES,eventId:EVENT}})),notifications:jest.fn(async()=>[]),updateNotification:jest.fn(async()=>({ok:true}))};
 beforeAll(async()=>{
  const module=await Test.createTestingModule({controllers:[RealtimeEntryController],providers:[{provide:RealtimeEntryService,useValue:entry}]}).compile();
  app=module.createNestApplication();app.use((req:any,_res:any,next:any)=>{req.user=user;next();});await app.init();
 });
 afterAll(()=>app.close());beforeEach(()=>jest.clearAllMocks());
 it('passes exact session/event and the verified caller, ignoring forged query user IDs',async()=>{
  await request(app.getHttpServer()).get('/session/entry-status').query({nCaseid:CASE,nSesid:SES,nEventid:EVENT,nUserid:'forged',nMasterid:'forged'}).expect(200);
  expect(entry.status).toHaveBeenCalledWith(CASE,SES,user,EVENT);
 });
 it('lists notifications scoped by verified caller and optional case',async()=>{
  await request(app.getHttpServer()).get('/session/entry-notifications').query({nCaseid:CASE,nMasterid:'forged'}).expect(200,[]);
  expect(entry.notifications).toHaveBeenCalledWith(CASE,user);
 });
 it.each([['seen',false],['dismiss',true]])('notification %s cannot override the caller',async(path,dismiss)=>{
  await request(app.getHttpServer()).post('/session/entry-notifications/'+path).send({notificationId:EVENT,nUserid:'forged'}).expect(201,{ok:true});
  expect(entry.updateNotification).toHaveBeenCalledWith(EVENT,dismiss,user);
 });
 it('the actual module mounts the controller behind the existing verified-user authentication middleware',()=>{
  const registrations:Array<{middleware:any[];routes:any[]}> = [];
  const consumer:any={apply:(...middleware:any[])=>({exclude:()=>({forRoutes:(...routes:any[])=>registrations.push({middleware,routes})}),forRoutes:(...routes:any[])=>registrations.push({middleware,routes})})};
  new RealtimeServerModule().configure(consumer);
  expect(registrations.find(x=>x.routes.includes(RealtimeEntryController))?.middleware).toContain(RealtimeAuthMiddleware);
 });
});
