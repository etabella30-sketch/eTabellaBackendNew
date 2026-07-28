import { DbService } from "@app/global/db/pg/db.service";
import { Test, TestingModule } from "@nestjs/testing";
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
});
