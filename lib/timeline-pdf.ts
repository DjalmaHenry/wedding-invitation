import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

export type TimelinePdfItem = {
  time: string;
  title: string;
  details: string;
};

function wrapText(
  text: string,
  font: { widthOfTextAtSize(value: string, size: number): number },
  size: number,
  maxWidth: number,
  maximumLines = 2,
): string[] {
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let current = "";
  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (font.widthOfTextAtSize(candidate, size) <= maxWidth) {
      current = candidate;
      continue;
    }
    if (current) lines.push(current);
    current = word;
    if (lines.length === maximumLines) break;
  }
  if (current && lines.length < maximumLines) lines.push(current);
  if (lines.length === maximumLines && words.join(" ") !== lines.join(" ")) {
    let last = lines[maximumLines - 1];
    while (last.length > 3 && font.widthOfTextAtSize(`${last}...`, size) > maxWidth) {
      last = last.slice(0, -1);
    }
    lines[maximumLines - 1] = `${last.trimEnd()}...`;
  }
  return lines;
}

export async function createTimelinePdf(
  items: TimelinePdfItem[],
  suppliedTemplateBytes?: ArrayBuffer | Uint8Array,
): Promise<Uint8Array> {
  const templateBytes =
    suppliedTemplateBytes ??
    (await fetch("/guest-list-template.pdf?v=20260726-1", {
      cache: "no-store",
    }).then((response) => {
      if (!response.ok) throw new Error("Modelo indisponível.");
      return response.arrayBuffer();
    }));

  const templateDocument = await PDFDocument.load(templateBytes);
  const outputDocument = await PDFDocument.create();
  const [firstTemplate, continuationTemplate] = await outputDocument.embedPdf(
    templateDocument,
    [0, 1],
  );
  const regular = await outputDocument.embedFont(StandardFonts.TimesRoman);
  const italic = await outputDocument.embedFont(StandardFonts.TimesRomanItalic);
  const bold = await outputDocument.embedFont(StandardFonts.TimesRomanBold);
  const pageWidth = 595.276;
  const pageHeight = 841.89;
  const ink = rgb(67 / 255, 42 / 255, 30 / 255);
  const olive = rgb(95 / 255, 109 / 255, 63 / 255);
  const muted = rgb(117 / 255, 89 / 255, 70 / 255);
  const divider = rgb(196 / 255, 175 / 255, 143 / 255);
  const paper = rgb(242 / 255, 228 / 255, 200 / 255);
  const rowsPerPage = 9;
  const totalPages = Math.max(1, Math.ceil(items.length / rowsPerPage));

  for (let pageIndex = 0; pageIndex < totalPages; pageIndex += 1) {
    const page = outputDocument.addPage([pageWidth, pageHeight]);
    page.drawPage(pageIndex === 0 ? firstTemplate : continuationTemplate, {
      x: 0,
      y: 0,
      width: pageWidth,
      height: pageHeight,
    });

    page.drawRectangle({ x: 130, y: 674, width: 335, height: 122, color: paper });
    const title = pageIndex === 0 ? "CRONOGRAMA DA CERIMONIALISTA" : "CONTINUAÇÃO DO CRONOGRAMA";
    const titleSize = pageIndex === 0 ? 12 : 10.5;
    const titleWidth = bold.widthOfTextAtSize(title, titleSize);
    page.drawText(title, {
      x: (pageWidth - titleWidth) / 2,
      y: 719,
      size: titleSize,
      font: bold,
      color: olive,
    });
    const coupleNames = "Djalma & Victoria";
    const coupleNamesWidth = italic.widthOfTextAtSize(coupleNames, 17);
    page.drawText(coupleNames, {
      x: (pageWidth - coupleNamesWidth) / 2,
      y: 688,
      size: 17,
      font: italic,
      color: ink,
    });

    const summary =
      pageIndex === 0
        ? "31 de outubro de 2026  •  organização da cerimônia"
        : `Página ${pageIndex + 1} de ${totalPages}`;
    const summaryWidth = italic.widthOfTextAtSize(summary, 9);
    page.drawText(summary, {
      x: (pageWidth - summaryWidth) / 2,
      y: 637,
      size: 9,
      font: italic,
      color: muted,
    });

    const pageItems = items.slice(
      pageIndex * rowsPerPage,
      (pageIndex + 1) * rowsPerPage,
    );
    pageItems.forEach((item, rowIndex) => {
      const top = 597 - rowIndex * 56;
      page.drawText(item.time, {
        x: 78,
        y: top,
        size: 14,
        font: bold,
        color: olive,
      });
      page.drawLine({
        start: { x: 134, y: top + 5 },
        end: { x: 134, y: top - 33 },
        thickness: 1.2,
        color: divider,
      });
      page.drawText(item.title, {
        x: 151,
        y: top + 1,
        size: 12,
        font: bold,
        color: ink,
      });
      if (item.details) {
        wrapText(item.details, italic, 8.4, 350).forEach((line, lineIndex) => {
          page.drawText(line, {
            x: 151,
            y: top - 13 - lineIndex * 10,
            size: 8.4,
            font: italic,
            color: muted,
          });
        });
      }
      page.drawLine({
        start: { x: 75, y: top - 42 },
        end: { x: 520, y: top - 42 },
        thickness: 0.35,
        color: divider,
      });
    });

    if (pageItems.length === 0) {
      const empty = "O cronograma ainda não possui etapas cadastradas.";
      const emptyWidth = italic.widthOfTextAtSize(empty, 11);
      page.drawText(empty, {
        x: (pageWidth - emptyWidth) / 2,
        y: 570,
        size: 11,
        font: italic,
        color: muted,
      });
    }

    const pageLabel = `Página ${pageIndex + 1} de ${totalPages}`;
    const pageLabelWidth = regular.widthOfTextAtSize(pageLabel, 8);
    page.drawText(pageLabel, {
      x: (pageWidth - pageLabelWidth) / 2,
      y: 78,
      size: 8,
      font: regular,
      color: muted,
    });
  }

  outputDocument.setTitle("Djalma & Victoria - Cronograma da cerimonialista");
  outputDocument.setAuthor("Djalma & Victoria");
  outputDocument.setCreator("Dashboard do casamento");
  return outputDocument.save();
}
