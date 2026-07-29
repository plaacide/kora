import { redirect } from "next/navigation";
import { v2Routes } from "@/features/v2/navigation/routes";

export default function V2OnboardingPage() {
  redirect(v2Routes.onboarding.company);
}
