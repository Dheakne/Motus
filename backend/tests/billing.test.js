process.env.STRIPE_SECRET_KEY = "sk_test_fake";
process.env.STRIPE_WEBHOOK_SECRET = "whsec_test_fake";
process.env.FRONTEND_URL = "https://motus-admin.example.com";

const request = require("supertest");
const Stripe = require("stripe");
const app = require("../server");
const {
  isAllowedReturnUrl,
  mapStripeStatus,
} = require("../src/services/billingService");

describe("isAllowedReturnUrl", () => {
  it.each([
    "exp://192.168.0.10:8081/--/premium",
    "motusapp://premium",
    "http://localhost:8081/premium",
    "https://motus-admin.example.com/premium",
  ])("aceita %s", (url) => {
    expect(isAllowedReturnUrl(url)).toBe(true);
  });

  it.each([
    "https://site-malicioso.com/phishing",
    "javascript:alert(1)",
    "nao-e-url",
    "https://localhost.site-malicioso.com",
  ])("recusa %s", (url) => {
    expect(isAllowedReturnUrl(url)).toBe(false);
  });
});

describe("mapStripeStatus", () => {
  it("só active/trialing dão acesso", () => {
    expect(mapStripeStatus("active")).toBe("active");
    expect(mapStripeStatus("trialing")).toBe("active");
    expect(mapStripeStatus("past_due")).toBe("past_due");
    expect(mapStripeStatus("unpaid")).toBe("past_due");
    expect(mapStripeStatus("canceled")).toBe("canceled");
    expect(mapStripeStatus("incomplete_expired")).toBe("canceled");
    expect(mapStripeStatus("incomplete")).toBe("incomplete");
    expect(mapStripeStatus("paused")).toBe("incomplete");
  });
});

describe("POST /api/billing/checkout", () => {
  it("sem token → 401", async () => {
    const res = await request(app)
      .post("/api/billing/checkout")
      .send({ plan: "monthly" });
    expect(res.status).toBe(401);
    expect(res.body.error).toBe("MISSING_TOKEN");
  });
});

describe("POST /api/billing/cancel", () => {
  it("sem token → 401", async () => {
    const res = await request(app).post("/api/billing/cancel");
    expect(res.status).toBe(401);
  });
});

describe("GET /api/premium/status", () => {
  it("sem token → 401", async () => {
    const res = await request(app).get("/api/premium/status");
    expect(res.status).toBe(401);
  });
});

describe("GET /api/billing/return", () => {
  it("cancelado volta para o app com checkout=canceled", async () => {
    const to = encodeURIComponent("exp://192.168.0.10:8081/--/premium");
    const res = await request(app).get(
      `/api/billing/return?status=canceled&to=${to}`,
    );
    expect(res.status).toBe(200);
    expect(res.text).toContain("Pagamento cancelado");
    expect(res.text).toContain(
      "exp://192.168.0.10:8081/--/premium?checkout=canceled",
    );
  });

  it("não redireciona para destino fora da lista", async () => {
    const to = encodeURIComponent("https://site-malicioso.com");
    const res = await request(app).get(
      `/api/billing/return?status=canceled&to=${to}`,
    );
    expect(res.status).toBe(200);
    expect(res.text).not.toContain("site-malicioso");
  });
});

describe("POST /api/webhooks/stripe", () => {
  const payload = JSON.stringify({
    id: "evt_test",
    object: "event",
    type: "invoice.created",
    data: { object: { id: "in_test" } },
  });

  it("assinatura inválida → 400", async () => {
    const res = await request(app)
      .post("/api/webhooks/stripe")
      .set("Content-Type", "application/json")
      .set("stripe-signature", "t=1,v1=assinatura-falsa")
      .send(payload);
    expect(res.status).toBe(400);
    expect(res.body.error).toBe("INVALID_SIGNATURE");
  });

  it("assinatura válida → 200", async () => {
    const signature = Stripe.webhooks.generateTestHeaderString({
      payload,
      secret: process.env.STRIPE_WEBHOOK_SECRET,
    });
    const res = await request(app)
      .post("/api/webhooks/stripe")
      .set("Content-Type", "application/json")
      .set("stripe-signature", signature)
      .send(payload);
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ received: true });
  });
});
