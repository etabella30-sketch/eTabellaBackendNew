import { parseArgs, UsageError } from './args';

const SPEC = { '--fe': 'value', '--tag': 'value', '--dry-run': 'flag', '--allow-missing': 'flag' };

describe('parseArgs', () => {
  it('reads values in both spellings and camelCases the keys', () => {
    expect(parseArgs(['--fe', '../fe', '--tag=v1', '--dry-run', '--allow-missing'], SPEC)).toEqual({
      fe: '../fe',
      tag: 'v1',
      dryRun: true,
      allowMissing: true,
    });
  });

  it('keeps an "=" inside a value', () => {
    expect(parseArgs(['--fe=a=b'], SPEC)).toEqual({ fe: 'a=b' });
  });

  it('returns nothing for no arguments', () => {
    expect(parseArgs([], SPEC)).toEqual({});
  });

  it.each([
    [['--nope'], 'unknown option: --nope'],
    [['stray'], 'unexpected argument: stray'],
    [['--fe'], '--fe needs a value'],
    [['--fe', '--dry-run'], '--fe needs a value'],
    [['--fe='], '--fe needs a value'],
    [['--dry-run=yes'], '--dry-run takes no value'],
    [['--fe', 'a', '--fe', 'b'], 'option given twice: --fe'],
    [['--dry-run', '--dry-run'], 'option given twice: --dry-run'],
  ])('rejects %j', (argv, message) => {
    expect(() => parseArgs(argv, SPEC)).toThrow(UsageError);
    expect(() => parseArgs(argv, SPEC)).toThrow(message);
  });
});
