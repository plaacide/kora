import { redirect } from "next/navigation";
import { v2Routes } from "@/features/v2/navigation/routes";

export default async function OperationPage(
  props: {
    params: Promise<{ operationId: string }>;
  },
) {
  const { operationId } = await props.params;

  redirect(v2Routes.operations.overview(operationId));
}
