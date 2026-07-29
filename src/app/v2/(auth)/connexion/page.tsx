import { AuthFrame, LoginForm } from "@/features/v2/ui/Auth";

export default async function V2LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ email?: string; suivant?: string }>;
}) {
  const { email, suivant } = await searchParams;

  return (
    <AuthFrame>
      <LoginForm email={email} suivant={suivant} />
    </AuthFrame>
  );
}
