import { resolveServerDataSource } from "@/lib/dataSource";
import { ImportClient } from "./ImportClient";

export default function ImportPage() {
  const allowImport = resolveServerDataSource() === "local";
  return <ImportClient allowImport={allowImport} />;
}
