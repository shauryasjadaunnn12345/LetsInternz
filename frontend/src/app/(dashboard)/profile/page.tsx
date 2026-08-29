import type { Metadata } from "next";

import ProfilePage from "@/components/profile/ProfilePage";

export const metadata: Metadata = {
  title: "My Profile",
  robots: { index: false, follow: false },
};

export default function Page() {
  return <ProfilePage />;
}
