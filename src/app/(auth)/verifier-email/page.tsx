import Link from "next/link";

export default function VerifierEmailPage() {
  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-[22px] font-[650] tracking-[-0.02em]">
        Vérifiez votre email
      </h1>
      <p className="text-[13px] text-ink-secondary leading-relaxed">
        Un lien de confirmation vient de vous être envoyé. Cliquez dessus pour
        activer votre compte, puis connectez-vous.
      </p>
      <Link href="/connexion" className="text-[13px] font-medium">
        Retour à la connexion
      </Link>
    </div>
  );
}
