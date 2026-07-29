import { AccessTable, AccessWizard, RequestPanel } from "@/features/v2/ui/Access";

export default async function AccessPage({
  searchParams,
}: {
  searchParams: Promise<{
    share?: string;
    request?: string;
    preview?: string;
    sent?: string;
  }>;
}) {
  const query = await searchParams;

  if (query.share) {
    return <AccessWizard step={query.share} preview={query.preview === "1"} />;
  }

  return (
    <>
      <AccessTable sent={query.sent === "1"} />
      {query.request === "1" && <RequestPanel />}
    </>
  );
}
