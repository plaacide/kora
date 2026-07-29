import { requireV2User } from "@/features/v2/server/session";

export default async function V2OnboardingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireV2User();

  return children;
}
