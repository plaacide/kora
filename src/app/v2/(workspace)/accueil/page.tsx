import { requireV2Workspace } from "@/features/v2/server/session";
import { HomeScreen } from "@/features/v2/ui/Home";

export default async function AccueilPage() {
  const { user } = await requireV2Workspace();

  // Le prénom vient de l'e-mail faute de mieux : le nom complet n'est pas
  // encore lu ici, et la maquette ne salue jamais par une adresse.
  const firstName = (user.email.split("@")[0] ?? "").split(/[._-]/)[0];

  return (
    <HomeScreen
      firstName={firstName ? firstName[0].toUpperCase() + firstName.slice(1) : "à vous"}
    />
  );
}
