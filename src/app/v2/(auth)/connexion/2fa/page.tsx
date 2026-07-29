import { AuthFrame, TwoFactorForm } from "@/features/v2/ui/Auth";

export default async function V2TwoFactorPage({
  searchParams,
}: {
  searchParams: Promise<{ suivant?: string }>;
}) {
  const { suivant } = await searchParams;

  return (
    <AuthFrame>
      <TwoFactorForm suivant={suivant} />
    </AuthFrame>
  );
}
