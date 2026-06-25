'use strict';

/**
 * Unit tests for backend/utils/serverLogger.js
 *
 * TC-U01 — createLogger returns all 5 level methods
 * TC-U02 — In NODE_ENV=test, only error and warn are printed
 * TC-U03 — DEBUG=true enables all levels (overrides NODE_ENV)
 * TC-U04 — Tag appears in formatted output
 * TC-U05 — No empty brackets when tag is empty string
 * TC-U06 — Output contains ISO-style timestamp (BVA)
 */

describe('serverLogger — createLogger()', () => {
  // ── TC-U01 ───────────────────────────────────────────────
  describe('TC-U01: createLogger returns all 5 level methods', () => {
    it('returns an object with error, warn, info, http, debug as functions', () => {
      const { createLogger } = require('../../backend/utils/serverLogger');
      const log = createLogger('TEST');

      expect(typeof log.error).toBe('function');
      expect(typeof log.warn).toBe('function');
      expect(typeof log.info).toBe('function');
      expect(typeof log.http).toBe('function');
      expect(typeof log.debug).toBe('function');
    });
  });

  // ── TC-U02 ───────────────────────────────────────────────
  describe('TC-U02: NODE_ENV=test suppresses info/http/debug, allows error/warn', () => {
    let logSpy;
    let errorSpy;

    beforeEach(() => {
      logSpy   = jest.spyOn(console, 'log').mockImplementation(() => {});
      errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    });

    afterEach(() => jest.restoreAllMocks());

    it('suppresses info in test env', () => {
      const { createLogger } = require('../../backend/utils/serverLogger');
      const log = createLogger('T');
      log.info('should not appear');
      expect(logSpy).not.toHaveBeenCalled();
    });

    it('suppresses http in test env', () => {
      const { createLogger } = require('../../backend/utils/serverLogger');
      const log = createLogger('T');
      log.http('should not appear');
      expect(logSpy).not.toHaveBeenCalled();
    });

    it('suppresses debug in test env', () => {
      const { createLogger } = require('../../backend/utils/serverLogger');
      const log = createLogger('T');
      log.debug('should not appear');
      expect(logSpy).not.toHaveBeenCalled();
    });

    it('allows error in test env', () => {
      const { createLogger } = require('../../backend/utils/serverLogger');
      const log = createLogger('T');
      log.error('visible error');
      expect(errorSpy).toHaveBeenCalled();
    });

    it('allows warn in test env', () => {
      const { createLogger } = require('../../backend/utils/serverLogger');
      const log = createLogger('T');
      log.warn('visible warn');
      expect(logSpy).toHaveBeenCalled();
    });
  });

  // ── TC-U03 ───────────────────────────────────────────────
  describe('TC-U03: DEBUG=true enables all levels regardless of NODE_ENV', () => {
    beforeEach(() => {
      process.env.DEBUG = 'true';
      jest.resetModules(); // force module reload to pick up env change
    });

    afterEach(() => {
      delete process.env.DEBUG;
      jest.resetModules();
    });

    it('enables debug level when DEBUG=true', () => {
      const { createLogger } = require('../../backend/utils/serverLogger');
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
      const log = createLogger('T');
      log.debug('debug visible');
      expect(consoleSpy).toHaveBeenCalled();
      jest.restoreAllMocks();
    });

    it('enables info level when DEBUG=true', () => {
      const { createLogger } = require('../../backend/utils/serverLogger');
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
      const log = createLogger('T');
      log.info('info visible');
      expect(consoleSpy).toHaveBeenCalled();
      jest.restoreAllMocks();
    });
  });

  // ── TC-U04 ───────────────────────────────────────────────
  describe('TC-U04: Tag appears in formatted output', () => {
    afterEach(() => jest.restoreAllMocks());

    it('includes [MY-TAG] in console.error output', () => {
      const { createLogger } = require('../../backend/utils/serverLogger');
      const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      const log = createLogger('MY-TAG');

      log.error('test message');

      expect(errorSpy).toHaveBeenCalled();
      const output = errorSpy.mock.calls[0][0];
      expect(output).toContain('[MY-TAG]');
      expect(output).toContain('test message');
    });

    it('includes [PROXY] tag when logger created with PROXY', () => {
      const { createLogger } = require('../../backend/utils/serverLogger');
      const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      const log = createLogger('PROXY');

      log.error('proxy error');

      const output = errorSpy.mock.calls[0][0];
      expect(output).toContain('[PROXY]');
    });
  });

  // ── TC-U05 ───────────────────────────────────────────────
  describe('TC-U05: No empty [] brackets when tag is empty string', () => {
    afterEach(() => jest.restoreAllMocks());

    it('omits brackets entirely when tag is empty string', () => {
      const { createLogger } = require('../../backend/utils/serverLogger');
      const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      const log = createLogger('');

      log.error('no tag message');

      const output = errorSpy.mock.calls[0][0];
      expect(output).not.toContain('[]');
    });
  });

  // ── TC-U06 ───────────────────────────────────────────────
  describe('TC-U06: Output contains ISO-style timestamp (BVA)', () => {
    afterEach(() => jest.restoreAllMocks());

    it('timestamp matches YYYY-MM-DD HH:mm:ss.SSS format', () => {
      const { createLogger } = require('../../backend/utils/serverLogger');
      const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      const log = createLogger('TS');

      log.error('timestamp test');

      const output = errorSpy.mock.calls[0][0];
      // Strip ANSI codes before matching
      const stripped = output.replace(/\x1b\[[0-9;]*m/g, '');
      expect(stripped).toMatch(/\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}\.\d{3}/);
    });

    it('timestamp year is 4 digits (boundary: not 2 or 3 digits)', () => {
      const { createLogger } = require('../../backend/utils/serverLogger');
      const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      const log = createLogger('TS');

      log.error('year boundary');

      const output = errorSpy.mock.calls[0][0];
      const stripped = output.replace(/\x1b\[[0-9;]*m/g, '');
      const match = stripped.match(/(\d{4})-\d{2}-\d{2}/);
      expect(match).not.toBeNull();
      expect(match[1].length).toBe(4);
    });
  });
});

// ═══════════════════════════════════════════════════════════
// File Logging Tests (TC-F01 – TC-F07)
// Uses a temp LOG_DIR + NODE_ENV=development to enable file writing
// ═══════════════════════════════════════════════════════════

const os   = require('os');
const fs   = require('fs');
const path = require('path');

describe('serverLogger — file logging', () => {
  let tempLogDir;

  // ── Setup: temp dir + reload module with development env ──
  beforeAll(() => {
    tempLogDir = fs.mkdtempSync(path.join(os.tmpdir(), 'test-logs-'));
    process.env.LOG_DIR   = tempLogDir;
    process.env.NODE_ENV  = 'development';
    jest.resetModules();
  });

  afterAll(() => {
    fs.rmSync(tempLogDir, { recursive: true, force: true });
    delete process.env.LOG_DIR;
    process.env.NODE_ENV = 'test';
    jest.resetModules();
  });

  // Suppress console output for file tests (we only care about file content here)
  beforeEach(() => {
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });
  afterEach(() => jest.restoreAllMocks());

  // TC-F01 is tested in its own isolated describe block below
  // (it needs NODE_ENV=test, which the beforeAll above overrides)

  // ── TC-F02 ───────────────────────────────────────────────
  describe('TC-F02: combined-DATE.log created with correct content (Verification)', () => {
    it('creates combined log file when info is logged in development env', () => {
      const { createLogger } = require('../../backend/utils/serverLogger');
      const log = createLogger('FILE-TEST');
      log.info('hello from file test');

      const today = new Date().toISOString().slice(0, 10);
      const combinedPath = path.join(tempLogDir, `combined-${today}.log`);
      expect(fs.existsSync(combinedPath)).toBe(true);

      const content = fs.readFileSync(combinedPath, 'utf8');
      expect(content).toContain('[FILE-TEST]');
      expect(content).toContain('hello from file test');
    });
  });

  // ── TC-F03 ───────────────────────────────────────────────
  describe('TC-F03: error-DATE.log written for error level (Verification)', () => {
    it('creates error log file when error is logged', () => {
      const { createLogger } = require('../../backend/utils/serverLogger');
      const log = createLogger('ERR-TEST');
      log.error('critical failure');

      const today = new Date().toISOString().slice(0, 10);
      const errorPath = path.join(tempLogDir, `error-${today}.log`);
      expect(fs.existsSync(errorPath)).toBe(true);

      const content = fs.readFileSync(errorPath, 'utf8');
      expect(content).toContain('critical failure');
      expect(content).toContain('[ERR-TEST]');
    });
  });

  // ── TC-F04 ───────────────────────────────────────────────
  describe('TC-F04: error-DATE.log written for warn level (Verification)', () => {
    it('writes warn entries to error log file', () => {
      const { createLogger } = require('../../backend/utils/serverLogger');
      const log = createLogger('WARN-TEST');
      log.warn('low disk space');

      const today = new Date().toISOString().slice(0, 10);
      const errorPath = path.join(tempLogDir, `error-${today}.log`);
      expect(fs.existsSync(errorPath)).toBe(true);

      const content = fs.readFileSync(errorPath, 'utf8');
      expect(content).toContain('low disk space');
    });
  });

  // ── TC-F05 ───────────────────────────────────────────────
  describe('TC-F05: File output contains no ANSI escape codes (Verification)', () => {
    it('combined log file has no ANSI codes', () => {
      const { createLogger } = require('../../backend/utils/serverLogger');
      const log = createLogger('ANSI-TEST');
      log.error('check ansi');
      log.info('check ansi info');

      const today = new Date().toISOString().slice(0, 10);
      const combinedPath = path.join(tempLogDir, `combined-${today}.log`);
      const content = fs.readFileSync(combinedPath, 'utf8');

      // ANSI escape sequences start with ESC [ — should not appear in file
      // eslint-disable-next-line no-control-regex
      expect(content).not.toMatch(/\x1b\[[0-9;]*m/);
    });

    it('error log file has no ANSI codes', () => {
      const { createLogger } = require('../../backend/utils/serverLogger');
      const log = createLogger('ANSI-ERR');
      log.error('ansi error check');

      const today = new Date().toISOString().slice(0, 10);
      const errorPath = path.join(tempLogDir, `error-${today}.log`);
      const content = fs.readFileSync(errorPath, 'utf8');

      // eslint-disable-next-line no-control-regex
      expect(content).not.toMatch(/\x1b\[[0-9;]*m/);
    });
  });

  // ── TC-F06 ───────────────────────────────────────────────
  describe('TC-F06: pruneOldLogs() deletes files older than retention (Verification)', () => {
    it('removes log files whose mtime is past the retention cutoff', () => {
      const { pruneOldLogs } = require('../../backend/utils/serverLogger');

      // Create a fake old log file
      const oldFile = path.join(tempLogDir, 'combined-2020-01-01.log');
      fs.writeFileSync(oldFile, 'old log content\n', 'utf8');

      // Back-date the file's mtime to 10 days ago
      const tenDaysAgo = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000);
      fs.utimesSync(oldFile, tenDaysAgo, tenDaysAgo);

      pruneOldLogs(); // default retention = 7 days

      expect(fs.existsSync(oldFile)).toBe(false);
    });
  });

  // ── TC-F07 ───────────────────────────────────────────────
  describe('TC-F07: pruneOldLogs() keeps files within retention period (Boundary)', () => {
    it('does NOT delete log files that are still within retention window', () => {
      const { pruneOldLogs } = require('../../backend/utils/serverLogger');

      // Create a file dated yesterday (within 7-day window)
      const yesterday = new Date(Date.now() - 1 * 24 * 60 * 60 * 1000);
      const dateStr = yesterday.toISOString().slice(0, 10);
      const recentFile = path.join(tempLogDir, `combined-${dateStr}.log`);
      fs.writeFileSync(recentFile, 'recent log\n', 'utf8');
      fs.utimesSync(recentFile, yesterday, yesterday);

      pruneOldLogs();

      expect(fs.existsSync(recentFile)).toBe(true);

      // Cleanup
      fs.unlinkSync(recentFile);
    });
  });
});

// ── TC-F01 (isolated) ────────────────────────────────────
// Must run in its own describe so it uses NODE_ENV=test (the Jest default),
// not the NODE_ENV=development set by the file-logging suite above.
describe('serverLogger — TC-F01: file writing disabled in NODE_ENV=test', () => {
  let isolatedLogDir;

  beforeAll(() => {
    // Point to a fresh temp dir so we can count .log files precisely
    isolatedLogDir = fs.mkdtempSync(path.join(os.tmpdir(), 'test-logs-f01-'));
    process.env.LOG_DIR = isolatedLogDir;
    // NODE_ENV stays 'test' — Jest always sets this
    jest.resetModules();
  });

  afterAll(() => {
    fs.rmSync(isolatedLogDir, { recursive: true, force: true });
    delete process.env.LOG_DIR;
    jest.resetModules();
  });

  beforeEach(() => {
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });
  afterEach(() => jest.restoreAllMocks());

  it('does not create any .log files when NODE_ENV=test', () => {
    const { createLogger } = require('../../backend/utils/serverLogger');
    const log = createLogger('F01-TEST');

    log.error('should not write');
    log.warn('should not write');
    log.info('should not write');

    const files = fs.readdirSync(isolatedLogDir).filter(f => f.endsWith('.log'));
    expect(files.length).toBe(0);
  });
});
