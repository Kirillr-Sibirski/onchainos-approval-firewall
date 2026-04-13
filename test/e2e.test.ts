import assert from "node:assert/strict";
import { execFile, spawn } from "node:child_process";
import { chmod, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { createServer } from "node:http";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);
const REPO_ROOT = "/Users/kirillrybkov/Desktop/x-layer";
const DEFAULT_ADDRESS = "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa";
const DEFAULT_TOKEN = "0x1000000000000000000000000000000000000001";
const DEFAULT_SPENDER = "0x2000000000000000000000000000000000000002";
const MAX_UINT256 = ((1n << 256n) - 1n).toString();

async function createFakeOnchainos(params?: {
  address?: string;
  approvals?: Array<Record<string, unknown>>;
}): Promise<{ dir: string; statePath: string }> {
  const dir = await mkdtemp(path.join(os.tmpdir(), "onchainos-approval-firewall-e2e-"));
  const statePath = path.join(dir, "state.json");
  const scriptPath = path.join(dir, "onchainos");
  const address = params?.address ?? DEFAULT_ADDRESS;
  const approvals = params?.approvals ?? [];

  await writeFile(
    statePath,
    JSON.stringify(
      {
        approvals,
        txCount: 0
      },
      null,
      2
    ),
    "utf8"
  );

  await writeFile(
    scriptPath,
    `#!/usr/bin/env node
const { readFileSync, writeFileSync } = require("node:fs");

const args = process.argv.slice(2);
const statePath = process.env.FAKE_ONCHAINOS_STATE;
const defaultAddress = process.env.FAKE_ONCHAINOS_ADDRESS;

function loadState() {
  return JSON.parse(readFileSync(statePath, "utf8"));
}

function saveState(state) {
  writeFileSync(statePath, JSON.stringify(state, null, 2));
}

function findArg(name) {
  const index = args.indexOf(name);
  return index >= 0 ? args[index + 1] : undefined;
}

function decodeAmount(data) {
  const normalized = String(data || "").replace(/^0x/, "");
  if (normalized.length < 8 + 64 + 64) {
    return 0n;
  }
  const amountHex = normalized.slice(8 + 64, 8 + 128);
  return BigInt("0x" + amountHex);
}

function decodeSpender(data) {
  const normalized = String(data || "").replace(/^0x/, "");
  if (normalized.length < 8 + 64) {
    return "0x0000000000000000000000000000000000000000";
  }
  return "0x" + normalized.slice(8 + 24, 8 + 64);
}

if (args[0] === "wallet" && args[1] === "balance") {
  console.log(JSON.stringify({ evmAddress: defaultAddress }));
  process.exit(0);
}

if (args[0] === "security" && args[1] === "approvals") {
  const state = loadState();
  console.log(JSON.stringify({ approvalList: state.approvals }));
  process.exit(0);
}

if (args[0] === "security" && args[1] === "tx-scan") {
  console.log(JSON.stringify({ action: process.env.FAKE_SCAN_ACTION || "safe" }));
  process.exit(0);
}

if (args[0] === "wallet" && args[1] === "contract-call") {
  const state = loadState();
  const tokenAddress = findArg("--to");
  const inputData = findArg("--input-data");
  const amount = decodeAmount(inputData);
  const spenderAddress = decodeSpender(inputData);
  state.txCount += 1;
  const txHash = "0x" + state.txCount.toString(16).padStart(64, "0");

  if (amount === 0n) {
    state.approvals = [];
  } else {
    state.approvals = [
      {
        tokenSymbol: "USDC",
        tokenAddress: tokenAddress,
        chainIndex: "196",
        spenderAddress,
        allowance: amount.toString(),
        remainAmount: amount.toString(),
        remainAmtPrecise: amount.toString(),
        riskLevel: "low",
        vulnerabilityFlag: false
      }
    ];
  }

  saveState(state);
  console.log(JSON.stringify({ txHash }));
  process.exit(0);
}

console.error("Unexpected onchainos call:", args.join(" "));
process.exit(1);
`,
    "utf8"
  );
  await chmod(scriptPath, 0o755);

  return { dir, statePath };
}

async function createPolicyConfig(dir: string): Promise<string> {
  const configPath = path.join(dir, "onchainos-approval-firewall.policy.json");
  await writeFile(
    configPath,
    JSON.stringify(
      {
        defaults: {
          chain: "xlayer",
          policy: "strict"
        },
        spenders: {
          [DEFAULT_SPENDER]: {
            trust: "trusted",
            exactAllowance: "50000",
            label: "demo router",
            notes: ["Keep the router funded but bounded."]
          }
        }
      },
      null,
      2
    ),
    "utf8"
  );
  return configPath;
}

function makeEnv(fake: { dir: string; statePath: string }, extra: NodeJS.ProcessEnv = {}): NodeJS.ProcessEnv {
  return {
    ...process.env,
    ...extra,
    PATH: `${fake.dir}:${process.env.PATH ?? ""}`,
    FAKE_ONCHAINOS_STATE: fake.statePath,
    FAKE_ONCHAINOS_ADDRESS: DEFAULT_ADDRESS
  };
}

function makeUnlimitedApproval(): Record<string, unknown> {
  return {
    tokenSymbol: "USDC",
    tokenAddress: DEFAULT_TOKEN,
    chainIndex: "196",
    spenderAddress: DEFAULT_SPENDER,
    allowance: MAX_UINT256,
    remainAmount: MAX_UINT256,
    remainAmtPrecise: MAX_UINT256,
    riskLevel: "high"
  };
}

async function runCli(args: string[], env: NodeJS.ProcessEnv): Promise<{ stdout: string; stderr: string }> {
  return execFileAsync("node", ["--import", "tsx", "src/cli.ts", ...args], {
    cwd: REPO_ROOT,
    env,
    encoding: "utf8"
  });
}

async function startFakeLlmServer(responseText: string): Promise<{
  baseUrl: string;
  close: () => Promise<void>;
}> {
  const server = createServer(async (request, response) => {
    if (request.method !== "POST" || request.url !== "/chat/completions") {
      response.writeHead(404).end();
      return;
    }

    response.writeHead(200, { "content-type": "application/json; charset=utf-8" });
    response.end(
      JSON.stringify({
        choices: [
          {
            message: {
              content: responseText
            }
          }
        ]
      })
    );
  });

  await new Promise<void>((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", () => resolve());
  });

  const address = server.address();
  if (!address || typeof address === "string") {
    throw new Error("Could not resolve fake LLM server port.");
  }

  return {
    baseUrl: `http://127.0.0.1:${address.port}`,
    close: async () =>
      new Promise<void>((resolve, reject) => {
        server.close((error) => (error ? reject(error) : resolve()));
      })
  };
}

async function findFreePort(): Promise<number> {
  const server = createServer();
  await new Promise<void>((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", () => resolve());
  });
  const address = server.address();
  if (!address || typeof address === "string") {
    throw new Error("Could not allocate a free port.");
  }
  const { port } = address;
  await new Promise<void>((resolve, reject) => server.close((error) => (error ? reject(error) : resolve())));
  return port;
}

async function waitForDashboard(port: number): Promise<void> {
  const deadline = Date.now() + 5000;

  while (Date.now() < deadline) {
    try {
      const response = await fetch(`http://127.0.0.1:${port}/api/health`);
      if (response.ok) {
        return;
      }
    } catch {}

    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  throw new Error("Dashboard did not become ready in time.");
}

test("status, inspect, plan, and report run end-to-end through the CLI", async () => {
  const fake = await createFakeOnchainos({
    approvals: [makeUnlimitedApproval()]
  });
  const configPath = await createPolicyConfig(fake.dir);

  try {
    const env = makeEnv(fake);
    const status = await runCli(["status", "--chain", "xlayer", "--config", configPath], env);
    const inspect = await runCli(["inspect", "--chain", "xlayer", "--config", configPath], env);
    const plan = await runCli(["plan", "--chain", "xlayer", "--config", configPath], env);
    const reportPath = path.join(fake.dir, "report.md");
    const report = await runCli(["report", "--chain", "xlayer", "--config", configPath, "--output", reportPath], env);
    const reportFile = await readFile(reportPath, "utf8");

    assert.match(status.stdout, /onchainos-approval-firewall status/);
    assert.match(status.stdout, /Risk grade: attention/);
    assert.match(inspect.stdout, /Unlimited approvals: 1/);
    assert.match(plan.stdout, /REPLACE_WITH_EXACT_APPROVAL/);
    assert.match(report.stdout, /# onchainos-approval-firewall report/);
    assert.match(reportFile, /Replacement allowance: `50000`/);
  } finally {
    await rm(fake.dir, { recursive: true, force: true });
  }
});

test("doctor and assist exercise the guided review workflow", async () => {
  const fake = await createFakeOnchainos({
    approvals: [makeUnlimitedApproval()]
  });
  const configPath = await createPolicyConfig(fake.dir);

  try {
    const env = makeEnv(fake);
    const doctor = await runCli(["doctor", "--chain", "xlayer", "--config", configPath], env);
    const assist = await runCli(
      [
        "assist",
        "--input",
        "check my wallet health on x layer and tell me the safest next step",
        "--chain",
        "xlayer",
        "--config",
        configPath
      ],
      env
    );

    assert.match(doctor.stdout, /onchainos-approval-firewall doctor/);
    assert.match(doctor.stdout, /Immediate next step:/);
    assert.match(doctor.stdout, /execute --policy strict/);
    assert.match(assist.stdout, /onchainos-approval-firewall assist/);
    assert.match(assist.stdout, /Interpreted intent: doctor/);
    assert.match(assist.stdout, /Recommended command: npm run dev -- doctor/);
    assert.match(assist.stdout, /onchainos-approval-firewall doctor/);
  } finally {
    await rm(fake.dir, { recursive: true, force: true });
  }
});

test("brief returns model-backed output through a fake OpenAI-compatible endpoint", async () => {
  const fake = await createFakeOnchainos({
    approvals: [makeUnlimitedApproval()]
  });
  const configPath = await createPolicyConfig(fake.dir);
  const llm = await startFakeLlmServer(
    [
      "## Operator Summary",
      "Replace the unlimited approval with the configured exact budget.",
      "",
      "## Recommended Next Step",
      "Run execute --apply."
    ].join("\n")
  );

  try {
    const env = makeEnv(fake);
    const brief = await runCli(
      [
        "brief",
        "--chain",
        "xlayer",
        "--config",
        configPath,
        "--api-key",
        "test-key",
        "--base-url",
        llm.baseUrl
      ],
      env
    );

    assert.match(brief.stdout, /## Operator Summary/);
    assert.match(brief.stdout, /configured exact budget/);
  } finally {
    await llm.close();
    await rm(fake.dir, { recursive: true, force: true });
  }
});

test("dashboard serves health, review, assist, and execute flows", async () => {
  const fake = await createFakeOnchainos({
    approvals: [makeUnlimitedApproval()]
  });
  const configPath = await createPolicyConfig(fake.dir);
  const artifactDir = path.join(fake.dir, "artifacts");
  const port = await findFreePort();
  const dashboard = spawn(
    "node",
    ["--import", "tsx", "src/cli.ts", "dashboard", "--host", "127.0.0.1", "--port", String(port)],
    {
      cwd: REPO_ROOT,
      env: makeEnv(fake),
      stdio: ["ignore", "pipe", "pipe"]
    }
  );

  let stderr = "";
  dashboard.stderr.on("data", (chunk) => {
    stderr += chunk.toString("utf8");
  });

  try {
    await waitForDashboard(port);

    const health = await fetch(`http://127.0.0.1:${port}/api/health`).then((response) => response.json());
    const review = await fetch(
      `http://127.0.0.1:${port}/api/review?chain=xlayer&config=${encodeURIComponent(configPath)}`
    ).then((response) => response.json());
    const assist = await fetch(`http://127.0.0.1:${port}/api/assist`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        input: "check my wallet health on x layer",
        chain: "xlayer",
        config: configPath
      })
    }).then((response) => response.json());
    const execute = await fetch(`http://127.0.0.1:${port}/api/execute`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        chain: "xlayer",
        config: configPath,
        artifactDir,
        apply: true,
        confirm: true
      })
    }).then((response) => response.json());

    assert.equal(health.ok, true);
    assert.equal(health.defaultChain, "xlayer");

    assert.equal(review.policy, "strict");
    assert.match(review.formattedReview, /onchainos-approval-firewall review/);
    assert.equal(review.preflight.length, 1);

    assert.equal(assist.interpretation.intent, "doctor");
    assert.match(assist.review.formattedReview, /onchainos-approval-firewall review/);

    assert.equal(execute.apply, true);
    assert.equal(execute.results.length, 1);
    assert.match(execute.results[0].txHash, /^0x[0-9a-f]{64}$/);
    assert.match(execute.results[0].replacementTxHash, /^0x[0-9a-f]{64}$/);
    assert.equal(execute.verification.afterSummary.unlimitedApprovals, 0);

    const auditLog = await readFile(path.join(artifactDir, "audit-log.jsonl"), "utf8");
    assert.match(auditLog, /replacementTxHash/);
  } finally {
    dashboard.kill("SIGTERM");
    await new Promise((resolve) => dashboard.once("exit", resolve));
    assert.equal(stderr.trim(), "");
    await rm(fake.dir, { recursive: true, force: true });
  }
});
