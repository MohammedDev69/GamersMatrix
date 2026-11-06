"use client";

import { useEffect } from "react";

export function SetLocaleAttributes({
  locale,
  dir,
}: {
  locale: string;
  dir: "rtl" | "ltr";
}) {
  useEffect(() => {
    document.documentElement.lang = locale;
    document.documentElement.dir = dir;
    document.body.classList.toggle("font-latin", locale === "en");
    document.body.classList.toggle("font-arabic", locale !== "en");
  }, [locale, dir]);

  return null;
}
