export const PUBLIC_BROWSING_MODE = process.env.NEXT_PUBLIC_PUBLIC_BROWSING_MODE === "true";

// TEMPORARY: public browsing mode disables auth gating for basic browsing.
// TODO: Re-enable the login/signup requirement before production auth rollout.
export function isPublicBrowsingEnabled() {
  return PUBLIC_BROWSING_MODE;
}
