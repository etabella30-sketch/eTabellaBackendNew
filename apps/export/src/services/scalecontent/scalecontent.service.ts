import { Injectable } from '@nestjs/common';
import { PDFPage, PDFContentStream, pushGraphicsState, scale, popGraphicsState, PDFArray, PDFStream, PDFName } from 'pdf-lib';


@Injectable()
export class ScalecontentService {
    async scaleContent(page: any, x: number, y: number) {
        const { context } = page.doc;

        const start = context.stream(
            pushGraphicsState(),
            scale(x, y)
        );
        const startRef = context.register(start);

        const end = context.stream(
            popGraphicsState()
        );
        const endRef = context.register(end);

        page.wrapContentStreams(startRef, endRef);
    }
}