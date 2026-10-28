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

  describe('R3-003 / R4-004 (RT QA 2026-10-28): share notices carry kind, place, sharer and level; a non-share document notice is not a share',()=>{
    const SHARER='66666666-6666-4666-8666-666666666666';
    const mark=(sourceType:string,target:Record<string,unknown>,extra:Record<string,unknown>={})=>({...row(),sourceType,sharerId:SHARER,sharerName:'Jane Doe',target,...extra});
    const annotation={type:'annotation',caseId:CASE,annotationId:ID,sourceType:'F',documentId:DOC,sessionId:undefined,page:12,line:4,level:'edit'};

    it('FS: "Mark shared with you", the body "Fact · p12:4 · by Jane Doe · Can edit", and the fields the bell renders',async()=>{
      db.rowQuery.mockResolvedValue({success:true,data:[{items:[mark('FS',annotation)],unseenCount:1}]});
      const [item]=(await service.inbox(caller)).items;
      expect(item).toEqual({id:ID,kind:'shared-annotation',title:'Mark shared with you',body:'Fact · p12:4 · by Jane Doe · Can edit',caseId:CASE,caseName:'Case',
        occurredAt:'2026-10-08T08:00:00Z',seen:false,markKind:'F',page:12,line:4,sharerName:'Jane Doe',level:'edit',action:'shared'});
    });

    it('FS to the Mark\'s owner (level owner) is the creator\'s "shared onward" notice (R4-001); DS is a DocLink; QF reads QFact',async()=>{
      db.rowQuery.mockResolvedValue({success:true,data:[{items:[
        mark('FS',{...annotation,level:'owner'}),
        mark('DS',{...annotation,sourceType:'D',level:'read'}),
        mark('FS',{...annotation,sourceType:'QF',page:3,line:undefined,level:'share'}),
      ],unseenCount:3}]});
      const {items}=await service.inbox(caller);
      expect(items.map(i=>[i.title,i.body,i.action])).toEqual([
        ['Mark shared onward','Fact · p12:4 · by Jane Doe','reshared'],
        ['Mark shared with you','DocLink · p12:4 · by Jane Doe · Read only','shared'],
        ['Mark shared with you','QFact · p3 · by Jane Doe · Can share','shared'],
      ]);
      expect(items[1]).toMatchObject({kind:'shared-annotation',markKind:'D',level:'read'});
      expect(items[2]).not.toHaveProperty('line');
    });

    it('FS-LEVEL and COMMENT-ADDED keep the annotation; FS-REMOVED targets the case (no page, level or Mark open) and still names the Fact and the sharer',async()=>{
      db.rowQuery.mockResolvedValue({success:true,data:[{items:[
        mark('FS-LEVEL',{...annotation,level:'comment'}),
        mark('COMMENT-ADDED',annotation),
        mark('FS-REMOVED',{type:'case',caseId:CASE}),
      ],unseenCount:3}]});
      const {items}=await service.inbox(caller);
      expect(items[0]).toMatchObject({kind:'shared-annotation',title:'Mark access changed',body:'Fact · p12:4 · by Jane Doe · Can comment',action:'level',level:'comment'});
      expect(items[1]).toMatchObject({kind:'comment',title:'New comment on your Mark',body:'Fact · p12:4 · by Jane Doe',action:'comment'});
      expect(items[2]).toEqual({id:ID,kind:'case-update',title:'Mark no longer shared',body:'Fact · by Jane Doe',caseId:CASE,caseName:'Case',
        occurredAt:'2026-10-08T08:00:00Z',seen:false,markKind:'F',sharerName:'Jane Doe',action:'removed'});
      // The copy says Mark, never annotation (the kind `shared-annotation` is the wire contract and stays).
      expect(items.map(i=>`${i.title} ${i.body}`).join(' ')).not.toMatch(/annotation/i);
    });

    it('a Mark on a live session resolved to the case (nt_resolve_target, R3-001) still reads as a share and sends the reader to the case, not the Reader',async()=>{
      db.rowQuery.mockResolvedValue({success:true,data:[{items:[mark('FS',{type:'case',caseId:CASE})],unseenCount:1}]});
      const [item]=(await service.inbox(caller)).items;
      expect(item).toMatchObject({kind:'case-update',title:'Mark shared with you',body:'Fact · by Jane Doe',action:'shared'});
      expect(item).not.toHaveProperty('documentId');
    });

    it('an unverified sharer name is left out of the body, never the stored text',async()=>{
      db.rowQuery.mockResolvedValue({success:true,data:[{items:[mark('FS',annotation,{sharerName:null,cTitle:'Secret',cMsg:'Private'})],unseenCount:1}]});
      const [item]=(await service.inbox(caller)).items;
      expect(item.body).toBe('Fact · p12:4 · Can edit');
      expect(item).not.toHaveProperty('sharerName');
      expect(JSON.stringify(item)).not.toMatch(/Secret|Private/);
    });

    it('R3-003: a document-target notice from a job (no cType, hyperlink/index) is a document update, never "Document shared with you"; LS and CS stay shares',async()=>{
      db.rowQuery.mockResolvedValue({success:true,data:[{items:[{...row(),sourceType:null},{...row(),sourceType:'CS'}],unseenCount:2}]});
      const {items}=await service.inbox(caller);
      expect(items[0]).toMatchObject({kind:'document-update',title:'Document update',body:'Visible file',documentId:DOC});
      expect(items[0].title).not.toBe('Document shared with you');
      expect(items[1]).toMatchObject({kind:'shared-document',title:'Document shared with you'});
      expect(notificationKind({sourceType:'HL',target:{type:'document',documentId:DOC}})).toBe('document-update');
      expect(notificationKind({sourceType:'LS',target:{type:'document',documentId:DOC}})).toBe('shared-document');
      expect(notificationKind({sourceType:'U',target:{type:'document',documentId:DOC}})).toBe('file-upload');
    });

    it('R3-003: a share notice addressed to its own sharer is excluded in SQL, so it is neither listed nor counted; the sharer name is verified against the case team',()=>{
      expect(INBOX_SQL).toContain(`AND NOT (upper(coalesce(n."cType",'')) IN ('FS','FS-LEVEL','FS-REMOVED','DS','LS','CS','WS','TASK-SHARE') AND n."nRefuserid"=$1::uuid)`);
      expect(INBOX_SQL).toContain(`LEFT JOIN public."UserMaster" ru ON ru."nUserid"=(n.notice)."nRefuserid" AND EXISTS (`);
      expect(INBOX_SQL).toContain(`AS "sharerName"`);
      expect(INBOX_SQL).not.toContain('"cTitle"');
      expect(INBOX_SQL).not.toContain('"cMsg"');
    });
  });
});
