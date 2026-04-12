import { getSpenderPolicy } from "./config.js";

import type { ApprovalRecord, PolicyConfig, PolicyDecision, PolicyPreset } from "../types.js";

function isUnlimited(allowance: string): boolean {
  return allowance.toLowerCase() === "unlimited";
}

function riskSeverity(riskLevel: string): "low" | "medium" | "high" {
  const value = riskLevel.toLowerCase();
  if (value.includes("high")) {
    return "high";
  }
  if (value.includes("medium")) {
    return "medium";
  }
  return "low";
}

function parseBigIntValue(value: string | undefined): bigint | undefined {
  if (!value || !/^\d+$/.test(value)) {
    return undefined;
  }
  try {
    return BigInt(value);
  } catch {
    return undefined;
  }
}

export function buildPolicyDecisions(
  approvals: ApprovalRecord[],
  policy: PolicyPreset,
  config?: PolicyConfig
): PolicyDecision[] {
  return approvals.map((approval) => {
    const severity = riskSeverity(approval.riskLevel);
    const unlimited = approval.isUnlimited || isUnlimited(approval.allowance);
    const spenderPolicy = getSpenderPolicy(config, approval.spenderAddress);
    const notes = [...(spenderPolicy?.notes ?? [])];
    const policyLabel = spenderPolicy?.label;
    const maxAllowance = parseBigIntValue(spenderPolicy?.maxAllowance);
    const exactAllowance = spenderPolicy?.exactAllowance;
    const currentAllowance = approval.isUnlimited
      ? undefined
      : parseBigIntValue(approval.allowanceRaw);

    if (spenderPolicy?.trust === "blocked") {
      notes.push("Local policy marks this spender as blocked.");
      return {
        approval,
        action: "revoke",
        severity: "high",
        reason: "Local policy blocks this spender, so the approval should be revoked.",
        policyLabel,
        notes
      };
    }

    if (
      spenderPolicy?.exactAllowance &&
      unlimited &&
      spenderPolicy.trust === "trusted"
    ) {
      notes.push("Trusted spender has an exact allowance target from local policy.");
      return {
        approval,
        action: "replace_with_exact_approval",
        severity: policy === "strict" ? "high" : "medium",
        reason: "Unlimited approval exceeds the local spender budget and should be replaced with the configured exact allowance.",
        replacementAllowance: exactAllowance,
        policyLabel,
        notes
      };
    }

    if (
      currentAllowance !== undefined &&
      maxAllowance !== undefined &&
      currentAllowance > maxAllowance
    ) {
      notes.push("Current approval is above the configured spender budget.");
      return {
        approval,
        action: "replace_with_exact_approval",
        severity: "medium",
        reason: "Approval is above the configured spender budget and should be reduced.",
        replacementAllowance: exactAllowance ?? spenderPolicy?.maxAllowance,
        policyLabel,
        notes
      };
    }

    if (policy === "strict") {
      if (severity === "high") {
        return {
          approval,
          action: "revoke",
          severity,
          reason: "High-risk spender exposure should be revoked immediately.",
          policyLabel,
          notes
        };
      }
      if (unlimited) {
        return {
          approval,
          action: "replace_with_exact_approval",
          severity: "high",
          reason: "Unlimited approval violates the strict policy preset.",
          replacementAllowance: exactAllowance,
          policyLabel,
          notes
        };
      }
      if (severity === "medium") {
        return {
          approval,
          action: "review",
          severity,
          reason: "Medium-risk approval needs explicit review before it remains active.",
          policyLabel,
          notes
        };
      }
      if (spenderPolicy?.trust === "watchlist") {
        notes.push("Spender is on the local watchlist.");
        return {
          approval,
          action: "review",
          severity: "medium",
          reason: "Finite approval belongs to a watchlisted spender and should be reviewed.",
          policyLabel,
          notes
        };
      }
      return {
        approval,
        action: "keep",
        severity,
        reason: "Finite low-risk approval is acceptable under the strict preset.",
        policyLabel,
        notes
      };
    }

    if (policy === "minimal") {
      if (severity === "high") {
        return {
          approval,
          action: "revoke",
          severity,
          reason: "Minimal mode still revokes clearly dangerous approvals.",
          policyLabel,
          notes
        };
      }
      if (unlimited && severity !== "low") {
        return {
          approval,
          action: "review",
          severity: "medium",
          reason: "Unlimited approval with non-low risk should be reviewed.",
          policyLabel,
          notes
        };
      }
      if (spenderPolicy?.trust === "watchlist") {
        notes.push("Spender is on the local watchlist.");
        return {
          approval,
          action: "review",
          severity: "medium",
          reason: "Watchlisted spender should be reviewed before remaining active.",
          policyLabel,
          notes
        };
      }
      return {
        approval,
        action: "keep",
        severity,
        reason: "Approval stays active under the minimal preset.",
        policyLabel,
        notes
      };
    }

    if (severity === "high") {
      return {
        approval,
        action: "revoke",
        severity,
        reason: "Trading mode still revokes high-risk spender exposure.",
        policyLabel,
        notes
      };
    }

    if (unlimited) {
      return {
        approval,
        action: "replace_with_exact_approval",
        severity: "medium",
        reason: "Unlimited trading approvals should be reduced to exact approvals when possible.",
        replacementAllowance: exactAllowance,
        policyLabel,
        notes
      };
    }

    if (severity === "medium") {
      return {
        approval,
        action: "review",
        severity,
        reason: "Medium-risk approval can stay active only after human review.",
        policyLabel,
        notes
      };
    }

    if (spenderPolicy?.trust === "watchlist") {
      notes.push("Spender is on the local watchlist.");
      return {
        approval,
        action: "review",
        severity: "medium",
        reason: "Watchlisted spender should be reviewed before it remains active in trading mode.",
        policyLabel,
        notes
      };
    }

    return {
      approval,
      action: "keep",
      severity,
      reason: "Approval is compatible with the trading preset.",
      policyLabel,
      notes
    };
  });
}
