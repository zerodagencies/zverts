import jsPDF from "jspdf";
import type { StoredChat } from "./types";

const fmtDate = (n: number) => new Date(n).toLocaleString();

export function exportAsTxt(chat: StoredChat) {
  const lines = [
    `${chat.title}`,
    `Exported ${fmtDate(Date.now())}`,
    "",
    ...chat.messages.map((m) => `${m.role === "user" ? "You" : "Vert"}:\n${m.content}\n`),
  ];
  download(`${slug(chat.title)}.txt`, lines.join("\n"), "text/plain");
}

export function exportAsMarkdown(chat: StoredChat) {
  const md = [
    `# ${chat.title}`,
    `_Exported ${fmtDate(Date.now())}_`,
    "",
    ...chat.messages.map((m) => `### ${m.role === "user" ? "You" : "Vert"}\n\n${m.content}\n`),
  ].join("\n");
  download(`${slug(chat.title)}.md`, md, "text/markdown");
}

export function exportAsPdf(chat: StoredChat) {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const margin = 48;
  const width = doc.internal.pageSize.getWidth() - margin * 2;
  const lh = 14;
  let y = margin;

  doc.setFont("helvetica", "bold"); doc.setFontSize(16);
  doc.text(chat.title, margin, y); y += 22;
  doc.setFont("helvetica", "normal"); doc.setFontSize(10); doc.setTextColor(120);
  doc.text(`Exported ${fmtDate(Date.now())}`, margin, y); y += 24;
  doc.setTextColor(20);

  for (const m of chat.messages) {
    doc.setFont("helvetica", "bold"); doc.setFontSize(11);
    const speaker = m.role === "user" ? "You" : "Vert";
    if (y > doc.internal.pageSize.getHeight() - margin) { doc.addPage(); y = margin; }
    doc.text(speaker, margin, y); y += 14;
    doc.setFont("helvetica", "normal"); doc.setFontSize(11);
    const wrapped = doc.splitTextToSize(m.content, width);
    for (const line of wrapped) {
      if (y > doc.internal.pageSize.getHeight() - margin) { doc.addPage(); y = margin; }
      doc.text(line, margin, y); y += lh;
    }
    y += 8;
  }
  doc.save(`${slug(chat.title)}.pdf`);
}

function slug(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 60) || "chat";
}
function download(filename: string, content: string, mime: string) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename; a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}