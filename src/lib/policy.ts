import type { ApprovalRecord, PolicyDecision, PolicyPreset } from "../types.js";

function isUnlimited(allowance: string): boolean {
  return allowance === "unlimited";
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

export function buildPolicyDecisions(
  approvals: ApprovalRecord[],
  policy: PolicyPreset
): PolicyDecision[] {
  return approvals.map((approval) => {
    const severity = riskSeverity(approval.riskLevel);
    const unlimited = isUnlimited(approval.allowance);

    if (policy === "strict") {
      if (severity === "high") {
        return {
          approval,
          action: "revoke",
          severity,
          reason: "High-risk spender exposure should be revoked immediately."
        };
      }
      if (unlimited) {
        return {
          approval,
          action: "replace_with_exact_approval",
          severity: "high",
          reason: "Unlimited approval violates the strict policy preset."
        };
      }
      if (severity === "medium") {
        return {
          approval,
          action: "review",
          severity,
          reason: "Medium-risk approval needs explicit review before it remains active."
        };
      }
      return {
        approval,
        action: "keep",
        severity,
        reason: "Finite low-risk approval is acceptable under the strict preset."
      };
    }

    if (policy === "minimal") {
      if (severity === "high") {
        return {
          approval,
          action: "revoke",
          severity,
          reason: "Minimal mode still revokes clearly dangerous approvals."
        };
      }
      if (unlimited && severity !== "low") {
        return {
          approval,
          action: "review",
          severity: "medium",
          reason: "Unlimited approval with non-low risk should be reviewed."
        };
      }
      return {
        approval,
        action: "keep",
        severity,
        reason: "Approval stays active under the minimal preset."
      };
    }

    if (severity === "high") {
      return {
        approval,
        action: "revoke",
        severity,
        reason: "Trading mode still revokes high-risk spender exposure."
      };
    }

    if (unlimited) {
      return {
        approval,
        action: "replace_with_exact_approval",
        severity: "medium",
        reason: "Unlimited trading approvals should be reduced to exact approvals when possible."
      };
    }

    if (severity === "medium") {
      return {
        approval,
        action: "review",
        severity,
        reason: "Medium-risk approval can stay active only after human review."
      };
    }

    return {
      approval,
      action: "keep",
      severity,
      reason: "Approval is compatible with the trading preset."
    };
  });
}
