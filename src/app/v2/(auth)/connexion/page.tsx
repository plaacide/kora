import { AuthFrame, LoginForm } from "@/features/v2/ui/Auth";

export default async function V2LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ email?: string; erreur?: string; suivant?: string }>;
}) {
  const { email, erreur, suivant } = await searchParams;

  // `?suivant=` VIDE n'est pas `undefined` : le paramètre par défaut du
  // composant ne s'appliquerait pas, et la destination retomberait sur la V1.
  return (
    <AuthFrame>
      <LoginForm email={email} erreur={erreur} suivant={suivant || undefined} />
    </AuthFrame>
  );
}
