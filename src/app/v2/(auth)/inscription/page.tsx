import { AuthFrame, SignupForm } from "@/features/v2/ui/Auth";

export default async function V2SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ email?: string; suivant?: string }>;
}) {
  const { email, suivant } = await searchParams;

  // `?suivant=` VIDE n'est pas `undefined` : le paramètre par défaut du
  // composant ne s'appliquerait pas, et la destination retomberait sur la V1.
  return (
    <AuthFrame>
      <SignupForm email={email} suivant={suivant || undefined} />
    </AuthFrame>
  );
}
