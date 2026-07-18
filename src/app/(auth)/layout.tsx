/**
 * Les pages auth composent elles-mêmes leur split-screen (via AuthSplit),
 * car le panneau gauche diffère entre connexion et inscription. Ce layout
 * n'est plus qu'un passe-plat.
 */
export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
