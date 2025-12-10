import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import type { IFieldData } from "../models/document.model.js";

interface SignatureOverlay {
  signatureBase64: string;
  fields: IFieldData[];
}

// Field colors by type (matching frontend)
const FIELD_COLORS: Record<string, { r: number; g: number; b: number }> = {
  text: { r: 0.231, g: 0.51, b: 0.965 }, // #3b82f6
  signature: { r: 0.133, g: 0.773, b: 0.369 }, // #22c55e
  image: { r: 0.659, g: 0.333, b: 0.969 }, // #a855f7
  date: { r: 0.976, g: 0.451, b: 0.086 }, // #f97316
  radio: { r: 0.925, g: 0.282, b: 0.6 }, // #ec4899
};

const FIELD_LABELS: Record<string, string> = {
  text: "Text",
  signature: "Signature",
  image: "Image",
  date: "Date",
  radio: "Radio",
};

/**
 * Burns signature and field values into a PDF document.
 * Transforms normalized coordinates (0-1) to PDF points.
 * Preserves aspect ratio when overlaying images.
 */
export async function burnSignatureIntoPdf(
  pdfBytes: Buffer,
  overlay: SignatureOverlay
): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.load(pdfBytes);
  const pages = pdfDoc.getPages();
  
  // Embed a standard font for labels
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);

  // Embed signature image if provided
  let signatureImage;
  if (overlay.signatureBase64) {
    // Remove data URL prefix if present
    const base64Data = overlay.signatureBase64.replace(
      /^data:image\/(png|jpeg|jpg);base64,/,
      ""
    );
    const imageBytes = Buffer.from(base64Data, "base64");

    // Try PNG first, then JPEG
    try {
      signatureImage = await pdfDoc.embedPng(imageBytes);
    } catch {
      signatureImage = await pdfDoc.embedJpg(imageBytes);
    }
  }

  console.log(`Processing ${overlay.fields.length} fields...`);

  // Process each field
  for (const field of overlay.fields) {
    const pageIndex = field.pageNumber - 1;
    if (pageIndex < 0 || pageIndex >= pages.length) {
      console.warn(`Invalid page number: ${field.pageNumber}`);
      continue;
    }

    const page = pages[pageIndex];
    if (!page) continue;

    const { width: pageWidth, height: pageHeight } = page.getSize();

    // Convert normalized coordinates to PDF points
    // PDF origin is bottom-left, so we need to flip Y
    const pdfX = field.x * pageWidth;
    const pdfWidth = field.width * pageWidth;
    const pdfHeight = field.height * pageHeight;
    // Flip Y: PDF Y = pageHeight - (normalized Y * pageHeight) - field height
    const pdfY = pageHeight - (field.y * pageHeight) - pdfHeight;

    console.log(`Field ${field.type} at (${pdfX.toFixed(2)}, ${pdfY.toFixed(2)}) size ${pdfWidth.toFixed(2)}x${pdfHeight.toFixed(2)}`);

    // Get field color
    const color = FIELD_COLORS[field.type] || { r: 0.5, g: 0.5, b: 0.5 };

    // Always draw field border for visibility
    page.drawRectangle({
      x: pdfX,
      y: pdfY,
      width: pdfWidth,
      height: pdfHeight,
      borderColor: rgb(color.r, color.g, color.b),
      borderWidth: 1,
      opacity: 0.1,
      color: rgb(color.r, color.g, color.b),
    });

    switch (field.type) {
      case "signature":
        if (signatureImage) {
          // Calculate dimensions preserving aspect ratio (scaleToFit)
          const imgAspect = signatureImage.width / signatureImage.height;
          const boxAspect = pdfWidth / pdfHeight;

          let drawWidth: number;
          let drawHeight: number;

          if (imgAspect > boxAspect) {
            // Image is wider than box - fit to width
            drawWidth = pdfWidth;
            drawHeight = pdfWidth / imgAspect;
          } else {
            // Image is taller than box - fit to height
            drawHeight = pdfHeight;
            drawWidth = pdfHeight * imgAspect;
          }

          // Center the image within the box
          const offsetX = (pdfWidth - drawWidth) / 2;
          const offsetY = (pdfHeight - drawHeight) / 2;

          page.drawImage(signatureImage, {
            x: pdfX + offsetX,
            y: pdfY + offsetY,
            width: drawWidth,
            height: drawHeight,
          });
        } else {
          // Draw placeholder label if no signature
          const label = FIELD_LABELS[field.type] || field.type;
          const fontSize = Math.min(pdfHeight * 0.5, 10);
          page.drawText(label, {
            x: pdfX + 4,
            y: pdfY + pdfHeight / 2 - fontSize / 2,
            size: fontSize,
            font,
            color: rgb(color.r, color.g, color.b),
          });
        }
        break;

      case "text":
        const textValue = field.value || FIELD_LABELS[field.type];
        const textFontSize = Math.min(pdfHeight * 0.7, 14);
        page.drawText(textValue!!, {
          x: pdfX + 4,
          y: pdfY + pdfHeight / 2 - textFontSize / 2,
          size: textFontSize,
          font,
          color: field.value ? rgb(0, 0, 0) : rgb(color.r, color.g, color.b),
        });
        break;

      case "date":
        const dateValue = field.value || new Date().toLocaleDateString();
        const dateFontSize = Math.min(pdfHeight * 0.6, 12);
        page.drawText(dateValue, {
          x: pdfX + 4,
          y: pdfY + pdfHeight / 2 - dateFontSize / 2,
          size: dateFontSize,
          font,
          color: rgb(0, 0, 0),
        });
        break;

      case "image":
        // For image fields, the value should contain base64 image data
        if (field.value) {
          try {
            const imgBase64 = field.value.replace(
              /^data:image\/(png|jpeg|jpg);base64,/,
              ""
            );
            const imgBytes = Buffer.from(imgBase64, "base64");
            let img;
            try {
              img = await pdfDoc.embedPng(imgBytes);
            } catch {
              img = await pdfDoc.embedJpg(imgBytes);
            }

            // Preserve aspect ratio
            const imgRatio = img.width / img.height;
            const fieldRatio = pdfWidth / pdfHeight;
            let w: number, h: number;
            if (imgRatio > fieldRatio) {
              w = pdfWidth;
              h = pdfWidth / imgRatio;
            } else {
              h = pdfHeight;
              w = pdfHeight * imgRatio;
            }
            const ox = (pdfWidth - w) / 2;
            const oy = (pdfHeight - h) / 2;

            page.drawImage(img, {
              x: pdfX + ox,
              y: pdfY + oy,
              width: w,
              height: h,
            });
          } catch (err) {
            console.warn("Failed to embed image field:", err);
            // Draw placeholder
            const label = FIELD_LABELS[field.type];
            const fontSize = Math.min(pdfHeight * 0.5, 10);
            page.drawText(label!!, {
              x: pdfX + 4,
              y: pdfY + pdfHeight / 2 - fontSize / 2,
              size: fontSize,
              font,
              color: rgb(color.r, color.g, color.b),
            });
          }
        } else {
          // Draw placeholder label
          const label = FIELD_LABELS[field.type];
          const fontSize = Math.min(pdfHeight * 0.5, 10);
          page.drawText(label!!, {
            x: pdfX + 4,
            y: pdfY + pdfHeight / 2 - fontSize / 2,
            size: fontSize,
            font,
            color: rgb(color.r, color.g, color.b),
          });
        }
        break;

      case "radio":
        // Draw circle outline always, fill if selected
        const radius = Math.min(pdfWidth, pdfHeight) / 2 - 2;
        page.drawCircle({
          x: pdfX + pdfWidth / 2,
          y: pdfY + pdfHeight / 2,
          size: radius,
          borderColor: rgb(color.r, color.g, color.b),
          borderWidth: 1,
          color: field.value === "true" || field.value === "selected" 
            ? rgb(color.r, color.g, color.b) 
            : undefined,
        });
        break;
    }
  }

  console.log("PDF processing complete");
  return pdfDoc.save();
}
