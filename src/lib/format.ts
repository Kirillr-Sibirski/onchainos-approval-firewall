import type { ApprovalRecord, InspectionSummary, PolicyDecision } from "../types.js";

function displayAllowance(approval: ApprovalRecord): string {
  return approval.isUnlimited ? "unlimited" : approval.allowance;
}

export function summarizeApprovals(approvals: ApprovalRecord[]): InspectionSummary {
  let unlimitedApprovals = 0;
  let highRiskApprovals = 0;
  let mediumRiskApprovals = 0;
  let lowRiskApprovals = 0;

  for (const approval of approvals) {
    if (approval.isUnlimited) {
      unlimitedApprovals += 1;
    }

    const risk = approval.riskLevel.toLowerCase();
    if (risk.includes("high")) {
      highRiskApprovals += 1;
    } else if (risk.includes("medium")) {
      mediumRiskApprovals += 1;
    } else {
      lowRiskApprovals += 1;
    }
  }

  return {
    totalApprovals: approvals.length,
    unlimitedApprovals,
    highRiskApprovals,
    mediumRiskApprovals,
    lowRiskApprovals
  };
}

export function formatInspection(approvals: ApprovalRecord[]): string {
  const summary = summarizeApprovals(approvals);
  const lines = [
    "PermissionGuard Inspection",
    `Total approvals: ${summary.totalApprovals}`,
    `Unlimited approvals: ${summary.unlimitedApprovals}`,
    `High risk approvals: ${summary.highRiskApprovals}`,
    `Medium risk approvals: ${summary.mediumRiskApprovals}`,
    `Low risk approvals: ${summary.lowRiskApprovals}`,
    ""
  ];

  if (!approvals.length) {
    lines.push("No approvals found for the selected wallet or chain.", "");
    return lines.join("\n");
  }

  for (const approval of approvals) {
    lines.push(
      `${approval.tokenSymbol || "UNKNOWN"} on chain ${approval.chainIndex}`,
      `  Token: ${approval.tokenAddress}`,
      `  Spender: ${approval.spenderAddress}`,
      `  Allowance: ${displayAllowance(approval)}`,
      `  Risk: ${approval.riskLevel || "unknown"}`,
      ""
    );
  }

  return lines.join("\n");
}

export function formatPlan(decisions: PolicyDecision[]): string {
  const lines = ["PermissionGuard Plan", ""];

  if (!decisions.length) {
    lines.push("No policy actions are needed for the selected wallet or chain.", "");
    return lines.join("\n");
  }

  for (const decision of decisions) {
    lines.push(
      `${decision.action.toUpperCase()} [${decision.severity}]`,
      `  Token: ${decision.approval.tokenSymbol || decision.approval.tokenAddress}`,
      `  Spender: ${decision.approval.spenderAddress}`,
      `  Allowance: ${displayAllowance(decision.approval)}`,
      `  Why: ${decision.reason}`,
      ""
    );
  }

  return lines.join("\n");
}

export function formatMarkdownReport(
  approvals: ApprovalRecord[],
  decisions: PolicyDecision[],
  policy: string
): string {
  const summary = summarizeApprovals(approvals);
  const lines = [
    "# PermissionGuard Report",
    "",
    `Policy preset: \`${policy}\``,
    "",
    "## Summary",
    `- Total approvals: ${summary.totalApprovals}`,
    `- Unlimited approvals: ${summary.unlimitedApprovals}`,
    `- High risk approvals: ${summary.highRiskApprovals}`,
    `- Medium risk approvals: ${summary.mediumRiskApprovals}`,
    `- Low risk approvals: ${summary.lowRiskApprovals}`,
    "",
    "## Recommended Actions"
  ];

  if (!decisions.length) {
    lines.push("- No approval actions are needed.");
  }

  for (const decision of decisions) {
    lines.push(
      `- **${decision.action}** for \`${decision.approval.tokenSymbol || decision.approval.tokenAddress}\` -> \`${decision.approval.spenderAddress}\`: ${decision.reason}`
    );
  }

  lines.push("", "## Raw Approvals");

  if (!approvals.length) {
    lines.push("- No approvals were found.");
    return lines.join("\n");
  }

  for (const approval of approvals) {
    lines.push(
      `- \`${approval.tokenSymbol || "UNKNOWN"}\` on chain \`${approval.chainIndex}\`: spender \`${approval.spenderAddress}\`, allowance \`${displayAllowance(approval)}\`, risk \`${approval.riskLevel || "unknown"}\``
    );
  }

  return lines.join("\n");
}
