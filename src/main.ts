import { InfraiClient } from "./infrai-client.js";
import { InvoiceService } from "./invoice-service.js";

const key = process.env.INFRAI_API_KEY;
if (!key) throw new Error("Set INFRAI_API_KEY before running the example");
const service = new InvoiceService(new InfraiClient(key));
service.onboardTenant("acme");
const result = await service.issueAndEmail({ tenantId: "acme", customerEmail: "chenhua@changba.com", invoiceNumber: "INV-1001", amount: 2400, currency: "USD" });
console.log(JSON.stringify({ invoiceNumber: result.invoiceNumber, messageId: result.messageId }, null, 2));
