type JsPdfCtor = typeof import("jspdf");

type Html2CanvasCtor = typeof import("html2canvas");

export async function generateResumePdfBlobFromElement(el: HTMLElement): Promise<Blob> {
  const html2canvasMod: Html2CanvasCtor = await import("html2canvas");
  const html2canvas = html2canvasMod.default;

  const jsPdfMod: JsPdfCtor = await import("jspdf");
  const jsPDF = jsPdfMod.jsPDF;

  const bg = getComputedStyle(el).backgroundColor || getComputedStyle(document.documentElement).getPropertyValue("--surface").trim() || "white";
  const canvas = await html2canvas(el, {
    backgroundColor: bg,
    scale: Math.max(2, window.devicePixelRatio || 2),
    useCORS: true,
  });

  const imgData = canvas.toDataURL("image/png");

  const pdf = new jsPDF({ unit: "pt", format: "a4" });
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();

  const imgWidth = pageWidth;
  const imgHeight = (canvas.height * imgWidth) / canvas.width;

  let y = 0;
  let remaining = imgHeight;

  while (remaining > 0) {
    pdf.addImage(imgData, "PNG", 0, -y, imgWidth, imgHeight, undefined, "FAST");
    remaining -= pageHeight;
    y += pageHeight;
    if (remaining > 0) pdf.addPage();
  }

  return pdf.output("blob");
}

export async function downloadResumePdfFromElement(el: HTMLElement, filename: string) {
  const blob = await generateResumePdfBlobFromElement(el);
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
