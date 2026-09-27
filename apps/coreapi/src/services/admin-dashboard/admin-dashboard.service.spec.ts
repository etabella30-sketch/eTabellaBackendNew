import { DbService } from "@app/global/db/pg/db.service";
import { Test, TestingModule } from "@nestjs/testing";
import { ForbiddenException } from "@nestjs/common";
import { AdminDashboardService } from "./admin-dashboard.service";

describe("AdminDashboardService", () => {
  let service: AdminDashboardService;
  let db: { executeRef: jest.Mock };

  beforeEach(async () => {
    db = { executeRef: jest.fn() };
    const module: TestingModule = await Test.createTestingModule({
      providers: [AdminDashboardService, { provide: DbService, useValue: db }],
    }).compile();

    service = module.get<AdminDashboardService>(AdminDashboardService);
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  it("returns the three admin case cursors and requests all three refs", async () => {
    const data = [[{ nCaseid: "c1" }], [], []];
    db.executeRef.mockResolvedValue({ success: true, data });
    const query = { pageNumber: 1, cSearch: "" };

    await expect(service.getCaseList(query as any)).resolves.toBe(data);
    expect(db.executeRef).toHaveBeenCalledWith(
      "admindashboard",
      expect.objectContaining({ pageNumber: 1, cSearch: "", ref: 3 }),
    );
  });

  it("uses the archived-case function for archived rows", async () => {
    const data = [[], [], []];
    db.executeRef.mockResolvedValue({ success: true, data });

    await expect(
      service.getarchiveCase({ pageNumber: 1, cSearch: "" } as any),
    ).resolves.toBe(data);
    expect(db.executeRef).toHaveBeenCalledWith(
      "admin_archivecase",
      expect.objectContaining({ ref: 3 }),
    );
  });

  it("returns a stable error envelope when the database fails", async () => {
    db.executeRef.mockResolvedValue({ success: false, error: "offline" });

    await expect(
      service.getCaseList({ pageNumber: 1, cSearch: "" } as any),
    ).resolves.toEqual({ msg: -1, value: "Failed to fetch", error: "offline" });
  });

  it("returns the archive mutation result row", async () => {
    db.executeRef.mockResolvedValue({
      success: true,
      data: [[{ msg: 1, value: "Updated" }]],
    });

    await expect(
      service.archiveCase({ nCaseid: "c1", bIsarchived: true } as any),
    ).resolves.toEqual({ msg: 1, value: "Updated" });
    expect(db.executeRef).toHaveBeenCalledWith(
      "archivecase",
      expect.objectContaining({ nCaseid: "c1", bIsarchived: true }),
    );
  });

  describe("RT Simulation source", () => {
    const admin = "00000000-0000-4000-8000-00000000000a";

    it("reads the source for the token user", async () => {
      const row = { msg: 1, nCaseid: "c1", cCasename: "Demo", cCaseno: "D-1" };
      db.executeRef.mockResolvedValue({ success: true, data: [[row]] });

      await expect(service.getRtSimSource({ nMasterid: admin })).resolves.toEqual(row);
      expect(db.executeRef).toHaveBeenCalledWith("rt_sim_source_get", { nMasterid: admin });
    });

    it("reads none chosen as a null case", async () => {
      db.executeRef.mockResolvedValue({ success: true, data: [[]] });
      await expect(service.getRtSimSource({ nMasterid: admin })).resolves.toEqual({ msg: 1, nCaseid: null });
    });

    it("sends only nCaseid, bEnabled and the token user to the SP", async () => {
      db.executeRef.mockResolvedValue({ success: true, data: [[{ msg: 1, nCaseid: null }]] });

      await service.setRtSimSource({ nCaseid: "c1", bEnabled: false, nMasterid: admin, extra: 1 } as any);
      expect(db.executeRef).toHaveBeenCalledWith("rt_sim_source_set", { nCaseid: "c1", bEnabled: false, nMasterid: admin });
    });

    it("turns the SP admin re-check into a 403 (a demoted admin keeps a stale session flag)", async () => {
      db.executeRef.mockResolvedValue({ success: true, data: [[{ msg: -1, value: "Admin rights required", nCaseid: null }]] });

      await expect(service.getRtSimSource({ nMasterid: admin })).rejects.toBeInstanceOf(ForbiddenException);
      await expect(service.setRtSimSource({ nCaseid: "c1", bEnabled: true, nMasterid: admin })).rejects.toBeInstanceOf(ForbiddenException);
    });

    it("passes other refusals through and wraps database failures", async () => {
      const refusal = { msg: -1, value: "This case is archived or no longer exists", nCaseid: "c0" };
      db.executeRef.mockResolvedValue({ success: true, data: [[refusal]] });
      await expect(service.setRtSimSource({ nCaseid: "c1", bEnabled: true, nMasterid: admin })).resolves.toEqual(refusal);

      db.executeRef.mockResolvedValue({ success: false, error: "offline" });
      await expect(service.setRtSimSource({ nCaseid: "c1", bEnabled: true, nMasterid: admin }))
        .resolves.toEqual({ msg: -1, value: "Failed to save", error: "offline" });
      await expect(service.getRtSimSource({ nMasterid: admin }))
        .resolves.toEqual({ msg: -1, value: "Failed to fetch", error: "offline" });
    });
  });
});
