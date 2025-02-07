import { cleanupChildProcesses, createRunner } from '../../../utils/runner';

describe('redis auto instrumentation', () => {
  afterAll(() => {
    cleanupChildProcesses();
  });

  test('should auto-instrument `ioredis` package when using redis.set() and redis.get()', done => {
    const EXPECTED_TRANSACTION = {
      transaction: 'Test Transaction',
      spans: expect.arrayContaining([
        expect.objectContaining({
          description: 'set test-key [1 other arguments]',
          op: 'db',
          data: expect.objectContaining({
            'db.system': 'redis',
            'net.peer.name': 'localhost',
            'net.peer.port': 6379,
            'db.statement': 'set test-key [1 other arguments]',
          }),
        }),
        expect.objectContaining({
          description: 'get test-key',
          op: 'db',
          data: expect.objectContaining({
            'db.system': 'redis',
            'net.peer.name': 'localhost',
            'net.peer.port': 6379,
            'db.statement': 'get test-key',
          }),
        }),
      ]),
    };

    createRunner(__dirname, 'scenario-ioredis.js')
      .withDockerCompose({ workingDirectory: [__dirname], readyMatches: ['port=6379'] })
      .expect({ transaction: EXPECTED_TRANSACTION })
      .start(done);
  });
});
