import { EDGE_EXIT, EDGE_USAGE, EdgeUsageError, parseEdgeArgs } from './cli.port';

describe('parseEdgeArgs', () => {
    it('serves by default, with or without --config', () => {
        expect(parseEdgeArgs([])).toEqual({ name: 'serve' });
        expect(parseEdgeArgs(['--config', 'box.json'])).toEqual({ name: 'serve' });
        expect(parseEdgeArgs(['--config=box.json'])).toEqual({ name: 'serve' });
        expect(parseEdgeArgs(['serve', '--config', 'box.json'])).toEqual({ name: 'serve' });
    });

    it('parses enroll', () => {
        expect(parseEdgeArgs(['enroll', '--code', 'abc123'])).toEqual({ name: 'enroll', code: 'abc123', cloud: null, rekey: false });
        expect(parseEdgeArgs(['--config', 'b.json', 'enroll', '--cloud=https://etabella.net', '--code=abc', '--rekey'])).toEqual({
            name: 'enroll',
            code: 'abc',
            cloud: 'https://etabella.net',
            rekey: true,
        });
    });

    it('parses status, recover and capture', () => {
        expect(parseEdgeArgs(['status'])).toEqual({ name: 'status', json: false });
        expect(parseEdgeArgs(['status', '--json'])).toEqual({ name: 'status', json: true });
        expect(parseEdgeArgs(['recover', '--journal', '/mnt/old/journal/s1'])).toEqual({ name: 'recover', journal: '/mnt/old/journal/s1', out: null });
        expect(parseEdgeArgs(['recover', '--journal', 'j', '--out', 'o.txt'])).toEqual({ name: 'recover', journal: 'j', out: 'o.txt' });
        expect(parseEdgeArgs(['capture', 'list'])).toEqual({ name: 'capture-list' });
        expect(parseEdgeArgs(['capture', 'upload'])).toEqual({ name: 'capture-upload', id: null });
        expect(parseEdgeArgs(['capture', 'upload', '--id', 'cap-1'])).toEqual({ name: 'capture-upload', id: 'cap-1' });
    });

    it('parses cert install (the v1 manual certificate path) with --key and --chain, --config anywhere', () => {
        expect(parseEdgeArgs(['cert', 'install', '--key', 'k.pem', '--chain=c.pem', '--config', '/etc/x.json'])).toEqual({ name: 'cert-install', key: 'k.pem', chain: 'c.pem' });
        expect(parseEdgeArgs(['--config', '/etc/x.json', 'cert', 'install', '--chain', 'c.pem', '--key', 'k.pem'])).toEqual({ name: 'cert-install', key: 'k.pem', chain: 'c.pem' });
        expect(parseEdgeArgs(['cert', 'install', '--help'])).toEqual({ name: 'help' });
        expect(EDGE_USAGE.split('\n')).toContain('  cert install --key <file> --chain <file>');
        // Listed before help, like every other command.
        expect(EDGE_USAGE.trimEnd().endsWith('  cert install --key <file> --chain <file>\n  help')).toBe(true);
    });

    it('answers help', () => {
        expect(parseEdgeArgs(['help'])).toEqual({ name: 'help' });
        expect(parseEdgeArgs(['status', '--help'])).toEqual({ name: 'help' });
        expect(parseEdgeArgs(['-h'])).toEqual({ name: 'help' });
    });

    it.each([
        [['frobnicate'], 'unknown command "frobnicate"'],
        [['enroll'], 'enroll needs --code'],
        [['enroll', '--code'], '--code needs a value'],
        [['enroll', '--code', '--rekey'], '--code needs a value'],
        [['enroll', '--code='], '--code needs a value'],
        [['enroll', '--code', 'a', '--rekey=yes'], '--rekey takes no value'],
        [['status', '--json=1'], '--json takes no value'],
        [['status', '--verbose'], 'unknown flag --verbose for status'],
        [['--json'], 'unknown flag --json for serve'],
        [['status', 'now'], 'unexpected argument now'],
        [['serve', 'extra'], 'unexpected argument extra'],
        [['recover'], 'recover needs --journal'],
        [['capture'], 'capture needs "list" or "upload"'],
        [['capture', 'delete'], 'capture needs "list" or "upload", not "delete"'],
        [['capture', 'list', 'x'], 'unexpected argument x'],
        [['status', '--json', '--json'], '--json given twice'],
        [['--'], 'bad flag --'],
        [['cert'], 'cert needs "install"'],
        [['cert', 'renew'], 'cert needs "install", not "renew"'],
        [['cert', 'install', '--key', 'k.pem'], 'cert install needs --chain'],
        [['cert', 'install', '--chain', 'c.pem'], 'cert install needs --key'],
        [['cert', 'install', '--key', 'k', '--chain', 'c', '--force'], 'unknown flag --force for cert install'],
        [['cert', 'install', 'extra', '--key', 'k', '--chain', 'c'], 'unexpected argument extra'],
        [['cert', 'install', '--key', '--chain', 'c'], '--key needs a value'],
        [['cert', 'install', '--key=', '--chain', 'c'], '--key needs a value'],
        [['cert', 'install', '--key', 'a', '--key', 'b', '--chain', 'c'], '--key given twice'],
        [['status', '--key', 'k.pem'], 'unknown flag --key for status'],
    ])('refuses %j', (argv, message) => {
        expect(() => parseEdgeArgs(argv as string[])).toThrow(EdgeUsageError);
        expect(() => parseEdgeArgs(argv as string[])).toThrow(message);
    });

    it('uses sysexits-style exit codes', () => {
        expect(EDGE_EXIT).toEqual({ ok: 0, failed: 1, usage: 64, software: 70, config: 78 });
    });
});
