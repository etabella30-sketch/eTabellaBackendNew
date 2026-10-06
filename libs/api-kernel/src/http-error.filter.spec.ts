import { ArgumentsHost, BadRequestException, HttpException, NotFoundException } from '@nestjs/common';
import { FILTER_CATCH_EXCEPTIONS } from '@nestjs/common/constants';
import { HttpErrorFilter as LegacyHttpErrorFilter } from '@app/global/middleware/exception';
import { HttpErrorFilter } from './http-error.filter';

/*
 * The moved filter must answer byte for byte what libs/global's did: the apps' golden specs pin this body. Every case
 * runs through both the api-kernel class and the libs/global path (now a re-export), with a frozen clock so the
 * timestamp compares too.
 */

const T0 = Date.UTC(2026, 9, 6, 9, 30, 0);

function run(Filter: new () => { catch(exception: unknown, host: ArgumentsHost): void }, exception: unknown, jsonThrowsOnce = false) {
  const json = jest.fn().mockReturnThis();
  if (jsonThrowsOnce) json.mockImplementationOnce(() => { throw new Error('serialiser broke'); });
  const res = { status: jest.fn().mockReturnThis(), json };
  const host = { switchToHttp: () => ({ getResponse: () => res }) } as unknown as ArgumentsHost;
  new Filter().catch(exception, host);
  return { status: res.status.mock.calls.map((c) => c[0]), bodies: json.mock.calls.map((c) => c[0]) };
}

const circular: Record<string, unknown> = { statusCode: 500 };
circular.self = circular;

const CASES: Array<[string, () => unknown, boolean]> = [
  ['a string HttpException', () => new HttpException('Nope', 418), false],
  ['NotFoundException with its default object response', () => new NotFoundException(), false],
  ['NotFoundException with a custom message', () => new NotFoundException('No such file'), false],
  ['BadRequestException from the ValidationPipe', () => new BadRequestException(['nCaseid must be a UUID', 'property x should not exist']), false],
  ['an HttpException whose response carries cCode', () => new HttpException({ msg: -1, cCode: 'case_not_allowed', message: 'Not your case' }, 403), false],
  ['a plain Error', () => new Error('private database diagnostic'), false],
  ['a thrown string', () => 'oops', false],
  ['undefined', () => undefined, false],
  ['an unserialisable HttpException response', () => new HttpException(circular as Record<string, unknown>, 500), false],
  ['a response whose first json() throws', () => new HttpException('Nope', 400), true],
];

describe('HttpErrorFilter', () => {
  beforeEach(() => jest.useFakeTimers({ now: T0 }));
  afterEach(() => jest.useRealTimers());

  it.each(CASES)('answers %s exactly as libs/global did', (_label, make, jsonThrowsOnce) => {
    const moved = run(HttpErrorFilter, make(), jsonThrowsOnce);
    const legacy = run(LegacyHttpErrorFilter, make(), jsonThrowsOnce);
    expect(moved).toEqual(legacy);
    expect(moved.bodies[moved.bodies.length - 1]).toMatchObject({ timestamp: new Date(T0).toISOString() });
  });

  it('pins the legacy body shape the apps\' golden specs rely on', () => {
    expect(run(HttpErrorFilter, new HttpException({ msg: -1, cCode: 'case_not_allowed', message: 'Not your case' }, 403))).toEqual({
      status: [403],
      bodies: [{
        statusCode: 403,
        message: 'Not your case',
        detailedError: JSON.stringify({ msg: -1, cCode: 'case_not_allowed', message: 'Not your case' }),
        timestamp: new Date(T0).toISOString(),
      }],
    });
    expect(run(HttpErrorFilter, new BadRequestException(['nCaseid must be a UUID']))).toEqual({
      status: [400],
      bodies: [{
        statusCode: 400,
        message: 'Bad Request',
        detailedError: JSON.stringify({ message: ['nCaseid must be a UUID'], error: 'Bad Request', statusCode: 400 }),
        timestamp: new Date(T0).toISOString(),
      }],
    });
    expect(run(HttpErrorFilter, new Error('private database diagnostic'))).toEqual({
      status: [500],
      bodies: [{
        statusCode: 500,
        message: 'private database diagnostic',
        detailedError: '{"error":"private database diagnostic"}',
        timestamp: new Date(T0).toISOString(),
      }],
    });
    expect(run(HttpErrorFilter, undefined).bodies).toEqual([{
      statusCode: 500,
      message: 'Internal Server Error',
      detailedError: '{"error":"Internal Server Error"}',
      timestamp: new Date(T0).toISOString(),
    }]);
  });

  it('falls back to the plain body when the first answer cannot be written', () => {
    const { status, bodies } = run(HttpErrorFilter, new HttpException('Nope', 400), true);
    expect(status).toEqual([400, 400]);
    expect(bodies).toEqual([
      { statusCode: 400, message: 'An error occurred', detailedError: '"Nope"', timestamp: new Date(T0).toISOString() },
      { statusCode: 400, message: 'An error occurred', detailedError: 'Nope', timestamp: new Date(T0).toISOString() },
    ]);
  });

  it('catches everything (a @Catch() with no exception list)', () => {
    expect(Reflect.getMetadata(FILTER_CATCH_EXCEPTIONS, HttpErrorFilter)).toEqual([]);
  });

  it('is what the libs/global path still exports, so every main.ts keeps one filter class', () => {
    expect(LegacyHttpErrorFilter).toBe(HttpErrorFilter);
  });
});
