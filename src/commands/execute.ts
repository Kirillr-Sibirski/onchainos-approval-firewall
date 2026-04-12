import { executeRevokeFlow, fetchApprovals, resolveDefaultAddress } from "../lib/okx.js";
import { buildPolicyDecisions } from "../lib/policy.js";
import type { PolicyPreset } from "../types.js";

export async function executeCommand(options: {
  address?: string;
  chain: string;
  policy: PolicyPreset;
  apply?: boolean;
  format?: "pretty" | "json";
}): Promise<void> {
  const address = options.address ?? (await resolveDefaultAddress());
  const approvals = await fetchApprovals({ address, chain: options.chain });
  const decisions = buildPolicyDecisions(approvals, options.policy);
  const revokes = decisions
    .filter((decision) => decision.action === "revoke")
    .map((decision) => decision.approval);

  const results = await executeRevokeFlow({
    approvals: revokes,
    chain: options.chain,
    from: address,
    apply: Boolean(options.apply)
  });

  if (options.format === "json") {
    console.log(JSON.stringify({ address, apply: Boolean(options.apply), results }, null, 2));
    return;
  }

  if (!results.length) {
    console.log("No revoke actions were generated for the selected policy.");
    return;
  }

  console.log(
    `${options.apply ? "Applied" : "Prepared"} ${results.length} revoke flow(s) for ${address}.`
  );
  console.log("");

  for (const result of results) {
    console.log(`Token: ${result.approval.tokenSymbol || result.approval.tokenAddress}`);
    console.log(`Spender: ${result.approval.spenderAddress}`);
    console.log(`Scan action: ${result.scan.action || "safe"}`);
    if (result.scan.simulator?.revertReason) {
      console.log(`Revert reason: ${result.scan.simulator.revertReason}`);
    }
    console.log(`Command: ${result.command.join(" ")}`);
    if (result.txHash) {
      console.log(`Tx hash: ${result.txHash}`);
    }
    console.log("");
  }
}
