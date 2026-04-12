import { formatInspection } from "../lib/format.js";
import { fetchApprovals, resolveDefaultAddress } from "../lib/okx.js";

export async function inspectCommand(options: {
  address?: string;
  chain?: string;
  format?: "pretty" | "json";
}): Promise<void> {
  const address = options.address ?? (await resolveDefaultAddress());
  const approvals = await fetchApprovals({ address, chain: options.chain });

  if (options.format === "json") {
    console.log(JSON.stringify({ address, approvals }, null, 2));
    return;
  }

  console.log(formatInspection(approvals));
}
