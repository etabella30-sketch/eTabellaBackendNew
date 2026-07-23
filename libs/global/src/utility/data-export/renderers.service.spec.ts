import { ConfigService } from "@nestjs/config";
import * as ExcelJS from "exceljs";
import { resolve, sep } from "path";
import * as yauzl from "yauzl";
import { DataExportRenderer } from "./renderers.service";

const pdfParse = require("pdf-parse");

function createRenderer(): DataExportRenderer {
  const config = {
    get: jest.fn().mockReturnValue(`${resolve("assets")}${sep}`),
  } as unknown as ConfigService;
  return new DataExportRenderer(config);
}

function readZipEntry(buffer: Buffer, entryName: string): Promise<string> {
  return new Promise((resolve, reject) => {
    yauzl.fromBuffer(buffer, { lazyEntries: true }, (zipError, zipFile) => {
      if (zipError || !zipFile) {
        reject(zipError ?? new Error("Unable to open generated DOCX"));
        return;
      }

      zipFile.readEntry();
      zipFile.on("entry", (entry) => {
        if (entry.fileName !== entryName) {
          zipFile.readEntry();
          return;
        }

        zipFile.openReadStream(entry, (streamError, stream) => {
          if (streamError || !stream) {
            reject(streamError ?? new Error(`Unable to read ${entryName}`));
            return;
          }

          const chunks: Buffer[] = [];
          stream.on("data", (chunk: Buffer) => chunks.push(chunk));
          stream.on("end", () => {
            zipFile.close();
            resolve(Buffer.concat(chunks).toString("utf8"));
          });
          stream.on("error", reject);
        });
      });
      zipFile.on("end", () =>
        reject(new Error(`${entryName} was not found in the generated DOCX`)),
      );
      zipFile.on("error", reject);
    });
  });
}

describe("DataExportRenderer Word layout", () => {
  it("uses a landscape fixed-width table with wider narrative columns", async () => {
    const renderer = createRenderer();
    const row = {
      Passage:
        "A long quoted passage from the source document that must remain readable in Word.",
      Note: "A detailed note explaining why the passage is relevant to the case.",
      Date: "21 July 2026",
      Document: "Statement of Case and supporting exhibits",
      Tab: "F1.7.1",
      Exhibit: "C-101",
      Bundle: "Bundle F",
      Status: "Unassigned",
      Kind: "QFact",
      Issues: "2",
      Tasks: "1",
      Links: "0",
      Contacts: "Claimant and Respondent representatives",
      Author: "Alok Jha",
      Created: "21 July 2026",
    };

    const rendered = await renderer.render(
      [{ name: "QFacts", rows: [row] }],
      "docx",
      "QFacts Export",
    );
    const xml = await readZipEntry(rendered.buffer, "word/document.xml");
    const tableGrid =
      xml.match(/<w:tblGrid>([\s\S]*?)<\/w:tblGrid>/)?.[1] ?? "";
    const widths = [
      ...tableGrid.matchAll(/<w:gridCol[^>]*w:w="(\d+)"[^>]*\/?\s*>/g),
    ].map((match) => Number(match[1]));

    expect(xml).toMatch(/<w:pgSz[^>]*w:orient="landscape"/);
    expect(xml).toMatch(/<w:tblLayout[^>]*w:type="fixed"/);
    expect(xml).toMatch(/<w:tblHeader\s*\/>/);
    expect(xml).toMatch(/<w:sz[^>]*w:val="14"/);
    expect(widths).toHaveLength(15);
    expect(new Set(widths).size).toBeGreaterThan(3);
    expect(widths[0]).toBeGreaterThan(widths[9]); // Passage > Issues
    expect(widths[1]).toBeGreaterThan(widths[10]); // Note > Tasks
    expect(widths[3]).toBeGreaterThan(widths[4]); // Document > Tab
    expect(widths.reduce((sum, width) => sum + width, 0)).toBe(16_080);
  });
});

describe("DataExportRenderer Master Index dates", () => {
  it("renders the bundle-index dIntrestDt field in Word, PDF, and Excel", async () => {
    const renderer = createRenderer();
    const rows = [
      {
        rootLabel: "Bundle A",
        cFolder: "Bundle A",
        cFolderTag: "A",
        cTab: "A1.1",
        cExhibitno: "C-101",
        cName: "Dated evidence document",
        cPage: "1-3",
        dIntrestDt: "2017-09-11T00:00:00.000Z",
      },
    ];
    const meta = { caseName: "Date regression", caseNo: "CASE-039" };

    const [word, pdf, excel] = await Promise.all([
      renderer.renderMasterIndex(rows, "docx", "Master Index", meta),
      renderer.renderMasterIndex(rows, "pdf", "Master Index", meta),
      renderer.renderMasterIndex(rows, "xlsx", "Master Index", meta),
    ]);

    const wordXml = await readZipEntry(word.buffer, "word/document.xml");
    expect(wordXml).toContain("11.09.2017");

    const pdfText = await pdfParse(pdf.buffer);
    expect(pdfText.text).toContain("11.09.2017");

    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(excel.buffer as any);
    const dateValues = workbook.getWorksheet("Master Index")!.getColumn(4).values;
    expect(dateValues).toContain("11.09.2017");
  });
});
