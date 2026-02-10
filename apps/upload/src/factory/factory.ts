import { ConfigService } from "@nestjs/config";
import { VerifypdfService } from "../services/verifypdf/verifypdf.service";
import { UpdatefileinfoService } from "../services/updatefileinfo/updatefileinfo.service";
import { UtilityService } from "../services/utility/utility.service";
import { ZipService } from "../services/zip/zip.service";
import { LogService } from "@app/global/utility/log/log.service";
import { Queue } from "bull";
import { ConvertService } from "../services/convert/convert.service";
import { OcrService } from "../services/ocr/ocr.service";
import { getQueueToken, InjectQueue } from "@nestjs/bull";
import { filecopyService } from "../services/filecopy/filecopy.service";
import { MovetoS3Service } from "../services/moveto-s3/moveto-s3.service";


export const zipServiceFactory = (
    configService: ConfigService,
    fileVerificationService: VerifypdfService,
    fileInfoService: UpdatefileinfoService,
    utilityService: UtilityService,
    logService: LogService, convertService: ConvertService,
    ocrService: OcrService, filecopyService: filecopyService,
    fileCopyQueue: Queue, movetoS3: MovetoS3Service // Remove the decorator from here
) => {
    return new ZipService(
        configService,
        fileVerificationService,
        fileInfoService,
        utilityService,
        logService, convertService, ocrService, filecopyService,
        fileCopyQueue,
        movetoS3
        // Pass the queue to the ZipService
    );
};

export const zipServiceFactoryProvider = {
    provide: 'ZIP_SERVICE',
    useFactory: (
        configService: ConfigService,
        fileVerificationService: VerifypdfService,
        fileInfoService: UpdatefileinfoService,
        utilityService: UtilityService,
        logService: LogService, convertService: ConvertService,
        ocrService: OcrService, filecopyService: filecopyService,
        fileCopyQueue: Queue, movetoS3: MovetoS3Service // Remove the decorator from here
    ) => zipServiceFactory(
        configService,
        fileVerificationService,
        fileInfoService,
        utilityService,
        logService, convertService, ocrService, filecopyService,
        fileCopyQueue,
        movetoS3
    ),
    inject: [
        ConfigService,
        VerifypdfService,
        UpdatefileinfoService,
        UtilityService,
        LogService,
        ConvertService,
        OcrService,
        { provide: 'filecopy-process', useValue: getQueueToken('filecopy-process'), filecopyService }
    ]
};



// import { ConfigService } from "@nestjs/config";
// import { VerifypdfService } from "../services/verifypdf/verifypdf.service";
// import { UpdatefileinfoService } from "../services/updatefileinfo/updatefileinfo.service";
// import { UtilityService } from "../services/utility/utility.service";
// import { ZipService } from "../services/zip/zip.service";
// import { LogService } from "@app/global/utility/log/log.service";
// import { Queue } from "bull";
// import { ConvertService } from "../services/convert/convert.service";
// import { OcrService } from "../services/ocr/ocr.service";

// export const zipServiceFactory = (
//     configService: ConfigService,
//     fileVerificationService: VerifypdfService,
//     fileInfoService: UpdatefileinfoService,
//     utilityService: UtilityService,
//     logService: LogService, convertService: ConvertService,
//     ocrService: OcrService
// ) => {
//     return new ZipService(
//         configService,
//         fileVerificationService,
//         fileInfoService,
//         utilityService,
//         logService, convertService, ocrService
//     );
// };