import { formatInspection } from "../lib/format.js";
import { loadPolicyConfig } from "../lib/config.js";
import { fetchApprovals, resolveDefaultAddress } from "../lib/okx.js";

export async function inspectCommand(options: {
  address?: string;
  chain?: string;
  config?: string;
  format?: "pretty" | "json";
}): Promise<void> {
  const { config } = await loadPolicyConfig(options.config);
  const address = options.address ?? (await resolveDefaultAddress());
  const chain = options.chain ?? config?.defaults?.chain;
  const approvals = await fetchApprovals({ address, chain });

  if (options.format === "json") {
    console.log(JSON.stringify({ address, chain, approvals }, null, 2));
    return;
  }

  console.log(formatInspection(approvals));
}
