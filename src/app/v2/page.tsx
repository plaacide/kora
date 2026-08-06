import { redirect } from "next/navigation";

import { v2Routes } from "@/features/v2/navigation/routes";
import { metierDuCompte, requireV2User } from "@/features/v2/server/session";

/**
 * La porte d'entrée de la V2 : elle oriente selon le métier.
 *
 * Elle envoyait tout le monde sur l'accueil fondateur. Un programme y voyait
 * donc les écrans d'une entreprise, et son espace n'était atteignable qu'en
 * tapant l'adresse — autant dire qu'il n'existait pas.
 */
export default async function V2Page() {
  const user = await requireV2User();
  const metier = await metierDuCompte(user.id);

  redirect(
    metier === "sae" ? v2Routes.programme.cohortes.list : "/v2/accueil",
  );
}
