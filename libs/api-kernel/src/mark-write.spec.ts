import 'reflect-metadata';
import { INTERCEPTORS_METADATA } from '@nestjs/common/constants';
import { lastValueFrom, of } from 'rxjs';
import { MARK_WRITE_KEY, MarkWrite, MarkWriteHook, markWriteOf } from './mark-write';

/*
 * @MarkWrite on a shared handler is metadata realtime-server's interceptor reads plus the MarkWriteHook interceptor;
 * the hook runs the host's interceptor when one is bound and is a pass-through when none is.
 */

class Probe {
  @MarkWrite({ kind: 'F', op: 'update', idFrom: 'body.nFSid' }) save() {}
  plain() {}
}

describe('api-kernel mark-write', () => {
  it('@MarkWrite stores the spec under the key realtime-server reads and applies MarkWriteHook', () => {
    expect(Reflect.getMetadata(MARK_WRITE_KEY, Probe.prototype.save)).toEqual({ kind: 'F', op: 'update', idFrom: 'body.nFSid' });
    expect(MARK_WRITE_KEY).toBe('rt:mark-write');
    expect(Reflect.getMetadata(INTERCEPTORS_METADATA, Probe.prototype.save)).toEqual([MarkWriteHook]);
    expect(markWriteOf(Probe.prototype.save)).toEqual({ kind: 'F', op: 'update', idFrom: 'body.nFSid' });
    expect(markWriteOf(Probe.prototype.plain)).toBeNull();
    expect(markWriteOf(undefined)).toBeNull();
  });

  it('MarkWriteHook delegates to the bound hook, and passes through without one', async () => {
    const context = {} as never;
    const next = { handle: () => of('answer') };
    expect(await lastValueFrom(new MarkWriteHook().intercept(context, next) as never)).toBe('answer');
    const hook = { intercept: jest.fn(() => of('hooked')) };
    expect(await lastValueFrom(new MarkWriteHook(hook).intercept(context, next) as never)).toBe('hooked');
    expect(hook.intercept).toHaveBeenCalledWith(context, next);
  });
});
