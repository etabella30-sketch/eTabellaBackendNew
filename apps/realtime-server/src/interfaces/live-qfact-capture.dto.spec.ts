import { BadRequestException, ValidationPipe } from '@nestjs/common';
import { LiveQfactCaptureRequest } from './live-qfact-capture.dto';

const request={nCaseid:'33333333-3333-4333-8333-333333333333',nSesid:'44444444-4444-4444-8444-444444444444',
  nRequestid:'77777777-7777-4777-8777-777777777777',cRun:'live-run',identity:'line-1',page:1,line:1,action:'mark'};
const pipe=new ValidationPipe({transform:true,whitelist:true,forbidNonWhitelisted:true});
const validate=(body:unknown)=>pipe.transform(body,{type:'body',metatype:LiveQfactCaptureRequest});
describe('live QFACT transport validation',()=>{
  it('accepts a line reference without Issue, note, text or timestamps',async()=>{
    expect(await validate(request)).toEqual(request);
  });
  it.each(['text','hearing','time','nColorid','jIssues','createdAt'])('refuses client-supplied %s',async field=>{
    await expect(validate({...request,[field]:'untrusted'})).rejects.toBeInstanceOf(BadRequestException);
  });
  it.each([{line:0},{page:-1},{action:'delete'},{identity:''},{nRequestid:'bad-id'}])('rejects malformed line requests: %p',async extra=>{
    await expect(validate({...request,...extra})).rejects.toBeInstanceOf(BadRequestException);
  });
});
