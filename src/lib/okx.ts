import { execFile } from "node:child_process";
import { promisify } from "node:util";

import { encodeFunctionData } from "viem";

import type { ApprovalRecord, ExecuteResult, ScanResult } from "../types.js";

const execFileAsync = promisify(execFile);

const ERC20_APPROVE_ABI = [
  {
    type: "function",
    name: "approve",
    stateMutability: "nonpayable",
    inputs: [
      { name: "spender", type: "address" },
      { name: "amount", type: "uint256" }
    ],
    outputs: [{ name: "", type: "bool" }]
  }
] as const;

function unwrapData<T>(value: unknown): T {
  if (typeof value === "object" && value !== null && "data" in value) {
    return (value as { data: T }).data;
  }
  return value as T;
}

async function runJsonCommand(args: string[]): Promise<unknown> {
  const { stdout, stderr } = await execFileAsync("onchainos", args, {
    encoding: "utf8",
    maxBuffer: 1024 * 1024 * 4
  });

  const trimmed = stdout.trim();
  if (!trimmed) {
    throw new Error(`Command returned no JSON output: onchainos ${args.join(" ")}\n${stderr}`);
  }

  try {
    return JSON.parse(trimmed);
  } catch (error) {
    throw new Error(
      `Failed to parse JSON from onchainos ${args.join(" ")}\nSTDOUT:\n${stdout}\nSTDERR:\n${stderr}\n${String(error)}`
    );
  }
}

export async function resolveDefaultAddress(): Promise<string> {
  const payload = unwrapData<{ evmAddress?: string }>(
    await runJsonCommand(["wallet", "balance"])
  );

  if (!payload.evmAddress) {
    throw new Error("Could not resolve a default EVM address from the active Agentic Wallet session.");
  }

  return payload.evmAddress;
}

export async function fetchApprovals(params: {
  address: string;
  chain?: string;
}): Promise<ApprovalRecord[]> {
  const args = ["security", "approvals", "--address", params.address];
  if (params.chain) {
    args.push("--chain", params.chain);
  }

  const payload = unwrapData<{
    approvalList?: unknown[];
    dataList?: unknown[];
  } | Array<{
    approvalList?: unknown[];
    dataList?: unknown[];
  }>>(await runJsonCommand(args));

  const pages = Array.isArray(payload) ? payload : [payload];
  const approvalList = pages.flatMap((page) => {
    if (Array.isArray(page.approvalList)) {
      return page.approvalList;
    }
    if (Array.isArray(page.dataList)) {
      return page.dataList;
    }
    return [];
  });

  return approvalList.map((item) => {
    const record = item as Record<string, unknown>;
    const vulnerabilityFlag = record.vulnerabilityFlag;
    const riskLevel =
      typeof record.riskLevel === "string"
        ? record.riskLevel
        : vulnerabilityFlag === true
          ? "high"
          : "low";
    const spenderAddress =
      typeof record.spenderAddress === "string" && record.spenderAddress
        ? record.spenderAddress
        : String(record.approvalAddress ?? "");
    const tokenSymbol =
      typeof record.tokenSymbol === "string" && record.tokenSymbol
        ? record.tokenSymbol
        : String(record.symbol ?? "");
    const allowance =
      typeof record.allowance === "string" && record.allowance
        ? record.allowance
        : typeof record.remainAmtPrecise === "string" && record.remainAmtPrecise
          ? record.remainAmtPrecise
          : String(record.remainAmount ?? "");

    return {
      tokenSymbol,
      tokenAddress: String(record.tokenAddress ?? ""),
      chainIndex: String(record.chainIndex ?? ""),
      spenderAddress,
      allowance,
      riskLevel,
      protocolLabel:
        typeof record.protocolLabel === "string" && record.protocolLabel
          ? record.protocolLabel
          : typeof record.protocolName === "string" && record.protocolName
            ? record.protocolName
            : undefined,
      raw: item
    };
  });
}

export function buildRevokeCalldata(spenderAddress: string): `0x${string}` {
  return encodeFunctionData({
    abi: ERC20_APPROVE_ABI,
    functionName: "approve",
    args: [spenderAddress as `0x${string}`, 0n]
  });
}

export async function scanTransaction(params: {
  chain: string;
  from: string;
  to: string;
  data: string;
}): Promise<ScanResult> {
  return unwrapData<ScanResult>(
    await runJsonCommand([
      "security",
      "tx-scan",
      "--chain",
      params.chain,
      "--from",
      params.from,
      "--to",
      params.to,
      "--data",
      params.data
    ])
  );
}

export async function revokeApproval(params: {
  chain: string;
  tokenAddress: string;
  from?: string;
  data: string;
}): Promise<{ txHash?: string }> {
  const args = [
    "wallet",
    "contract-call",
    "--to",
    params.tokenAddress,
    "--chain",
    params.chain,
    "--input-data",
    params.data
  ];

  if (params.from) {
    args.push("--from", params.from);
  }

  return unwrapData<{ txHash?: string }>(await runJsonCommand(args));
}

export async function executeRevokeFlow(params: {
  approvals: ApprovalRecord[];
  chain: string;
  from: string;
  apply: boolean;
}): Promise<ExecuteResult[]> {
  const results: ExecuteResult[] = [];

  for (const approval of params.approvals) {
    const calldata = buildRevokeCalldata(approval.spenderAddress);
    const scan = await scanTransaction({
      chain: params.chain,
      from: params.from,
      to: approval.tokenAddress,
      data: calldata
    });

    const command = [
      "onchainos",
      "wallet",
      "contract-call",
      "--to",
      approval.tokenAddress,
      "--chain",
      params.chain,
      "--input-data",
      calldata
    ];

    if (params.from) {
      command.push("--from", params.from);
    }

    const result: ExecuteResult = {
      approval,
      scan,
      command
    };

    if (params.apply && scan.action !== "block") {
      const execution = await revokeApproval({
        chain: params.chain,
        tokenAddress: approval.tokenAddress,
        from: params.from,
        data: calldata
      });
      result.txHash = execution.txHash;
    }

    results.push(result);
  }

  return results;
}
