import assert from "node:assert/strict";
import { InvoiceService } from "./invoice-service.js";

const calls: Array<{ path: string; body: Record<string, unknown> }> = [];
const fake = { request: async <T>(path: string, body: Record<string, unknown>) => { calls.push({ path, body }); return (path.includes("pdf") ? { id: "pdf-1" } : { message_id: "msg-1" }) as T; } };
const service = new InvoiceService(fake as never);
service.onboardTenant("tenant-a");
const result = await service.issueAndEmail({ tenantId: "tenant-a", customerEmail: "ops@example.com", invoiceNumber: "INV-7", amount: 125, currency: "USD" });
assert.equal(result.messageId, "msg-1");
assert.deepEqual(calls.map(call => call.path), ["/v1/pdf/generate", "/v1/email/send"]);
await assert.rejects(() => service.issueAndEmail({ tenantId: "missing", customerEmail: "ops@example.com", invoiceNumber: "INV-8", amount: 1, currency: "USD" }), /TENANT_NOT_ACTIVE/);
console.log("invoice decision test passed");
