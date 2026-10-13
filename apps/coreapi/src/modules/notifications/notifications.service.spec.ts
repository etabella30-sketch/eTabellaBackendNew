import { BadRequestException, InternalServerErrorException, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { Caller } from '@app/api-kernel';
import { DISMISS_SQL, INBOX_SQL, SEEN_SQL, TARGET_SQL } from './notifications.query';
import { notificationKind, NotificationsService } from './notifications.service';

const ME='11111111-1111-4111-8111-111111111111';
const ID='22222222-2222-4222-8222-222222222222';
const CASE='33333333-3333-4333-8333-333333333333';
const DOC='44444444-4444-4444-8444-444444444444';
const caller: Caller={userId:ME,family:'cloud-jwt',caseScope:'membership',isPlatformAdmin:false};
const row=(id=ID)=>({id,seen:false,cStatus:'F',sourceType:'LS',occurredAt:'2026-10-08T08:00:00Z',caseId:CASE,caseName:'Case',target:{type:'document',caseId:CASE,documentId:DOC,name:'Visible file'}});

describe('global notification inbox',()=>{
  let db: {rowQuery:jest.Mock}; let service: NotificationsService;
  beforeEach(()=>{db={rowQuery:jest.fn().mockResolvedValue({success:true,data:[{items:[row()],unseenCount:2}]})};service=new NotificationsService(db as any);});
  it('lists all cases with the token owner; preserves unread even when push failed',async()=>{
    const result=await service.inbox(caller);
    expect(db.rowQuery).toHaveBeenCalledWith(INBOX_SQL,[ME,31,null,null]);
    expect(result).toEqual({items:[{id:ID,kind:'shared-document',title:'Document shared with you',body:'Visible file',caseId:CASE,caseName:'Case',documentId:DOC,occurredAt:'2026-10-08T08:00:00Z',seen:false}],unseenCount:2});
  });
  it('preserves microseconds in the cursor so notices within the same millisecond are not skipped',async()=>{
    const time='2026-10-08T08:00:00.000987Z';db.rowQuery.mockResolvedValue({success:true,data:[{items:[{...row(),occurredAt:time},row()],unseenCount:2}]});
    const result=await service.inbox(caller,{limit:1});expect(result.nextCursor.before).toBe(time);
  });
  it('paginates with the last returned row, not the extra row',async()=>{
    const other='55555555-5555-4555-8555-555555555555';db.rowQuery.mockResolvedValue({success:true,data:[{items:[row(),row(other)],unseenCount:5}]});
    const result=await service.inbox(caller,{limit:1});expect(result.nextCursor).toEqual({before:'2026-10-08T08:00:00Z',beforeId:ID});
    await service.inbox(caller,result.nextCursor);expect(db.rowQuery).toHaveBeenLastCalledWith(INBOX_SQL,[ME,31,result.nextCursor.before,ID]);
  });
  it.each([{limit:0},{limit:101},{limit:1.5},{limit:'abc'},{before:'2026-10-08T08:00:00Z'},{beforeId:ID},{before:'yesterday',beforeId:ID},{before:'2026-10-08T08:00:00Z',beforeId:'bad'},{before:'',beforeId:''},{before:'2026-02-30T08:00:00Z',beforeId:ID}])('rejects invalid pagination %p',async query=>{
    await expect(service.inbox(caller,query)).rejects.toBeInstanceOf(BadRequestException);expect(db.rowQuery).not.toHaveBeenCalled();
  });
  it('does not use stored titles/bodies for unverifiable legacy notices',async()=>{
    db.rowQuery.mockResolvedValue({success:true,data:[{items:[{...row(),sourceType:'CS',target:{type:'case',caseId:CASE},cTitle:'Private file name',cMsg:'Private details'}],unseenCount:1}]});
    const result=await service.inbox(caller);expect(result.items[0]).toMatchObject({kind:'case-update',title:'Case update'});expect(result.items[0].body).toBeUndefined();expect(JSON.stringify(result)).not.toContain('Private');
  });
  it('resolves fresh access and returns404 after revocation, not stored metadata',async()=>{
    db.rowQuery.mockResolvedValue({success:true,data:[]});await expect(service.target(caller,ID)).rejects.toBeInstanceOf(NotFoundException);expect(db.rowQuery).toHaveBeenCalledWith(TARGET_SQL,[ME,ID]);
  });
  it('marks only explicit IDs and dismisses reversibly',async()=>{
    db.rowQuery.mockResolvedValue({success:true,data:[{id:ID}]});expect(await service.change(caller,{notificationIds:[ID,ID]},'seen')).toEqual({ok:true,updated:1});expect(db.rowQuery).toHaveBeenCalledWith(SEEN_SQL,[ME,[ID]]);
    await service.change(caller,{all:true},'dismiss');expect(db.rowQuery).toHaveBeenLastCalledWith(DISMISS_SQL,[ME,null]);expect(DISMISS_SQL).not.toContain('DELETE');
  });
  it.each([{}, {all:false},{all:true,notificationIds:[ID]},{notificationIds:[]},{notificationIds:['bad']},{all:'true'}])('refuses ambiguous mutation %p',async body=>{
    await expect(service.change(caller,body as any,'seen')).rejects.toBeInstanceOf(BadRequestException);expect(db.rowQuery).not.toHaveBeenCalled();
  });
  it('fails closed on invalid caller and database fault',async()=>{
    await expect(service.inbox(null)).rejects.toBeInstanceOf(UnauthorizedException);
    db.rowQuery.mockResolvedValue({success:false,error:'internal details'});await expect(service.inbox(caller)).rejects.toBeInstanceOf(InternalServerErrorException);
  });
  it('maps supported typed targets consistently',()=>{
    expect(notificationKind({sourceType:'COMMENT-ADDED',target:{type:'annotation',annotationId:ID}})).toBe('comment');
    expect(notificationKind({sourceType:'CS',target:{type:'evidence',sectionId:ID}})).toBe('shared-folder');
    expect(notificationKind({sourceType:'',target:{type:'evidence',uploadId:ID}})).toBe('file-upload');
    expect(notificationKind({sourceType:'TASK-SHARE',target:{type:'workspace',taskId:ID}})).toBe('task');
  });
});
