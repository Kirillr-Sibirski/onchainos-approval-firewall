import type { ApprovalRecord, InspectionSummary, PolicyDecision } from "../types.js";

export function summarizeApprovals(approvals: ApprovalRecord[]): InspectionSummary {
  let unlimitedApprovals = 0;
  let highRiskApprovals = 0;
  let mediumRiskApprovals = 0;
  let lowRiskApprovals = 0;

  for (const approval of approvals) {
    if (approval.allowance === "unlimited") {
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

  for (const approval of approvals) {
    lines.push(
      `${approval.tokenSymbol || "UNKNOWN"} on chain ${approval.chainIndex}`,
      `  Token: ${approval.tokenAddress}`,
      `  Spender: ${approval.spenderAddress}`,
      `  Allowance: ${approval.allowance}`,
      `  Risk: ${approval.riskLevel || "unknown"}`,
      ""
    );
  }

  return lines.join("\n");
}

export function formatPlan(decisions: PolicyDecision[]): string {
  const lines = ["PermissionGuard Plan", ""];

  for (const decision of decisions) {
    lines.push(
      `${decision.action.toUpperCase()} [${decision.severity}]`,
      `  Token: ${decision.approval.tokenSymbol || decision.approval.tokenAddress}`,
      `  Spender: ${decision.approval.spenderAddress}`,
      `  Allowance: ${decision.approval.allowance}`,
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

  for (const decision of decisions) {
    lines.push(
      `- **${decision.action}** for \`${decision.approval.tokenSymbol || decision.approval.tokenAddress}\` -> \`${decision.approval.spenderAddress}\`: ${decision.reason}`
    );
  }

  lines.push("", "## Raw Approvals");

  for (const approval of approvals) {
    lines.push(
      `- \`${approval.tokenSymbol || "UNKNOWN"}\` on chain \`${approval.chainIndex}\`: spender \`${approval.spenderAddress}\`, allowance \`${approval.allowance}\`, risk \`${approval.riskLevel || "unknown"}\``
    );
  }

  return lines.join("\n");
}
