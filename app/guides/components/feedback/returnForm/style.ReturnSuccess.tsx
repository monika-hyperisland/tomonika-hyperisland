import styled from "styled-components";

export const SuccessPanel = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
  align-items: flex-start;
  max-width: 480px;
`;

export const SuccessHeading = styled.h2`
  margin: 0;
  font-size: var(--text-xl);
`;

export const SuccessText = styled.p`
  margin: 0;
  line-height: 1.5;
`;

/** A line above the fields when the student is returning for a second time. */
export const FormIntro = styled.p`
  margin: 0;
  padding: 0.6rem 0.8rem;
  border-radius: var(--radius-md);
  background: var(--accent-amber-10);
  color: var(--accent-amber-text);
  font-size: var(--text-sm);
  line-height: 1.45;
`;

// ── Returned panel ────────────────────────────────────────────────────────

export const ReturnedPanel = styled.section`
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
`;

export const ReturnedHeading = styled.h2<{ $tone: "ok" | "wait" | "bad" | "star" }>`
  margin: 0;
  font-size: var(--text-xl);
  color: ${({ $tone }) =>
    $tone === "bad"
      ? "var(--error-failure-100)"
      : $tone === "star"
        ? "var(--accent-violet-text)"
        : "var(--primary-black-100)"};
`;

export const ReturnedNote = styled.p`
  margin: 0;
  color: var(--primary-black-60);
  font-size: var(--text-sm);
  line-height: 1.5;
`;

export const ReturnedProject = styled.dl`
  margin: 0;
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 0.3rem 0.8rem;
  font-size: var(--text-sm);

  dt {
    color: var(--primary-black-60);
  }

  dd {
    margin: 0;
    min-width: 0;
    overflow-wrap: anywhere;
  }

  a {
    color: var(--theme-module3-hover);
  }
`;

export const ReturnedActions = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  align-items: center;
  margin-top: 0.25rem;
`;

export const ToggleRow = styled.label`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: var(--text-sm);
  color: var(--primary-black-100);
  cursor: pointer;
`;

export const ToggleInput = styled.input`
  width: 1rem;
  height: 1rem;
  accent-color: var(--primary-black-100);
`;

// ── Guest ─────────────────────────────────────────────────────────────────

export const GuestPanel = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  align-items: flex-start;
`;
