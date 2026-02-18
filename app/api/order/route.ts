import { NextRequest } from "next/server";
import { Auth0Client } from "@auth0/nextjs-auth0/server";
import puppeteer from "puppeteer";
import nodemailer from "nodemailer";

export const runtime = "nodejs";

const ORDER_EMAIL = "o.arellano.dev@gmail.com";

export async function POST(req: NextRequest) {
  const auth0 = new Auth0Client();
  const session = await auth0.getSession();
  if (!session) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { html, filename } = await req.json();

  if (!html || typeof html !== "string") {
    return new Response("Missing html", { status: 400 });
  }

  // Generate PDF
  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  let pdfBuffer: Buffer;
  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "networkidle0" });
    await page.evaluate(() => document.fonts.ready);

    const pdf = await page.pdf({
      printBackground: true,
      preferCSSPageSize: true,
      margin: { top: "0in", right: "0in", bottom: "0in", left: "0in" },
    });

    pdfBuffer = Buffer.from(pdf);
  } finally {
    await browser.close();
  }

  // Send email
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: process.env.SMTP_SECURE === "true",
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  const safeName = filename || "asset";
  const userName = session.user.name || session.user.email || "A customer";

  await transporter.sendMail({
    from: process.env.SMTP_FROM || process.env.SMTP_USER,
    to: ORDER_EMAIL,
    subject: `New Order: ${safeName}`,
    text: `New order from ${userName}.\n\nAsset: ${safeName}\n\nThe PDF is attached.`,
    attachments: [
      {
        filename: `${safeName}.pdf`,
        content: pdfBuffer,
        contentType: "application/pdf",
      },
    ],
  });

  return Response.json({ ok: true });
}
