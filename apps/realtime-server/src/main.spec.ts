import { refuseHeadRequests } from './middleware/realtime-http-surface';

// Runs the real bootstrap() in main.ts against a recording stand-in for the Nest app, to pin where
// the HTTP surface guards go: they only work if they are the first handlers on the Express stack,
// i.e. installed straight after NestFactory.create() and before anything else is registered.
// The pipeline spec (middleware/realtime-http-surface.pipeline.spec.ts) proves what they do there.

const mockSteps: string[] = [];
let mockListening: () => void;
const mockListened = new Promise<void>((resolve) => (mockListening = resolve));

const mockApp = {
  use: jest.fn((...handlers: any[]) => { mockSteps.push(`use:${handlers[0]?.name || 'anonymous'}`); }),
  // The static guard reads the controllers' route roots from Nest's ModulesContainer (a Map).
  get: jest.fn((token: any) => (token?.name === 'ModulesContainer'
    ? new Map()
    : { get: (): undefined => undefined, getValue: async (): Promise<null> => null })),
  useWebSocketAdapter: jest.fn(() => { mockSteps.push('useWebSocketAdapter'); }),
  connectMicroservice: jest.fn(() => { mockSteps.push('connectMicroservice'); }),
  startAllMicroservices: jest.fn(async () => { mockSteps.push('startAllMicroservices'); }),
  enableCors: jest.fn(() => { mockSteps.push('enableCors'); }),
  useGlobalPipes: jest.fn(() => { mockSteps.push('useGlobalPipes'); }),
  useGlobalFilters: jest.fn(() => { mockSteps.push('useGlobalFilters'); }),
  init: jest.fn(async () => { mockSteps.push('init'); }),
  listen: jest.fn(async () => { mockSteps.push('listen'); mockListening(); }),
};

jest.mock('dotenv', () => ({ config: jest.fn() }));
jest.mock('./realtime-server.module', () => ({ RealtimeServerModule: class RealtimeServerModule { } }));
jest.mock('@nestjs/swagger', () => ({
  ...jest.requireActual('@nestjs/swagger'),
  SwaggerModule: { createDocument: jest.fn(() => ({})), setup: jest.fn() },
}));
jest.mock('@nestjs/core', () => ({
  ...jest.requireActual('@nestjs/core'),
  NestFactory: { create: jest.fn(async () => { mockSteps.push('create'); return mockApp; }) },
}));

describe('realtime-server bootstrap (main.ts)', () => {
  beforeAll(async () => {
    jest.spyOn(console, 'log').mockImplementation(() => undefined); // kafka options log the brokers
    require('./main');
    await mockListened;
  });

  afterAll(() => jest.restoreAllMocks());

  it('installs the HEAD refusal and the static allowlist guard first, right after NestFactory.create()', () => {
    expect(mockSteps.slice(0, 3)).toEqual(['create', 'use:refuseHeadRequests', 'use:blockNonPublicStaticFiles']);
    expect(mockApp.use.mock.calls[0]).toEqual([refuseHeadRequests]);
    expect(mockApp.use.mock.calls[1]).toHaveLength(1);
  });

  it('registers them before the other middleware and before listen() initialises the app', () => {
    const guard = mockSteps.indexOf('use:blockNonPublicStaticFiles');
    for (const later of ['use:jsonParser', 'use:cookieParser', 'enableCors', 'use:compression', 'listen']) {
      expect(mockSteps.indexOf(later)).toBeGreaterThan(guard);
    }
    expect(mockSteps.filter((s) => s === 'use:refuseHeadRequests' || s === 'use:blockNonPublicStaticFiles')).toHaveLength(2);
  });
});
