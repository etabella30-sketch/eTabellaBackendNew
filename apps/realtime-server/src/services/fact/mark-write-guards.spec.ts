import { BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import {
  assertDocLinkTargets, assertIssuesInCase, assertTranscriptPosition, markIssueIds, withoutSelfShare,
} from './mark-write-guards';
import { markWriteKey, MARK_DEDUPE_WINDOW_MS, onceWithinWindow, resetMarkDedupe } from './mark-dedupe';
import { InsertQuickFact } from '../../interfaces/fact.interface';
import { MARK_LIMITS } from '@app/rt-features/doclink/dto/mark-limits';

const SES = 'cab684ae-5f07-494c-863b-a1fefce80676';
const CASE = 'f54bdcb9-0000-4000-8000-000000000001';
const ISSUE = '11111111-2222-4333-8444-555555555555';

describe('Day 3 Mark write guards', () => {
  describe('assertTranscriptPosition', () => {
    it('refuses a transcript Mark without coordinates', () => {
      expect(() => assertTranscriptPosition({ nSesid: SES, jCordinates: [] })).toThrow(BadRequestException);
    });
    it('refuses page 999,999 and line -5', () => {
      expect(() => assertTranscriptPosition({ nSesid: SES, jCordinates: [{ p: 999_999, l: 3 }] })).toThrow(/Page 999999/);
      expect(() => assertTranscriptPosition({ nSesid: SES, jCordinates: [{ p: 3, l: -5 }] })).toThrow(/Line -5/);
      expect(() => assertTranscriptPosition({ nSesid: SES, jCordinates: [{ p: 1.5, l: 3 }] })).toThrow(BadRequestException);
    });
    it('accepts a normal line', () => {
      expect(() => assertTranscriptPosition({ nSesid: SES, jCordinates: [{ p: 34, l: 7 }] })).not.toThrow();
    });
    it('ignores Marks that are not on a transcript', () => {
      expect(() => assertTranscriptPosition({ nSesid: null, jCordinates: [] })).not.toThrow();
    });
    it('refuses a page past a live session\'s feed, with slack for growth', () => {
      const live = { checkSessionExists: () => true, sessionTotalPages: () => 69 };
      expect(() => assertTranscriptPosition({ nSesid: SES, jCordinates: [{ p: 71, l: 1 }] }, live)).not.toThrow();
      expect(() => assertTranscriptPosition({ nSesid: SES, jCordinates: [{ p: 72, l: 1 }] }, live)).toThrow(/does not exist yet/);
    });
    it('bounds-checks only a session that is not live here (published pages run past the live count)', () => {
      const notLive = { checkSessionExists: () => false, sessionTotalPages: () => 0 };
      expect(() => assertTranscriptPosition({ nSesid: SES, jCordinates: [{ p: 292, l: 1 }] }, notLive)).not.toThrow();
    });
  });

  describe('assertDocLinkTargets', () => {
    it('refuses page 0, 99,999+ and start after end', () => {
      expect(() => assertDocLinkTargets(JSON.stringify([['d', { start: 0, end: 1 }]]))).toThrow(BadRequestException);
      expect(() => assertDocLinkTargets(JSON.stringify([['d', { start: 1, end: 100_001 }]]))).toThrow(BadRequestException);
      expect(() => assertDocLinkTargets(JSON.stringify([['d', { start: 5, end: 2 }]]))).toThrow(/after its end/);
      expect(() => assertDocLinkTargets(JSON.stringify([['d', { pages: [1, 0] }]]))).toThrow(BadRequestException);
    });
    it('accepts 1-page and 3-page targets', () => {
      expect(() => assertDocLinkTargets(JSON.stringify([['d', { start: 1, end: 1 }], ['e', { start: 2, end: 4, pages: [2, 3, 4] }]]))).not.toThrow();
      expect(() => assertDocLinkTargets(null)).not.toThrow();
    });
    it('refuses non-array JSON', () => {
      expect(() => assertDocLinkTargets('{"a":1}')).toThrow(BadRequestException);
    });
  });

  describe('issues', () => {
    it('collects ids from tuples, bare ids and nColorid', () => {
      expect(markIssueIds({ jIssues: JSON.stringify([[ISSUE, 1, 2]]), nColorid: ISSUE.toUpperCase() })).toEqual([ISSUE]);
    });
    it('refuses an issue that is not in the case', async () => {
      const db = { rowQuery: jest.fn().mockResolvedValue({ success: true, data: [] }) };
      await expect(assertIssuesInCase(db, { nCaseid: CASE, jIssues: JSON.stringify([[ISSUE, 1, 1]]) })).rejects.toThrow(/Unknown issue/);
      expect(db.rowQuery.mock.calls[0][1]).toEqual([[ISSUE], CASE]);
    });
    it('accepts a case issue and skips the query without issues', async () => {
      const db = { rowQuery: jest.fn().mockResolvedValue({ success: true, data: [{ id: ISSUE }] }) };
      await expect(assertIssuesInCase(db, { nCaseid: CASE, nColorid: ISSUE })).resolves.toBeUndefined();
      const none = { rowQuery: jest.fn() };
      await assertIssuesInCase(none, { nCaseid: CASE, jIssues: '[]' });
      expect(none.rowQuery).not.toHaveBeenCalled();
    });
    it('fails closed when the lookup fails', async () => {
      const db = { rowQuery: jest.fn().mockResolvedValue({ success: false }) };
      await expect(assertIssuesInCase(db, { nCaseid: CASE, nColorid: ISSUE })).rejects.toThrow(InternalServerErrorException);
    });
  });

  describe('withoutSelfShare', () => {
    it('drops the creator and keeps teammates', () => {
      const me = '37f37cf0-0000-4000-8000-000000000000';
      const mate = '043c3b64-0000-4000-8000-000000000000';
      const out = withoutSelfShare(JSON.stringify([{ nUserid: me, cPermission: 'V' }, { nUserid: mate, cPermission: 'V' }]), me.toUpperCase());
      expect(JSON.parse(out as string)).toEqual([{ nUserid: mate, cPermission: 'V' }]);
    });
    it('leaves the list untouched when the creator is not in it', () => {
      const raw = JSON.stringify([{ nUserid: 'x' }]);
      expect(withoutSelfShare(raw, 'me')).toBe(raw);
      expect(withoutSelfShare('not json', 'me')).toBe('not json');
    });
  });

  describe('DTO limits (InsertQuickFact)', () => {
    const base = { nCaseid: CASE, nSesid: SES, jCordinates: [{ t: '10:00:00:00', p: 1, l: 1, text: 'Q.' }] };
    const errorsFor = async (extra: Record<string, unknown>) =>
      (await validate(plainToInstance(InsertQuickFact, { ...base, ...extra }))).map(e => e.property);

    it('refuses a 1 MB selection and a 200 KB note', async () => {
      expect(await errorsFor({ jOT: JSON.stringify(['x'.repeat(MARK_LIMITS.selectedText)]) })).toContain('jOT');
      expect(await errorsFor({ jT: JSON.stringify(['x'.repeat(MARK_LIMITS.note)]) })).toContain('jT');
    });
    it('refuses malformed JSON in jIssues', async () => {
      expect(await errorsFor({ jIssues: '[[' })).toContain('jIssues');
      expect(await errorsFor({ jIssues: '{"a":1}' })).toContain('jIssues');
    });
    it('refuses more than 500 coordinates', async () => {
      const many = Array.from({ length: MARK_LIMITS.coordinates + 1 }, (_, i) => ({ t: '10:00:00:00', p: 1, l: (i % 25) + 1, text: 'x' }));
      expect(await errorsFor({ jCordinates: many })).toContain('jCordinates');
    });
    it('accepts a normal Mark', async () => {
      const errs = await errorsFor({ jOT: JSON.stringify(['Q. Did you see it?']), jT: JSON.stringify(['note']), jIssues: '[]' });
      expect(errs).not.toContain('jOT');
      expect(errs).not.toContain('jT');
      expect(errs).not.toContain('jIssues');
      expect(errs).not.toContain('jCordinates');
    });
  });

  describe('duplicate window', () => {
    beforeEach(() => resetMarkDedupe());
    const body = { nCaseid: CASE, nSesid: SES, jCordinates: [{ p: 3, l: 4, text: 'A. Yes.' }], jOT: '["A. Yes."]' };

    it('30 identical writes at once store one Mark', async () => {
      const write = jest.fn().mockImplementation(async () => ({ msg: 1, nFSid: 'f1' }));
      const key = markWriteKey('insertquickfact', 'u1', body);
      const replies = await Promise.all(Array.from({ length: 30 }, () => onceWithinWindow(key, write)));
      expect(write).toHaveBeenCalledTimes(1);
      expect(new Set(replies.map(r => (r as { nFSid?: string }).nFSid))).toEqual(new Set(['f1']));
    });
    it('another user, line or note is a different Mark', () => {
      const k = markWriteKey('insertquickfact', 'u1', body);
      expect(markWriteKey('insertquickfact', 'u2', body)).not.toBe(k);
      expect(markWriteKey('insertquickfact', 'u1', { ...body, jCordinates: [{ p: 3, l: 5, text: 'A. Yes.' }] })).not.toBe(k);
      expect(markWriteKey('insertquickfact', 'u1', { ...body, jT: '["n"]' })).not.toBe(k);
      expect(markWriteKey('insertfact', 'u1', body)).not.toBe(k);
      expect(markWriteKey('insertquickfact', undefined, body)).toBeNull();
    });
    it('runs again after the window', async () => {
      let t = 1_000;
      const write = jest.fn().mockResolvedValue({ msg: 1 });
      const key = markWriteKey('insertquickfact', 'u1', body);
      await onceWithinWindow(key, write, () => t);
      t += MARK_DEDUPE_WINDOW_MS;
      await onceWithinWindow(key, write, () => t);
      expect(write).toHaveBeenCalledTimes(2);
    });
    it('does not remember a refusal or failure', async () => {
      const key = markWriteKey('insertquickfact', 'u1', body);
      const refused = jest.fn().mockResolvedValue({ msg: -1 });
      await onceWithinWindow(key, refused);
      await onceWithinWindow(key, refused);
      expect(refused).toHaveBeenCalledTimes(2);
      const thrown = jest.fn().mockRejectedValue(new BadRequestException('x'));
      await expect(onceWithinWindow(key, thrown)).rejects.toThrow('x');
      await expect(onceWithinWindow(key, thrown)).rejects.toThrow('x');
      expect(thrown).toHaveBeenCalledTimes(2);
    });
  });
});
