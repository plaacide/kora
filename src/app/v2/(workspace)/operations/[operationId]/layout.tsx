import { OperationShell } from "@/features/v2/ui/Shell";
export default async function Layout({children,params}:{children:React.ReactNode;params:Promise<{operationId:string}>}){const{operationId}=await params;return <OperationShell operationId={operationId}>{children}</OperationShell>}
