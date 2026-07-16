import { createClient } from "@/lib/supabase/server";
import { Card, CardHeader, CardBody } from "@/components/ui/Card";
import { TwoFactorSetup } from "@/components/auth/TwoFactorSetup";

export default async function SecuritePage() {
  const supabase = await createClient();
  const { data } = await supabase.auth.mfa.listFactors();
  const enabled = (data?.totp ?? []).some((f) => f.status === "verified");

  return (
    <div className="flex flex-col gap-6 max-w-2xl">
      <div>
        <h1 className="text-[22px] font-[650] tracking-[-0.02em]">Sécurité</h1>
        <p className="text-[12.5px] text-ink-secondary mt-0.5">
          Protégez votre compte et l&apos;accès aux data rooms.
        </p>
      </div>

      <Card>
        <CardHeader>Authentification à deux facteurs (2FA)</CardHeader>
        <CardBody>
          <TwoFactorSetup initialEnabled={enabled} />
        </CardBody>
      </Card>

      <Card>
        <CardHeader>Politique de mot de passe</CardHeader>
        <CardBody>
          <ul className="text-[12.5px] text-ink-secondary flex flex-col gap-1.5">
            <li>· 8 caractères minimum</li>
            <li>· Au moins une lettre et un chiffre</li>
            <li>· Vérifiée à l&apos;inscription et au changement de mot de passe</li>
          </ul>
        </CardBody>
      </Card>
    </div>
  );
}
