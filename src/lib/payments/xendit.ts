const XENDIT_API = "https://api.xendit.co";
const API_KEY = process.env.XENDIT_API_KEY ?? "";

function authHeader() {
  return `Basic ${Buffer.from(`${API_KEY}:`).toString("base64")}`;
}

export type XenditInvoice = {
  id: string;
  invoice_url: string;
  status: "PENDING" | "PAID" | "SETTLED" | "EXPIRED";
  qr_string: string | null;
  expiry_date: string;
  payment_channel: string | null;
};

export type CreateInvoiceParams = {
  externalId: string;
  amount: number;
  description: string;
  successRedirectUrl?: string;
  paymentMethods?: string[];
  customer?: {
    givenNames?: string;
    email?: string;
  };
};

export async function createInvoice(
  params: CreateInvoiceParams,
): Promise<XenditInvoice> {
  const body: Record<string, unknown> = {
    external_id: params.externalId,
    amount: params.amount,
    description: params.description,
    currency: "IDR",
    capture: true,
    payment_methods: params.paymentMethods ?? ["QRIS"],
  };

  if (params.successRedirectUrl) {
    body.success_redirect_url = params.successRedirectUrl;
  }

  if (params.customer) {
    body.customer = { given_names: params.customer.givenNames, email: params.customer.email };
  }

  const res = await fetch(`${XENDIT_API}/v2/invoices`, {
    method: "POST",
    headers: {
      Authorization: authHeader(),
      "Content-Type": "application/json",
      "X-IDEMPOTENCY-KEY": params.externalId,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Xendit createInvoice failed: ${res.status} ${err}`);
  }

  return res.json();
}

export async function getInvoice(
  invoiceId: string,
): Promise<XenditInvoice> {
  const res = await fetch(`${XENDIT_API}/v2/invoices/${invoiceId}`, {
    headers: { Authorization: authHeader() },
    cache: "no-store",
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Xendit getInvoice failed: ${res.status} ${err}`);
  }

  return res.json();
}

export async function expireInvoice(
  invoiceId: string,
): Promise<XenditInvoice> {
  const res = await fetch(
    `${XENDIT_API}/invoices/${invoiceId}/expire!`,
    {
      method: "POST",
      headers: {
        Authorization: authHeader(),
        "Content-Type": "application/json",
      },
      body: "{}",
    },
  );

  if (res.ok) return res.json();

  const err = await res.text();
  console.warn("[xendit] expire failed:", res.status, err);

  // Fallback: cancel locally only
  return {
    id: invoiceId,
    invoice_url: "",
    status: "EXPIRED" as const,
    qr_string: null,
    expiry_date: new Date().toISOString(),
    payment_channel: null,
  };
}

export function verifyWebhook(
  payload: unknown,
  callbackToken: string | null,
): boolean {
  if (!callbackToken) return true;
  const token = process.env.XENDIT_WEBHOOK_TOKEN;
  if (!token) return true;
  return callbackToken === token;
}

export async function generateQrDataUrl(text: string): Promise<string> {
  const QRCode = await import("qrcode");
  return QRCode.toDataURL(text, {
    width: 300,
    margin: 2,
    color: { dark: "#1a1a2e", light: "#ffffff" },
  });
}
