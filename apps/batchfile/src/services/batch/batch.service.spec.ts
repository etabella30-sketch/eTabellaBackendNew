import { spawn } from "child_process";
import { EventEmitter } from "events";
import { existsSync, mkdtempSync, readdirSync, rmSync } from "fs";
import { tmpdir } from "os";
import { join } from "path";
import { QueueProcessor } from "../../processors/queue.processor";
import { BatchService } from "./batch.service";

jest.mock("child_process", () => ({
  spawn: jest.fn(),
}));

describe("BatchService", () => {
  let service: BatchService;
  let db: { executeRef: jest.Mock };
  let utility: { emit: jest.Mock };
  let logService: { info: jest.Mock; error: jest.Mock };
  let redis: { setValue: jest.Mock };
  let taskQueue: { add: jest.Mock };

  const request = {
    nCaseid: "68fadaf2-0990-4374-8543-89a45eaddbdd",
    nSectionid: "11111111-1111-4111-8111-111111111111",
    nMasterid: "043c3b64-0e14-494d-af52-eeff4cc407f5",
    cBundleids: "{}",
    cFilename: "batch.xlsx",
    column: '["Name","cFilename"]',
  };

  beforeEach(async () => {
    db = { executeRef: jest.fn() };
    utility = { emit: jest.fn() };
    logService = { info: jest.fn(), error: jest.fn() };
    redis = { setValue: jest.fn().mockResolvedValue(undefined) };
    taskQueue = { add: jest.fn().mockResolvedValue({ id: "job-1" }) };
    const config = { get: jest.fn().mockReturnValue("./assets/") };

    service = new BatchService(
      db as any,
      utility as any,
      logService as any,
      redis as any,
      taskQueue as any,
      config as any,
    );
  });

  it("fetches data and adds a process-task job before reporting queued", async () => {
    const rows = [{ nBundledetailid: "doc-1", cFilename: "Pleading.pdf" }];
    db.executeRef.mockResolvedValue({ success: true, data: [rows] });

    const result = await service.getfiledata(request);

    expect(db.executeRef).toHaveBeenCalledWith("batchfile_getdata", request);
    expect(taskQueue.add).toHaveBeenCalledWith("process-task", {
      data: rows,
      filename: request.cFilename,
      column: request.column,
      nCaseid: request.nCaseid,
      nMasterid: request.nMasterid,
    });
    expect(utility.emit).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        data: expect.objectContaining({ type: "FD" }),
      }),
    );
    expect(utility.emit).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        data: expect.objectContaining({ type: "Q" }),
      }),
    );
    expect(result).toEqual({ msg: 1, value: "Batch File in process" });
  });

  it("reports failure and does not enqueue when data fetching fails", async () => {
    db.executeRef.mockResolvedValue({
      success: false,
      error: "database error",
    });

    const result = await service.getfiledata(request);

    expect(taskQueue.add).not.toHaveBeenCalled();
    expect(utility.emit).toHaveBeenLastCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ type: "F" }),
      }),
    );
    expect(result).toEqual({
      msg: -1,
      value: "Failed to fetch",
      error: "database error",
    });
  });

  it("reports failure when the job cannot be added to the queue", async () => {
    db.executeRef.mockResolvedValue({ success: true, data: [[]] });
    taskQueue.add.mockRejectedValue(new Error("redis unavailable"));

    const result = await service.getfiledata(request);

    expect(utility.emit).toHaveBeenLastCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ type: "F" }),
      }),
    );
    expect(result.msg).toBe(-1);
  });
});

describe("QueueProcessor", () => {
  let processor: QueueProcessor;
  let utility: { emit: jest.Mock };
  let logService: { info: jest.Mock; error: jest.Mock };
  let tempRoot: string;
  let tempDir: string;
  let consoleErrorSpy: jest.SpyInstance;
  const spawnMock = spawn as unknown as jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    tempRoot = mkdtempSync(join(tmpdir(), "batchfile-processor-"));
    tempDir = join(tempRoot, "nested-temp");
    consoleErrorSpy = jest.spyOn(console, "error").mockImplementation();
    utility = { emit: jest.fn() };
    logService = { info: jest.fn(), error: jest.fn() };
    const values = {
      ASSETS: "./assets/",
      TMP_PATH: tempDir,
      BATCHFILE: "assets/pythons/batchfile/excel_generator.py",
      pythonV: "python",
    };
    const config = {
      get: jest.fn((key: string) => values[key]),
    };

    processor = new QueueProcessor(
      utility as any,
      logService as any,
      config as any,
    );
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
    rmSync(tempRoot, { recursive: true, force: true });
  });

  it("emits completion only after the generator succeeds", async () => {
    jest.spyOn(processor, "createExcelFile").mockResolvedValue({
      msg: 1,
      value: "Batch File in process success",
    });

    await processor.handleTask({
      data: {
        data: [{ cFilename: "Pleading.pdf" }],
        filename: "batch.xlsx",
        column: '["Name","cFilename"]',
        nCaseid: "case-1",
        nMasterid: "user-1",
      },
    } as any);

    expect(utility.emit).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        data: expect.objectContaining({ type: "A" }),
      }),
    );
    expect(utility.emit).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        data: expect.objectContaining({
          type: "C",
          data: { path: "doc/casecase-1/batch.xlsx", name: "batch.xlsx" },
        }),
      }),
    );
  });

  it("emits failure and rejects the job when generation fails", async () => {
    jest.spyOn(processor, "createExcelFile").mockResolvedValue({
      msg: -1,
      value: "Batch File in process failed",
      error:
        "[BATCH_PYTHON_DEPENDENCY_MISSING] No module named 'openpyxl'",
    });

    await expect(
      processor.handleTask({
        data: {
          data: [],
          filename: "batch.xlsx",
          column: '["Name","cFilename"]',
          nCaseid: "case-1",
          nMasterid: "user-1",
        },
      } as any),
    ).rejects.toThrow("BATCH_PYTHON_DEPENDENCY_MISSING");

    expect(utility.emit).toHaveBeenLastCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          type: "F",
          message:
            "A required server Python package is missing. [BATCH_PYTHON_DEPENDENCY_MISSING]",
        }),
      }),
    );
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      expect.stringContaining("[batchFile][BATCH_PYTHON_DEPENDENCY_MISSING]"),
    );
    expect(utility.emit).not.toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ type: "C" }),
      }),
    );
  });

  it("creates the temp directory and launches the JSONL generator contract", async () => {
    const child = new EventEmitter() as any;
    child.stdout = new EventEmitter();
    child.stderr = new EventEmitter();
    spawnMock.mockReturnValue(child);

    const outputPath = join(tempRoot, "batch.xlsx");
    const resultPromise = processor.createExcelFile(
      [{ cFilename: "Pleading.pdf" }],
      outputPath,
      '["Name","cFilename"]',
    );

    for (
      let attempt = 0;
      attempt < 200 && spawnMock.mock.calls.length === 0;
      attempt++
    ) {
      await new Promise<void>((resolve) => setTimeout(resolve, 10));
    }

    expect(spawnMock).toHaveBeenCalledTimes(1);
    const [command, args] = spawnMock.mock.calls[0];
    expect(command).toBe("python");
    expect(args).toHaveLength(5);
    expect(args[0]).toBe("assets/pythons/batchfile/excel_generator.py");
    expect(args[1]).toMatch(/\.jsonl$/);
    expect(args.slice(2)).toEqual([outputPath, '["Name","cFilename"]', "1000"]);
    expect(existsSync(tempDir)).toBe(true);

    child.stdout.emit("data", Buffer.from('{"msg":1,"value":"ok"}'));
    child.emit("close", 0);

    await expect(resultPromise).resolves.toEqual({ msg: 1, value: "ok" });
    expect(readdirSync(tempDir)).toEqual([]);
  });

  it("reports a missing BATCHFILE server configuration before spawning Python", async () => {
    const config = {
      get: jest.fn((key: string) => {
        const values = {
          ASSETS: "./assets/",
          TMP_PATH: tempDir,
          pythonV: "python",
        };
        return values[key];
      }),
    };
    const missingConfigProcessor = new QueueProcessor(
      utility as any,
      logService as any,
      config as any,
    );

    const result = await missingConfigProcessor.createExcelFile(
      [],
      join(tempRoot, "batch.xlsx"),
      '["Name","cFilename"]',
    );

    expect(result).toEqual(
      expect.objectContaining({
        msg: -1,
        error: expect.stringContaining("[BATCH_CONFIG_SCRIPT_MISSING]"),
      }),
    );
    expect(spawnMock).not.toHaveBeenCalled();
  });

  it("identifies an old server Python script as a contract mismatch", async () => {
    const child = new EventEmitter() as any;
    child.stdout = new EventEmitter();
    child.stderr = new EventEmitter();
    spawnMock.mockReturnValue(child);

    const resultPromise = processor.createExcelFile(
      [{ cFilename: "Pleading.pdf" }],
      join(tempRoot, "batch.xlsx"),
      '["Name","cFilename"]',
    );

    for (
      let attempt = 0;
      attempt < 200 && spawnMock.mock.calls.length === 0;
      attempt++
    ) {
      await new Promise<void>((resolve) => setTimeout(resolve, 10));
    }

    child.stdout.emit(
      "data",
      Buffer.from(
        "Usage: python batch_processor.py <data_json> <output_path> <column_string>",
      ),
    );
    child.emit("close", 1);

    await expect(resultPromise).resolves.toEqual(
      expect.objectContaining({
        msg: -1,
        error: expect.stringContaining("[BATCH_PYTHON_CONTRACT_MISMATCH]"),
      }),
    );
    expect(readdirSync(tempDir)).toEqual([]);
  });

  it("identifies a missing Python executable", async () => {
    const child = new EventEmitter() as any;
    child.stdout = new EventEmitter();
    child.stderr = new EventEmitter();
    spawnMock.mockReturnValue(child);

    const resultPromise = processor.createExcelFile(
      [],
      join(tempRoot, "batch.xlsx"),
      '["Name","cFilename"]',
    );

    for (
      let attempt = 0;
      attempt < 200 && spawnMock.mock.calls.length === 0;
      attempt++
    ) {
      await new Promise<void>((resolve) => setTimeout(resolve, 10));
    }

    child.emit(
      "error",
      Object.assign(new Error("spawn python3 ENOENT"), { code: "ENOENT" }),
    );

    await expect(resultPromise).resolves.toEqual(
      expect.objectContaining({
        msg: -1,
        error: expect.stringContaining("[BATCH_PYTHON_NOT_FOUND]"),
      }),
    );
    expect(readdirSync(tempDir)).toEqual([]);
  });
});
