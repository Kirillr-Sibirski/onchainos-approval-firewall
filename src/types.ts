export type PolicyPreset = "strict" | "minimal" | "trading";

export type PermissionAction =
  | "keep"
  | "review"
  | "revoke"
  | "replace_with_exact_approval";

export interface ApprovalRecord {
  tokenSymbol: string;
  tokenAddress: string;
  chainIndex: string;
  spenderAddress: string;
  allowance: string;
  riskLevel: string;
  protocolLabel?: string;
  raw: unknown;
}

export interface InspectionSummary {
  totalApprovals: number;
  unlimitedApprovals: number;
  highRiskApprovals: number;
  mediumRiskApprovals: number;
  lowRiskApprovals: number;
}

export interface PolicyDecision {
  approval: ApprovalRecord;
  action: PermissionAction;
  severity: "low" | "medium" | "high";
  reason: string;
}

export interface ScanResult {
  action?: string;
  warnings?: string[];
  riskItemDetail?: Array<{
    name?: string;
    action?: string;
    description?: Record<string, string>;
  }>;
  simulator?: {
    gasLimit?: number;
    revertReason?: string | null;
  };
}

export interface ExecuteResult {
  approval: ApprovalRecord;
  scan: ScanResult;
  command: string[];
  txHash?: string;
}
