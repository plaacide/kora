import { requireV2User } from "@/features/v2/server/session";
import { OnboardingFrame } from "@/features/v2/ui/Onboarding";

export default async function V2OnboardingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireV2User();

  return <OnboardingFrame email={user.email}>{children}</OnboardingFrame>;
}
