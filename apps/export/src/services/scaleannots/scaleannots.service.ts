
import { Injectable } from '@nestjs/common';
import { PDFName, PDFNumber, PDFPage, PDFDict, PDFArray, PDFString } from 'pdf-lib';

@Injectable()
export class ScaleannotsService {
    scaleAnnots(page: PDFPage, x: number, y: number): void {
        const annots = page.node.Annots();
        if (!annots) return;

        for (let i = 0; i < annots.size(); i++) {
            const annotRef = annots.get(i);
            const annot = annotRef.clone();
            if (annot instanceof PDFDict) {
                this.scaleAnnotation(annot, x, y);
            }
        }
    }

    private scaleAnnotation(annot: PDFDict, x: number, y: number): void {
        this.scaleRD(annot, x, y);
        this.scaleCL(annot, x, y);
        this.scaleInkList(annot, x, y);
        this.scaleVertices(annot, x, y);
        this.scaleQuadPoints(annot, x, y);
        this.scaleL(annot, x, y);
        this.scaleRect(annot, x, y);
        this.scaleFontSize(annot, x);
        this.scaleLineHeight(annot, x);
    }

    private scaleRD(annot: PDFDict, x: number, y: number): void {
        const pdfNameRD = annot.get(PDFName.of("RD"));
        if (pdfNameRD instanceof PDFArray) {
            this.scaleNumberArray(pdfNameRD, [x, y, x, y]);
        }
    }

    private scaleCL(annot: PDFDict, x: number, y: number): void {
        const pdfNameCL = annot.get(PDFName.of("CL"));
        if (pdfNameCL instanceof PDFArray) {
            this.scaleNumberArray(pdfNameCL, [x, y, x, y, x, y]);
        }
    }

    private scaleInkList(annot: PDFDict, x: number, y: number): void {
        const pdfNameInkList = annot.get(PDFName.of("InkList"));
        if (pdfNameInkList instanceof PDFArray && pdfNameInkList.size() > 0) {
            const internalArray = pdfNameInkList.get(0);
            if (internalArray instanceof PDFArray) {
                this.scaleNumberArrayAlternating(internalArray, x, y);
            }
        }
    }

    private scaleVertices(annot: PDFDict, x: number, y: number): void {
        const pdfNameVertices = annot.get(PDFName.of("Vertices"));
        if (pdfNameVertices instanceof PDFArray) {
            this.scaleNumberArrayAlternating(pdfNameVertices, x, y);
        }
    }

    private scaleQuadPoints(annot: PDFDict, x: number, y: number): void {
        const pdfNameQuadPoints = annot.get(PDFName.of("QuadPoints"));
        if (pdfNameQuadPoints instanceof PDFArray) {
            this.scaleNumberArrayAlternating(pdfNameQuadPoints, x, y);
        }
    }

    private scaleL(annot: PDFDict, x: number, y: number): void {
        const pdfNameL = annot.get(PDFName.of("L"));
        if (pdfNameL instanceof PDFArray) {
            this.scaleNumberArray(pdfNameL, [x, y, x, y]);
        }
    }

    private scaleRect(annot: PDFDict, x: number, y: number): void {
        const pdfNameRect = annot.get(PDFName.of("Rect"));
        if (pdfNameRect instanceof PDFArray) {
            this.scaleNumberArray(pdfNameRect, [x, y, x, y]);
        }
    }

    private scaleFontSize(annot: PDFDict, scale: number): void {
        this.scaleRCProperty(annot, 'font-size', scale);
    }

    private scaleLineHeight(annot: PDFDict, scale: number): void {
        this.scaleRCProperty(annot, 'line-height', scale);
    }

    private scaleRCProperty(annot: PDFDict, property: string, scale: number): void {
        const pdfNameRC = annot.get(PDFName.of("RC"));
        if (pdfNameRC instanceof PDFString) {
            const value = pdfNameRC.asString();
            const regex = new RegExp(`${property}:[0-9]*?.?[0-9]*?pt`, 'g');
            const parts = encodeURI(value).split(regex);
            const matches = value.match(regex);

            if (matches?.length) {
                const scaledValues = matches.map(match => {
                    const [prefix, value, suffix] = match.split(/([0-9]*\.?[0-9]*)pt/);
                    const scaledValue = (parseFloat(value) * scale).toFixed(1);
                    return `${prefix}${scaledValue}pt`;
                });

                const newValue = parts.reduce((acc, part, i) =>
                    acc + decodeURI(part) + (scaledValues[i] || ''), '');

                annot.set(PDFName.of("RC"), PDFString.of(newValue));
            }
        }
    }

    private scaleNumberArray(array: PDFArray, scales: number[]): void {
        for (let i = 0; i < scales.length && i < array.size(); i++) {
            const value = array.get(i);
            if (value instanceof PDFNumber) {
                array.set(i, PDFNumber.of(value.asNumber() * scales[i]));
            }
        }
    }

    private scaleNumberArrayAlternating(array: PDFArray, x: number, y: number): void {
        for (let i = 0; i < array.size(); i++) {
            const value = array.get(i);
            if (value instanceof PDFNumber) {
                const scale = i % 2 === 0 ? x : y;
                array.set(i, PDFNumber.of(value.asNumber() * scale));
            }
        }
    }

}
