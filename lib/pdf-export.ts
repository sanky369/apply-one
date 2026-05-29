// Client-side PDF generation + download. Dynamically pulls @react-pdf/renderer
// so it stays out of the initial bundle.
import { createElement } from "react";
import type { MasterResume } from "./types";
import { slug } from "./utils";

export async function downloadResumePdf(
  resume: MasterResume,
  company?: string,
): Promise<void> {
  const [{ pdf }, { ResumeDocument }] = await Promise.all([
    import("@react-pdf/renderer"),
    import("@/components/resume-pdf-doc"),
  ]);

  const element = createElement(ResumeDocument, { resume });
  const blob = await pdf(
    element as unknown as Parameters<typeof pdf>[0],
  ).toBlob();

  const name = slug(resume.contact.name || "Resume");
  const co = company ? `_${slug(company)}` : "";
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `Resume_${name}${co}.pdf`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
