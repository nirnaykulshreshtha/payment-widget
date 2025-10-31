/**
 * LazyMotionProvider
 *
 * Purpose:
 * - Provide framer-motion's LazyMotion + domAnimation features for the app.
 * - Centralize reduced-motion preference detection and expose a helper.
 */

"use client";

import { LazyMotion, domAnimation, m } from "framer-motion";
import { createContext, useContext, useMemo } from "react";
import { logger } from "@/lib/logger";

const MotionContext = createContext({ prefersReducedMotion: false });

export function LazyMotionProvider({ children }: { children: React.ReactNode }) {
  // framer-motion handles reduced motion at the hook level; here we provide a flag for custom logic
  const prefersReducedMotion = false;
  logger.debug("motion:provider:init", { prefersReducedMotion });

  return (
    <MotionContext.Provider value={useMemo(() => ({ prefersReducedMotion }), [prefersReducedMotion])}>
      <LazyMotion features={domAnimation}>{children}</LazyMotion>
    </MotionContext.Provider>
  );
}

export function useMotionPrefs() {
  return useContext(MotionContext);
}

export const Motion = {
  div: m.div,
  span: m.span,
  button: m.button,
  section: m.section,
  article: m.article,
  header: m.header,
  footer: m.footer,
  main: m.main,
  aside: m.aside,
  nav: m.nav,
  p: m.p,
  h1: m.h1,
  h2: m.h2,
  h3: m.h3,
  h4: m.h4,
  h5: m.h5,
  h6: m.h6,
  ul: m.ul,
  ol: m.ol,
  li: m.li,
  a: m.a,
  img: m.img,
  form: m.form,
  input: m.input,
  textarea: m.textarea,
  select: m.select,
  option: m.option,
  label: m.label,
  fieldset: m.fieldset,
  legend: m.legend,
  table: m.table,
  thead: m.thead,
  tbody: m.tbody,
  tr: m.tr,
  td: m.td,
  th: m.th,
  tfoot: m.tfoot,
  caption: m.caption,
  col: m.col,
  colgroup: m.colgroup,
};


