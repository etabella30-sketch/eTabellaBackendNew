import { Test, TestingModule } from "@nestjs/testing";
import { AdminDashboardController } from "./admin-dashboard.controller";
import { AdminDashboardService } from "../../services/admin-dashboard/admin-dashboard.service";
import { LogInterceptor } from "@app/global/interceptor/log.interceptor";
import { plainToInstance } from "class-transformer";
import { validate } from "class-validator";
import { RtSimSourceSetReq } from "../../interfaces/admin-dashboard.interface";

describe("AdminDashboardController", () => {
  let controller: AdminDashboardController;
  let service: {
    getCaseList: jest.Mock;
    getarchiveCase: jest.Mock;
    archiveCase: jest.Mock;
    getRtSimSource: jest.Mock;
    setRtSimSource: jest.Mock;
  };

  beforeEach(async () => {
    service = {
      getCaseList: jest.fn(),
      getarchiveCase: jest.fn(),
      archiveCase: jest.fn(),
      getRtSimSource: jest.fn(),
      setRtSimSource: jest.fn(),
    };
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AdminDashboardController],
      providers: [{ provide: AdminDashboardService, useValue: service }],
    })
      .overrideInterceptor(LogInterceptor)
      .useValue({ intercept: jest.fn() })
      .compile();

    controller = module.get<AdminDashboardController>(AdminDashboardController);
  });

  it("should be defined", () => {
    expect(controller).toBeDefined();
  });

  it("delegates active and archived list requests", async () => {
    const query = { pageNumber: 1, cSearch: "" };
    service.getCaseList.mockResolvedValue([[], [], []]);
    service.getarchiveCase.mockResolvedValue([[], [], []]);

    await controller.getCaseList(query as any);
    await controller.getArchiveCase(query as any);

    expect(service.getCaseList).toHaveBeenCalledWith(query);
    expect(service.getarchiveCase).toHaveBeenCalledWith(query);
  });

  it("delegates archive mutations", async () => {
    const body = { nCaseid: "c1", bIsarchived: true };
    service.archiveCase.mockResolvedValue({ msg: 1 });

    await expect(controller.archiveCase(body as any)).resolves.toEqual({
      msg: 1,
    });
    expect(service.archiveCase).toHaveBeenCalledWith(body);
  });

  it("delegates the RT Simulation source read and write", async () => {
    service.getRtSimSource.mockResolvedValue({ msg: 1, nCaseid: null });
    service.setRtSimSource.mockResolvedValue({ msg: 1, nCaseid: "c1" });
    const body = { nCaseid: "c1", bEnabled: true };

    await expect(controller.getRtSimSource({} as any)).resolves.toEqual({ msg: 1, nCaseid: null });
    await expect(controller.setRtSimSource(body as any)).resolves.toEqual({ msg: 1, nCaseid: "c1" });
    expect(service.setRtSimSource).toHaveBeenCalledWith(body);
  });

  it("accepts only { nCaseid, bEnabled } (+ the injected nMasterid) for the RT Simulation source", async () => {
    const check = (plain: object) =>
      validate(plainToInstance(RtSimSourceSetReq, plain), { whitelist: true, forbidNonWhitelisted: true });
    const id = "3aecc24a-98b8-46ca-8209-1f7a2584d679";

    expect(await check({ nCaseid: id, bEnabled: true, nMasterid: id })).toHaveLength(0);
    expect(await check({ nCaseid: "not-a-uuid", bEnabled: true })).not.toHaveLength(0);
    expect(await check({ nCaseid: null, bEnabled: false })).not.toHaveLength(0);
    expect(await check({ nCaseid: id })).not.toHaveLength(0);
    expect(await check({ nCaseid: id, bEnabled: "yes" })).not.toHaveLength(0);
    expect(await check({ nCaseid: id, bEnabled: true, nUserid: id })).not.toHaveLength(0);
  });
});
