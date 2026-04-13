# OKX Approval Firewall Demo Report

Policy preset: `strict`

## Executive Summary

- Risk grade: `attention`
- Headline: An unlimited approval should be reduced to an exact allowance.
- Next action: Run live remediation through Agentic Wallet to revoke the oversized approval and re-grant the configured exact budget.

## Why This Artifact Exists

This tracked file is a public, judge-facing example of the kind of markdown report that `OKX Approval Firewall` produces during a live approval review cycle.

The project's strongest proof still comes from the live remediation transactions and the local runtime audit artifact. This file exists so the public repo contains a polished, human-readable artifact alongside the raw tx proof.

## Demo Findings

- Wallet: `0x5b6a6bc856fba3e3ac9fe4e9368d2aa3090990c8`
- Chain: `X Layer`
- Approval state under review: unlimited ERC-20 approval to an execution spender
- Local policy posture: `strict`
- Intended remediation: revoke unlimited approval and re-grant an exact budget

## Recommended Actions

- **replace_with_exact_approval** for the flagged spender because unlimited allowance violates the strict preset
- keep trusted spenders only when they are capped by a local budget
- record the resulting tx hashes and audit artifact for operator review

## Linked Proof

- [live-remediation-proof.md](./live-remediation-proof.md)
- [live-remediation-proof.json](./live-remediation-proof.json)
