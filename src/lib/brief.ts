import { summarizeApprovals } from "./format.js";

import type { ApprovalRecord, PolicyDecision, PolicyPreset } from "../types.js";

export interface BriefContext {
  address: string;
  chain?: string;
  policy: PolicyPreset;
  approvals: ApprovalRecord[];
  decisions: PolicyDecision[];
}

export function buildBriefPrompt(context: BriefContext): string {
  const summary = summarizeApprovals(context.approvals);
  const actions = context.decisions
    .filter((decision) => decision.action !== "keep")
    .slice(0, 5)
    .map((decision) => ({
      action: decision.action,
      severity: decision.severity,
      token: decision.approval.tokenSymbol || decision.approval.tokenAddress,
      spender: decision.approval.spenderAddress,
      reason: decision.reason,
      replacementAllowance: decision.replacementAllowance ?? null
    }));

  return [
    "Create a concise operator briefing for an approval firewall run.",
    "Focus on risk, next action, and execution safety.",
    "",
    `Wallet: ${context.address}`,
    `Chain: ${context.chain ?? "default"}`,
    `Policy: ${context.policy}`,
    "",
    "Approval summary:",
    JSON.stringify(summary, null, 2),
    "",
    "Top policy actions:",
    JSON.stringify(actions, null, 2),
    "",
    "Return markdown with these sections:",
    "1. Operator Summary",
    "2. Critical Findings",
    "3. Recommended Next Step",
    "4. Safety Notes"
  ].join("\n");
}

function resolveBaseUrl(baseUrl?: string): string {
  const value = baseUrl ?? process.env.APPROVAL_FIREWALL_LLM_BASE_URL ?? process.env.OPENAI_BASE_URL;
  if (!value) {
    return "https://api.openai.com/v1";
  }
  return value.endsWith("/") ? value.slice(0, -1) : value;
}

function resolveModel(model?: string): string {
  return model ?? process.env.APPROVAL_FIREWALL_LLM_MODEL ?? process.env.OPENAI_MODEL ?? "gpt-4o-mini";
}

function resolveApiKey(apiKey?: string): string | undefined {
  return apiKey ?? process.env.APPROVAL_FIREWALL_LLM_API_KEY ?? process.env.OPENAI_API_KEY;
}

export async function generateOperatorBrief(params: BriefContext & {
  apiKey?: string;
  baseUrl?: string;
  model?: string;
}): Promise<string> {
  const apiKey = resolveApiKey(params.apiKey);
  if (!apiKey) {
    throw new Error(
      "No LLM API key found. Set APPROVAL_FIREWALL_LLM_API_KEY or OPENAI_API_KEY to enable model-backed operator briefings."
    );
  }

  const response = await fetch(`${resolveBaseUrl(params.baseUrl)}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: resolveModel(params.model),
      temperature: 0.2,
      messages: [
        {
          role: "system",
          content:
            "You are a security-focused approval firewall copilot. Be concise, practical, and operator-friendly."
        },
        {
          role: "user",
          content: buildBriefPrompt(params)
        }
      ]
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`LLM briefing request failed: ${response.status} ${response.statusText}\n${errorText}`);
  }

  const payload = (await response.json()) as {
    choices?: Array<{
      message?: {
        content?: string;
      };
    }>;
  };

  const content = payload.choices?.[0]?.message?.content?.trim();
  if (!content) {
    throw new Error("LLM briefing request returned no message content.");
  }

  return content;
}
