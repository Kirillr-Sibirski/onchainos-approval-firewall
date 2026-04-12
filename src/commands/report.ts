import { formatMarkdownReport } from "../lib/format.js";
import { fetchApprovals, resolveDefaultAddress } from "../lib/okx.js";
import { buildPolicyDecisions } from "../lib/policy.js";
import type { PolicyPreset } from "../types.js";

export async function reportCommand(options: {
  address?: string;
  chain?: string;
  policy: PolicyPreset;
  format?: "markdown" | "json";
}): Promise<void> {
  const address = options.address ?? (await resolveDefaultAddress());
  const approvals = await fetchApprovals({ address, chain: options.chain });
  const decisions = buildPolicyDecisions(approvals, options.policy);

  if (options.format === "json") {
    console.log(JSON.stringify({ address, approvals, decisions }, null, 2));
    return;
  }

  console.log(formatMarkdownReport(approvals, decisions, options.policy));
}
