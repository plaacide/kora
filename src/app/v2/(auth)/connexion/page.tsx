import { AuthFrame, LoginForm } from "@/features/v2/ui/Auth";

export default async function V2LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ email?: string; erreur?: string; suivant?: string }>;
}) {
  const { email, erreur, suivant } = await searchParams;

  return (
    <AuthFrame>
      <LoginForm email={email} erreur={erreur} suivant={suivant} />
    </AuthFrame>
  );
}
