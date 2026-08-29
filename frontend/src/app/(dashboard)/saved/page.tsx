import type { Metadata } from "next";

import SavedInternshipsPage from "@/components/saved/SavedInternshipsPage";

export const metadata: Metadata = {
  title: "Saved Internships",
  robots: { index: false, follow: false },
};

export default function SavedPage() {
  return <SavedInternshipsPage />;
}
