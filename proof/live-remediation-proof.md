# Live Remediation Proof

`OKX Approval Firewall` has been exercised live on `X Layer` with the project Agentic Wallet:

- Wallet: `0x5b6a6bc856fba3e3ac9fe4e9368d2aa3090990c8`
- Chain: `X Layer`
- Chain ID: `196`
- Proof summary file: [`live-remediation-proof.json`](./live-remediation-proof.json)

## Verified Transaction Sequence

1. Setup unlimited approval
   - Tx: `0x23423ae4622271d62070c356305e06b803d62cb486aca426ff0aa2b399b69481`
   - Explorer: https://www.okx.com/web3/explorer/xlayer/tx/0x23423ae4622271d62070c356305e06b803d62cb486aca426ff0aa2b399b69481

2. Revoke unlimited approval
   - Tx: `0x1e02d66dd26b2a85305e91771cd261e314e80c5407c507a745d91fbcba586d33`
   - Explorer: https://www.okx.com/web3/explorer/xlayer/tx/0x1e02d66dd26b2a85305e91771cd261e314e80c5407c507a745d91fbcba586d33

3. Cleanup leg of exact remediation
   - Tx: `0x4d32af6447c64bb6fc8cda31a2779a6f3912a7450401e7ff17c9281c18968fb4`
   - Explorer: https://www.okx.com/web3/explorer/xlayer/tx/0x4d32af6447c64bb6fc8cda31a2779a6f3912a7450401e7ff17c9281c18968fb4

4. Exact regrant leg of exact remediation
   - Tx: `0x8e675c89d98ecf38ebe5525514c60d513d4cd173f569652b85919326c7d445cf`
   - Explorer: https://www.okx.com/web3/explorer/xlayer/tx/0x8e675c89d98ecf38ebe5525514c60d513d4cd173f569652b85919326c7d445cf

## Why This Matters

This proof shows the full thesis in one loop:

1. approval risk can be created during normal agent execution
2. the firewall can detect and classify that risk
3. the firewall can revoke unsafe exposure on X Layer
4. the firewall can re-grant an exact budget instead of leaving unlimited permissions behind

The local audit artifact for this run lives in an ignored runtime folder. This tracked proof file exists so judges can inspect the outcome directly from the public repository.
