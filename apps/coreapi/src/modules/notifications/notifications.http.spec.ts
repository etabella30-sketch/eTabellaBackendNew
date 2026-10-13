import { INestApplication, MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import * as jwt from 'jsonwebtoken';
import * as request from 'supertest';
import { DbService } from '@app/global/db/pg/db.service';
import { RedisDbService } from '@app/global/db/redis-db/redis-db.service';
import { JwtMiddleware } from '@app/global/middleware/jwt.middleware';
import { installHttpSurfaceGuards } from '../../http-surface';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';

const ME='11111111-1111-4111-8111-111111111111',OTHER='22222222-2222-4222-8222-222222222222',ID='33333333-3333-4333-8333-333333333333';
const SECRET='notification-http-fixture-secret';
const db={rowQuery:jest.fn(),executeRef:jest.fn()};
@Module({controllers:[NotificationsController],providers:[NotificationsService,
  {provide:DbService,useValue:db},{provide:RedisDbService,useValue:{getValue:async()=>JSON.stringify({id:'fixture-browser',a:true})}},
  {provide:ConfigService,useValue:{get:(key:string)=>key==='JWT_SECRET' ? SECRET : undefined}}]})
class FixtureModule implements NestModule {configure(c:MiddlewareConsumer){c.apply(JwtMiddleware).forRoutes(NotificationsController);}}

describe('authenticated notification HTTP boundary',()=>{
  let app: INestApplication;
  beforeAll(async()=>{jest.spyOn(console,'log').mockImplementation(()=>undefined);const module=await Test.createTestingModule({imports:[FixtureModule]}).compile();app=module.createNestApplication({logger:false});installHttpSurfaceGuards(app);await app.init();});
  afterAll(async()=>{await app?.close();jest.restoreAllMocks();});
  beforeEach(()=>db.rowQuery.mockReset().mockResolvedValue({success:true,data:[{items:[],unseenCount:0}]}));
  const auth=()=>`Bearer ${jwt.sign({userId:ME,broweserId:'fixture-browser'},SECRET)}`;
  it('overwrites spoofed query identity and lists globally',async()=>{
    const res=await request(app.getHttpServer()).get('/notifications/inbox').query({nMasterid:OTHER,nUserid:OTHER}).set('Authorization',auth());
    expect(res.status).toBe(200);expect(res.body).toEqual({items:[],unseenCount:0});expect(db.rowQuery.mock.calls[0][1][0]).toBe(ME);
  });
  it('cannot mutate another account via client identity',async()=>{
    db.rowQuery.mockResolvedValue({success:true,data:[]});const res=await request(app.getHttpServer()).post('/notifications/seen').send({notificationIds:[ID],nMasterid:OTHER,nUserid:OTHER}).set('Authorization',auth());
    expect(res.status).toBe(201);expect(res.body).toEqual({ok:true,updated:0});expect(db.rowQuery.mock.calls[0][1]).toEqual([ME,[ID]]);
  });
  it('requires JWT and a bound browser session',async()=>{
    expect((await request(app.getHttpServer()).get('/notifications/inbox')).status).toBe(403);
    const wrong=jwt.sign({userId:ME,broweserId:'wrong'},SECRET);expect((await request(app.getHttpServer()).get('/notifications/inbox').set('Authorization','Bearer '+wrong)).status).toBe(401);expect(db.rowQuery).not.toHaveBeenCalled();
  });
  it('returns404 when resolving an owned notice that is no longer visible',async()=>{
    db.rowQuery.mockResolvedValue({success:true,data:[]});const res=await request(app.getHttpServer()).get(`/notifications/${ID}/target`).set('Authorization',auth());expect(res.status).toBe(404);
  });
  it('HEAD cannot bypass JWT and run the GET handler',async()=>{
    expect((await request(app.getHttpServer()).head('/notifications/inbox')).status).toBe(405);expect(db.rowQuery).not.toHaveBeenCalled();
  });
});
