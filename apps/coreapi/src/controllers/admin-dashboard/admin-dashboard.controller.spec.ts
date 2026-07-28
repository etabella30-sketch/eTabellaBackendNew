import { Test, TestingModule } from "@nestjs/testing";
import { AdminDashboardController } from "./admin-dashboard.controller";
import { AdminDashboardService } from "../../services/admin-dashboard/admin-dashboard.service";
import { LogInterceptor } from "@app/global/interceptor/log.interceptor";

describe("AdminDashboardController", () => {
  let controller: AdminDashboardController;
  let service: {
    getCaseList: jest.Mock;
    getarchiveCase: jest.Mock;
    archiveCase: jest.Mock;
  };

  beforeEach(async () => {
    service = {
      getCaseList: jest.fn(),
      getarchiveCase: jest.fn(),
      archiveCase: jest.fn(),
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
});
