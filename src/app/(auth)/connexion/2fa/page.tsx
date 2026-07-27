import { TwoFactorChallenge } from "@/components/auth/TwoFactorChallenge";

/**
 * La 2FA s'intercale entre la connexion et la destination. Elle doit donc
 * porter `suivant` : sans lui, tout compte protégé perdrait son invitation au
 * moment précis où il prouve son identité.
 */
export default async function TwoFactorPage({
  searchParams,
}: {
  searchParams: Promise<{ suivant?: string }>;
}) {
  const { suivant } = await searchParams;
  return <TwoFactorChallenge suivant={suivant} />;
}
