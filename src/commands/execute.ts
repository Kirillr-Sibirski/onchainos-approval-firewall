import { executeRevokeFlow, fetchApprovals, resolveDefaultAddress } from "../lib/okx.js";
import { buildPolicyDecisions } from "../lib/policy.js";
import type { PolicyDecision, PolicyPreset } from "../types.js";

function isCleanupDecision(
  decision: PolicyDecision
): decision is PolicyDecision & { action: "revoke" | "replace_with_exact_approval" } {
  return decision.action === "revoke" || decision.action === "replace_with_exact_approval";
}

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
  const cleanupTargets = decisions
    .filter(isCleanupDecision)
    .map((decision) => ({
      approval: decision.approval,
      plannedAction: decision.action
    }));

  const results = await executeRevokeFlow({
    approvals: cleanupTargets,
    chain: options.chain,
    from: address,
    apply: Boolean(options.apply)
  });

  if (options.format === "json") {
    console.log(JSON.stringify({ address, apply: Boolean(options.apply), results }, null, 2));
    return;
  }

  if (!results.length) {
    console.log("No cleanup actions were generated for the selected policy.");
    return;
  }

  console.log(
    `${options.apply ? "Applied" : "Prepared"} ${results.length} cleanup flow(s) for ${address}.`
  );
  console.log("");

  for (const result of results) {
    console.log(`Token: ${result.approval.tokenSymbol || result.approval.tokenAddress}`);
    console.log(`Spender: ${result.approval.spenderAddress}`);
    console.log(`Policy action: ${result.plannedAction}`);
    console.log(`Scan action: ${result.scan.action || "safe"}`);
    if (result.scan.simulator?.revertReason) {
      console.log(`Revert reason: ${result.scan.simulator.revertReason}`);
    }
    console.log(`Command: ${result.command.join(" ")}`);
    if (result.txHash) {
      console.log(`Tx hash: ${result.txHash}`);
    }
    if (result.followUp) {
      console.log(`Follow-up: ${result.followUp}`);
    }
    console.log("");
  }
}
