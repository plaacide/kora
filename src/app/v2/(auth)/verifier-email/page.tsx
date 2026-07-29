import Link from "next/link";
import { AuthFrame } from "@/features/v2/ui/Auth";
import { Icon } from "@/features/v2/ui/Icon";

export default async function V2VerifyEmailPage({
  searchParams,
}: {
  searchParams: Promise<{ email?: string }>;
}) {
  const { email } = await searchParams;

  return (
    <AuthFrame>
      <section className="v2-auth-confirmation">
        <span className="v2-auth-confirmation-icon">
          <Icon name="mail" />
        </span>
        <div className="v2-auth-title">
          <h1>Vérifiez votre e-mail</h1>
          <p>
            Nous avons envoyé un lien de confirmation
            {email ? (
              <>
                {" à "}
                <strong>{email}</strong>
              </>
            ) : null}
            .
          </p>
        </div>
        <div className="v2-auth-note">
          Ouvrez le lien reçu pour activer votre compte. Si cette adresse
          possède déjà un compte, connectez-vous directement ou réinitialisez
          votre mot de passe.
        </div>
        <Link className="v2-auth-submit" href="/v2/connexion">
          Revenir à la connexion
        </Link>
        <p className="v2-auth-switch">
          Mauvaise adresse ? <Link href="/v2/inscription">La modifier</Link>
        </p>
      </section>
    </AuthFrame>
  );
}
