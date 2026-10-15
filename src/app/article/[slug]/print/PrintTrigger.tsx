"use client";

import { useEffect } from "react";

// Lives on the print-only version of an article (src/app/article/[slug]/print).
// Wires up the manual "طباعة / حفظ كـ PDF" button, and when the page is
// opened with ?autoprint=1 (the link used by the "تحميل المقال" button on
// the real article page), opens the browser's print dialog automatically
// so the visitor can choose "Save as PDF" without an extra click.
export default function PrintTrigger() {
  useEffect(() => {
    const trigger = () => window.print();
    const btn = document.querySelector("[data-print-trigger]");
    btn?.addEventListener("click", trigger);

    let timer: number | undefined;
    const params = new URLSearchParams(window.location.search);
    if (params.get("autoprint") === "1") {
      // Give fonts/images a moment to finish laying out before printing.
      timer = window.setTimeout(trigger, 350);
    }

    return () => {
      btn?.removeEventListener("click", trigger);
      if (timer) window.clearTimeout(timer);
    };
  }, []);

  return null;
}
