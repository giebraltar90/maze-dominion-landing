import nodemailer from "nodemailer";

const RECAPTCHA_SECRET = process.env.RECAPTCHA_SECRET;
const EMAIL_USER = process.env.EMAIL_USER;
const EMAIL_PASS = process.env.EMAIL_PASS;
const EMAIL_TO = process.env.EMAIL_TO || "giebelhaus.daniel@gmail.com";

async function verifyRecaptcha(token) {
  const res = await fetch("https://www.google.com/recaptcha/api/siteverify", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: `secret=${RECAPTCHA_SECRET}&response=${token}`,
  });
  const data = await res.json();
  return data.success && data.score >= 0.5;
}

function sendEmail({ subject, html }) {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: { user: EMAIL_USER, pass: EMAIL_PASS },
  });

  return transporter.sendMail({
    from: `"Maze Dominion Website" <${EMAIL_USER}>`,
    to: EMAIL_TO,
    subject,
    html,
  });
}

export default async function handler(req, res) {
  // CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { formType, recaptchaToken, ...data } = req.body;

  // Honeypot check — if this field has a value, it's a bot
  if (data.website) {
    return res.status(200).json({ success: true }); // silent reject
  }

  // Verify reCAPTCHA
  if (!recaptchaToken) {
    return res.status(400).json({ error: "Missing reCAPTCHA token" });
  }

  const isHuman = await verifyRecaptcha(recaptchaToken);
  if (!isHuman) {
    return res.status(403).json({ error: "reCAPTCHA verification failed" });
  }

  // Build email based on form type
  let subject, html;

  switch (formType) {
    case "support":
      subject = `[Maze Dominion] New Supporter: ${data.tierName} Tier (${data.tierPrice})`;
      html = `
        <h2>New Support Tier Interest</h2>
        <p><strong>Tier:</strong> ${data.tierName} (${data.tierPrice})</p>
        <p><strong>Name:</strong> ${data.name || "Not provided"}</p>
        <p><strong>Email:</strong> ${data.email}</p>
        <p><strong>Message:</strong> ${data.message || "None"}</p>
        <hr/>
        <p style="color:#888;">Submitted from Maze Dominion website</p>
      `;
      break;

    case "wishlist":
      subject = `[Maze Dominion] New Wishlist Signup`;
      html = `
        <h2>New Wishlist Signup</h2>
        <p><strong>Email:</strong> ${data.email}</p>
        <hr/>
        <p style="color:#888;">Submitted from Maze Dominion website</p>
      `;
      break;

    case "team":
      subject = `[Maze Dominion] Team Application: ${data.role}`;
      html = `
        <h2>New Team Application</h2>
        <p><strong>Name:</strong> ${data.name}</p>
        <p><strong>Email:</strong> ${data.email}</p>
        <p><strong>Role:</strong> ${data.role}</p>
        <p><strong>Message:</strong> ${data.message || "None"}</p>
        <hr/>
        <p style="color:#888;">Submitted from Maze Dominion website</p>
      `;
      break;

    default:
      return res.status(400).json({ error: "Invalid form type" });
  }

  try {
    await sendEmail({ subject, html });
    return res.status(200).json({ success: true });
  } catch (err) {
    console.error("Email send error:", err);
    return res.status(500).json({ error: "Failed to send email" });
  }
}
