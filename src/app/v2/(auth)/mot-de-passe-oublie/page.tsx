import { AuthFrame, ForgotPasswordForm } from "@/features/v2/ui/Auth";

export default async function V2ForgotPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ erreur?: string }>;
}) {
  // `/auth/confirm` renvoie ici quand un lien de réinitialisation a expiré :
  // c'est le seul écran d'où l'on peut en redemander un.
  const { erreur } = await searchParams;

  return (
    <AuthFrame>
      <ForgotPasswordForm erreur={erreur} />
    </AuthFrame>
  );
}
