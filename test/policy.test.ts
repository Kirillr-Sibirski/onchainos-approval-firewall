import assert from "node:assert/strict";
import test from "node:test";

import { buildPolicyDecisions } from "../src/lib/policy.js";
import type { ApprovalRecord, PolicyConfig } from "../src/types.js";

function makeApproval(overrides: Partial<ApprovalRecord> = {}): ApprovalRecord {
  return {
    tokenSymbol: "USDC",
    tokenAddress: "0x1000000000000000000000000000000000000001",
    chainIndex: "196",
    spenderAddress: "0x2000000000000000000000000000000000000002",
    allowance: "unlimited",
    allowanceRaw: "",
    isUnlimited: true,
    riskLevel: "low",
    raw: {},
    ...overrides
  };
}

test("strict policy replaces unlimited approvals by default", () => {
  const decisions = buildPolicyDecisions([makeApproval()], "strict");

  assert.equal(decisions[0]?.action, "replace_with_exact_approval");
  assert.equal(decisions[0]?.severity, "high");
});

test("blocked spender policy forces revocation", () => {
  const approval = makeApproval();
  const config: PolicyConfig = {
    spenders: {
      [approval.spenderAddress]: {
        trust: "blocked",
        notes: ["Known-bad spender"]
      }
    }
  };

  const decisions = buildPolicyDecisions([approval], "trading", config);

  assert.equal(decisions[0]?.action, "revoke");
  assert.match(decisions[0]?.reason ?? "", /blocks this spender/i);
});

test("trusted exact allowance policy replaces unlimited approval with budget", () => {
  const approval = makeApproval();
  const config: PolicyConfig = {
    spenders: {
      [approval.spenderAddress]: {
        trust: "trusted",
        exactAllowance: "250000"
      }
    }
  };

  const decisions = buildPolicyDecisions([approval], "trading", config);

  assert.equal(decisions[0]?.action, "replace_with_exact_approval");
  assert.equal(decisions[0]?.replacementAllowance, "250000");
});
