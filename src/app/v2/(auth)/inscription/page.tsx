import { AuthFrame, SignupForm } from "@/features/v2/ui/Auth";

export default async function V2SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ email?: string; suivant?: string }>;
}) {
  const { email, suivant } = await searchParams;

  return (
    <AuthFrame>
      <SignupForm email={email} suivant={suivant} />
    </AuthFrame>
  );
}
