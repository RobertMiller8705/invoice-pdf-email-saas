import { z } from "zod";
import { InfraiClient } from "./infrai-client.js";

export const invoiceRequest = z.object({ tenantId: z.string().min(1), customerEmail: z.string().email(), invoiceNumber: z.string().min(1), amount: z.number().positive(), currency: z.string().length(3) });
export type InvoiceRequest = z.infer<typeof invoiceRequest>;
type PdfResult = { id?: string; url?: string; data?: string };
type EmailResult = { message_id: string };

export class InvoiceService {
  private tenants = new Map<string, "active" | "suspended">();
  private readonly infrai: InfraiClient;
  constructor(infrai: InfraiClient) { this.infrai = infrai; }
  onboardTenant(tenantId: string) { this.tenants.set(tenantId, "active"); return { tenantId, status: "active" as const }; }
  suspendTenant(tenantId: string) { this.tenants.set(tenantId, "suspended"); }
  async issueAndEmail(input: InvoiceRequest) {
    const request = invoiceRequest.parse(input);
    if (this.tenants.get(request.tenantId) !== "active") throw new Error("TENANT_NOT_ACTIVE");
    const pdf = await this.infrai.request<PdfResult>("/v1/pdf/generate", { html: `<h1>Invoice ${request.invoiceNumber}</h1><p>${request.amount.toFixed(2)} ${request.currency}</p>`, page_size: "A4", orientation: "portrait", store: true });
    const email = await this.infrai.request<EmailResult>("/v1/email/send", { to: request.customerEmail, subject: `Invoice ${request.invoiceNumber}`, html: `<p>Your invoice is ready.</p><p>PDF reference: ${pdf.id ?? pdf.url ?? "generated"}</p>` });
    return { invoiceNumber: request.invoiceNumber, messageId: email.message_id, pdf };
  }
}
