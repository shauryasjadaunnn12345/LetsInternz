"use client";

import { useState } from "react";

import InternshipDetailActions from "@/components/internships/InternshipDetailActions";
import InternshipPrepPanel from "@/components/internships/InternshipPrepPanel";
import type { Internship } from "@/lib/types";

/**
 * Ties the Apply/Save/Track actions to the prep-resources panel below them:
 * clicking Apply doesn't gate or delay the actual application (the outbound
 * link still opens immediately, same tab behavior as before) — it just
 * flags the panel to highlight itself right after, when interest in
 * "how do I actually get this" is at its highest. No modal, no blocking
 * step; the primary action is never interrupted.
 */
export default function ApplyAndPrepSection({ internship }: { internship: Internship }) {
  const [justApplied, setJustApplied] = useState(false);

  return (
    <>
      <InternshipDetailActions internship={internship} onApplyClick={() => setJustApplied(true)} />
      <InternshipPrepPanel internship={internship} justApplied={justApplied} />
    </>
  );
}
