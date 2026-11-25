import { MAX_PRIVATE_GROUPS, legacyPrivateGroupId, requestedPrivateGroups, savePrivateGroup } from './private-group-save';
const USER = '10000000-0000-4000-8000-000000000001';
const FACT = '20000000-0000-4000-8000-000000000001';
const GROUP = '30000000-0000-4000-8000-000000000001';
describe('Private Group complete-save stage', () => {
 it('uses verified caller identity rather than client nMasterid', async () => {
  const db: any = { executeRef: jest.fn().mockResolvedValue({ success: true, data: [[{ msg: 1 }]] }) };
  await savePrivateGroup(db, USER, { nMasterid: GROUP, nPrivateGroupid: GROUP }, { msg: 1, nFSid: FACT });
  expect(db.executeRef).toHaveBeenCalledWith('private_group_assign', { nMasterid: USER, nFSid: FACT, jPrivateGroupids: [GROUP], nPrivateGroupid: GROUP });
 });
 it.each([{ success: false }, { success: true, data: [[]] }, { success: true, data: [[{ msg: -1, value: 'Refused' }]] }])('refuses partial saves and lets the transaction roll back: %j', async result => {
  await expect(savePrivateGroup({ executeRef: jest.fn().mockResolvedValue(result) } as any, USER, { nPrivateGroupid: GROUP }, { nFSid: FACT })).rejects.toThrow();
 });
 it('says "mark", not "Fact", when the id cannot be identified', async () => {
  const db: any = { executeRef: jest.fn() };
  await expect(savePrivateGroup(db, USER, { nPrivateGroupid: GROUP }, { msg: 1 })).rejects.toThrow('The mark could not be identified');
  expect(db.executeRef).not.toHaveBeenCalled();
 });
 it('clears the association only when null was explicitly sent', async () => {
  const db: any = { executeRef: jest.fn().mockResolvedValue({ success: true, data: [[{ msg: 1 }]] }) };
  await savePrivateGroup(db, USER, { nPrivateGroupid: null, nFSid: FACT }, { msg: 1 });
  expect(db.executeRef.mock.calls[0][1].jPrivateGroupids).toEqual([]);
 });
 it.each([undefined, '', 'other-user'])('requires a verified UUID actor: %j', async actor => {
  const db: any = { executeRef: jest.fn() };
  await expect(savePrivateGroup(db, actor, { nPrivateGroupid: GROUP, nFSid: FACT }, {})).rejects.toThrow();
  expect(db.executeRef).not.toHaveBeenCalled();
 });
});

describe('requestedPrivateGroups', () => {
 const A = '30000000-0000-4000-8000-00000000000a';
 const B = '30000000-0000-4000-8000-00000000000b';
 const C = '30000000-0000-4000-8000-00000000000c';
 it('is undefined when neither key is present', () => { expect(requestedPrivateGroups({})).toBeUndefined(); });
 it('reads the legacy single id: null / empty clears, a uuid is one group', () => {
  expect(requestedPrivateGroups({ nPrivateGroupid: null })).toEqual([]);
  expect(requestedPrivateGroups({ nPrivateGroupid: '' })).toEqual([]);
  expect(requestedPrivateGroups({ nPrivateGroupid: A })).toEqual([A]);
 });
 it('lets the array win over the legacy key', () => {
  expect(requestedPrivateGroups({ jPrivateGroupids: [A, B], nPrivateGroupid: C })).toEqual([A, B]);
  expect(requestedPrivateGroups({ jPrivateGroupids: [] , nPrivateGroupid: C })).toEqual([]);
 });
 it('lower-cases, de-duplicates and keeps first-appearance order', () => {
  expect(requestedPrivateGroups({ jPrivateGroupids: [B.toUpperCase(), A, B, A.toUpperCase()] })).toEqual([B, A]);
 });
 it.each(['x', 5, null, {}, [1], ['x'], [A, 'nope']])('refuses %j', value => {
  expect(() => requestedPrivateGroups({ jPrivateGroupids: value })).toThrow('Choose a valid Private Group');
 });
 it('accepts exactly 50 ids and refuses 51, without truncating', () => {
  const ids = (n: number) => Array.from({ length: n }, (_, i) => `30000000-0000-4000-8000-${String(i).padStart(12, '0')}`);
  expect(MAX_PRIVATE_GROUPS).toBe(50);
  expect(requestedPrivateGroups({ jPrivateGroupids: ids(50) })).toHaveLength(50);
  expect(() => requestedPrivateGroups({ jPrivateGroupids: ids(51) })).toThrow('Choose a valid Private Group');
 });
 it('refuses a bad legacy id', () => {
  expect(() => requestedPrivateGroups({ nPrivateGroupid: 'x' })).toThrow('Choose a valid Private Group');
 });
 it('savePrivateGroup sends the array to the function, and its last id as the legacy key (R9)', async () => {
  const db: any = { executeRef: jest.fn().mockResolvedValue({ success: true, data: [[{ msg: 1 }]] }) };
  await savePrivateGroup(db, USER, { jPrivateGroupids: [A, B], nFSid: FACT }, { msg: 1 });
  expect(db.executeRef).toHaveBeenCalledWith('private_group_assign', { nMasterid: USER, nFSid: FACT, jPrivateGroupids: [A, B], nPrivateGroupid: B });
 });
 it('savePrivateGroup turns a legacy null into an empty list', async () => {
  const db: any = { executeRef: jest.fn().mockResolvedValue({ success: true, data: [[{ msg: 1 }]] }) };
  await savePrivateGroup(db, USER, { nPrivateGroupid: null, nFSid: FACT }, { msg: 1 });
  expect(db.executeRef.mock.calls[0][1].jPrivateGroupids).toEqual([]);
 });
 it.each([[{ nPrivateGroupid: null }], [{ jPrivateGroupids: [] }], [{ jPrivateGroupids: [], nPrivateGroupid: A }]])(
  'savePrivateGroup sends an empty list with the legacy key null (R9): %j', async body => {
  const db: any = { executeRef: jest.fn().mockResolvedValue({ success: true, data: [[{ msg: 1 }]] }) };
  await savePrivateGroup(db, USER, { ...body, nFSid: FACT }, { msg: 1 });
  expect(db.executeRef).toHaveBeenCalledWith('private_group_assign', { nMasterid: USER, nFSid: FACT, jPrivateGroupids: [], nPrivateGroupid: null });
 });
});

describe('legacyPrivateGroupId (R9: the single id the function before 2026-11-14 reads)', () => {
 const A = '30000000-0000-4000-8000-00000000000a';
 const B = '30000000-0000-4000-8000-00000000000b';
 it('is null for no group', () => { expect(legacyPrivateGroupId([])).toBeNull(); });
 it('is the only id of a one-element list', () => { expect(legacyPrivateGroupId([A])).toBe(A); });
 it('is the LAST id of a longer list (the most recently added one)', () => {
  expect(legacyPrivateGroupId([A, B])).toBe(B);
  expect(legacyPrivateGroupId([B, A])).toBe(A);
 });
 it('does not change the list it reads', () => {
  const list = [A, B];
  legacyPrivateGroupId(list);
  expect(list).toEqual([A, B]);
 });
});
