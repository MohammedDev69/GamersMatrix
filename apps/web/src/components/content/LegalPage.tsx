import { ReactNode } from "react";
import { StoreShell } from "@/components/layout/StoreShell";

type Section = {
  title: string;
  body: ReactNode;
};

type Props = {
  title: string;
  intro: string;
  ownerNotice: string;
  sections: Section[];
};

export function LegalPage({ title, intro, ownerNotice, sections }: Props) {
  return (
    <StoreShell>
      <article className="gm-container max-w-3xl py-8 md:py-10">
        <h1 className="gm-display text-3xl font-extrabold text-[var(--gm-text)] md:text-4xl">
          {title}
        </h1>
        <p className="mt-4 text-[var(--gm-text-secondary)] leading-7">{intro}</p>
        <p
          className="mt-4 rounded-[var(--gm-radius-btn)] border border-[var(--gm-warning)]/40 bg-[rgba(245,184,75,0.08)] px-4 py-3 text-sm text-[var(--gm-warning)]"
          role="note"
        >
          {ownerNotice}
        </p>
        <div className="mt-8 space-y-8">
          {sections.map((section) => (
            <section key={section.title}>
              <h2 className="text-xl font-bold text-[var(--gm-text)]">
                {section.title}
              </h2>
              <div className="mt-3 space-y-3 text-sm leading-7 text-[var(--gm-text-secondary)]">
                {section.body}
              </div>
            </section>
          ))}
        </div>
      </article>
    </StoreShell>
  );
}
