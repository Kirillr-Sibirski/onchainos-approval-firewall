import { formatPlan } from "../lib/format.js";
import { fetchApprovals, resolveDefaultAddress } from "../lib/okx.js";
import { buildPolicyDecisions } from "../lib/policy.js";
import type { PolicyPreset } from "../types.js";

export async function planCommand(options: {
  address?: string;
  chain?: string;
  policy: PolicyPreset;
  format?: "pretty" | "json";
}): Promise<void> {
  const address = options.address ?? (await resolveDefaultAddress());
  const approvals = await fetchApprovals({ address, chain: options.chain });
  const decisions = buildPolicyDecisions(approvals, options.policy);

  if (options.format === "json") {
    console.log(JSON.stringify({ address, policy: options.policy, decisions }, null, 2));
    return;
  }

  console.log(formatPlan(decisions));
}
