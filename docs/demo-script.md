# Demo Script

Target length: `1-3 minutes`

## Goal

Show that `OKX Approval Firewall` is not just a CLI, but a practical permission-control layer for X Layer agents.

## Suggested Flow

### 1. Open on the repo overview

Say:

> Most agent tooling helps agents execute. This project helps them stay safe after execution by managing approval exposure on X Layer.

### 2. Show the natural-language assistant mode

Run:

```bash
npm run dev -- assist --input "Check my wallet health on X Layer"
```

Say:

> The operator or agent can start in natural language. The tool interprets the request, selects the safest matching workflow, and stays in dry-run mode unless live apply is explicitly enabled.

### 3. Show the policy-driven plan

Run:

```bash
npm run dev -- plan --address 0x5b6a6bc856fba3e3ac9fe4e9368d2aa3090990c8 --policy strict --config okx-approval-firewall.policy.example.json
```

Say:

> This is where the firewall becomes more than a revoke button. It applies local spender trust and budget rules and decides whether to keep, review, revoke, or replace with an exact approval.

### 4. Show the report artifact

Open:

- `proof/demo-report.md`
- `proof/live-remediation-proof.md`

Say:

> The project produces judge-friendly and operator-friendly artifacts, not just terminal output.

### 5. Show live proof

Highlight the four live tx hashes in:

- `README.md`
- `proof/live-remediation-proof.json`

Say:

> The remediation loop has already been proven live on X Layer with the project Agentic Wallet.

### 6. Close on the thesis

Say:

> Autonomous systems need a permission firewall, not just swap execution. That is the layer this project adds to the X Layer agent ecosystem.

## Recording Tips

- Keep the terminal zoomed in.
- Keep the README and proof files open in a split view.
- Spend more time on the live proof and exact-budget remediation than on setup.
- End with the repository structure and CI/test story if there is time.
