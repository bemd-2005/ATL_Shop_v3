/* server/services/mailer.js
   Service d'envoi d'emails via Gmail (Nodemailer)
   ================================================ */
require('dotenv').config();
const nodemailer = require('nodemailer');

// ── Transporter Gmail ─────────────────────────────────────
let transporter = null;

function getTransporter() {
  if (transporter) return transporter;

  if (!process.env.GMAIL_APP_PASSWORD ||
      process.env.GMAIL_APP_PASSWORD === 'COLLER_MOT_DE_PASSE_APP_ICI') {
    console.warn('⚠️  [Mailer] GMAIL_APP_PASSWORD non configuré — emails désactivés.');
    return null;
  }

  transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_APP_PASSWORD
    }
  });

  return transporter;
}

// ── Formatage prix ────────────────────────────────────────
function formatPrice(p) {
  return new Intl.NumberFormat('fr-FR').format(p) + ' FCFA';
}

// ── Template email nouvelle commande ─────────────────────
function buildOrderEmailHTML(order, user) {
  const lignes = order.items.map(i => `
    <tr>
      <td style="padding:10px 16px;border-bottom:1px solid #f0f0f0;font-size:14px;color:#1a1a2e;">
        ${i.nom_produit || i.name || 'Produit'}
      </td>
      <td style="padding:10px 16px;border-bottom:1px solid #f0f0f0;text-align:center;font-size:14px;color:#6b7280;">
        ${i.quantity}
      </td>
      <td style="padding:10px 16px;border-bottom:1px solid #f0f0f0;text-align:right;font-size:14px;font-weight:600;color:#1a1a2e;">
        ${formatPrice((i.price_at_time || i.price || 0) * i.quantity)}
      </td>
    </tr>`).join('');

  const date = new Date(order.created_at || new Date())
    .toLocaleString('fr-FR', { day:'numeric', month:'long', year:'numeric', hour:'2-digit', minute:'2-digit' });

  const orderNum = String(order.id).padStart(6, '0');
  const shopName = process.env.SHOP_NAME || 'ATL Shop';
  const adminUrl = `http://localhost:${process.env.PORT || 3000}/admin.html`;

  return `
<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#f4f5f9;font-family:'Segoe UI',Arial,sans-serif;">

<div style="max-width:580px;margin:32px auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,.08);">

  <!-- Header -->
  <div style="background:linear-gradient(135deg,#c92a2a,#e0692e);padding:28px 32px;text-align:center;">
    <h1 style="margin:0;color:#fff;font-size:22px;font-weight:800;letter-spacing:-.5px;">
      🛒 Nouvelle commande reçue
    </h1>
    <p style="margin:8px 0 0;color:rgba(255,255,255,.8);font-size:14px;">
      ${shopName} — Commande #${orderNum}
    </p>
  </div>

  <div style="padding:28px 32px;">

    <!-- Alerte visuelle -->
    <div style="background:#fff8f0;border:1.5px solid #f97316;border-radius:10px;padding:14px 18px;margin-bottom:24px;display:flex;align-items:center;gap:10px;">
      <span style="font-size:22px;">🔔</span>
      <div>
        <div style="font-weight:700;color:#c2410c;font-size:14px;">Action requise</div>
        <div style="color:#92400e;font-size:13px;">Un client attend votre confirmation sur WhatsApp.</div>
      </div>
    </div>

    <!-- Infos client -->
    <h2 style="font-size:15px;font-weight:700;color:#1a1a2e;margin:0 0 12px;text-transform:uppercase;letter-spacing:.5px;">
      👤 Informations client
    </h2>
    <table style="width:100%;border-collapse:collapse;margin-bottom:24px;background:#f9fafb;border-radius:10px;overflow:hidden;">
      <tr>
        <td style="padding:10px 16px;font-size:13px;color:#6b7280;width:40%;">Nom</td>
        <td style="padding:10px 16px;font-size:14px;font-weight:600;color:#1a1a2e;">${user.nom || '—'}</td>
      </tr>
      <tr style="background:#f3f4f6;">
        <td style="padding:10px 16px;font-size:13px;color:#6b7280;">Email</td>
        <td style="padding:10px 16px;font-size:14px;color:#1a1a2e;">${user.email || '—'}</td>
      </tr>
      <tr>
        <td style="padding:10px 16px;font-size:13px;color:#6b7280;">Date</td>
        <td style="padding:10px 16px;font-size:14px;color:#1a1a2e;">${date}</td>
      </tr>
    </table>

    <!-- Produits -->
    <h2 style="font-size:15px;font-weight:700;color:#1a1a2e;margin:0 0 12px;text-transform:uppercase;letter-spacing:.5px;">
      📦 Produits commandés
    </h2>
    <table style="width:100%;border-collapse:collapse;margin-bottom:24px;">
      <thead>
        <tr style="background:#f3f4f6;">
          <th style="padding:10px 16px;text-align:left;font-size:12px;color:#6b7280;text-transform:uppercase;letter-spacing:.5px;">Produit</th>
          <th style="padding:10px 16px;text-align:center;font-size:12px;color:#6b7280;text-transform:uppercase;letter-spacing:.5px;">Qté</th>
          <th style="padding:10px 16px;text-align:right;font-size:12px;color:#6b7280;text-transform:uppercase;letter-spacing:.5px;">Total</th>
        </tr>
      </thead>
      <tbody>${lignes}</tbody>
    </table>

    <!-- Total -->
    <div style="background:linear-gradient(135deg,#c92a2a,#e0692e);border-radius:10px;padding:16px 20px;display:flex;justify-content:space-between;align-items:center;margin-bottom:28px;">
      <span style="color:#fff;font-size:16px;font-weight:700;">TOTAL À PERCEVOIR</span>
      <span style="color:#fff;font-size:22px;font-weight:800;">${formatPrice(order.total)}</span>
    </div>

    <!-- CTA Admin -->
    <div style="text-align:center;margin-bottom:8px;">
      <a href="${adminUrl}" style="display:inline-block;background:#1a1a2e;color:#fff;padding:12px 28px;border-radius:99px;text-decoration:none;font-weight:700;font-size:14px;">
        🔧 Voir dans l'administration
      </a>
    </div>

  </div>

  <!-- Footer -->
  <div style="background:#f9fafb;padding:16px 32px;text-align:center;border-top:1px solid #e5e7ef;">
    <p style="margin:0;font-size:12px;color:#9ca3af;">
      Cet email a été envoyé automatiquement par <strong>${shopName}</strong>.<br>
      Ne pas répondre à cet email.
    </p>
  </div>
</div>

</body>
</html>`;
}

// ── Texte plein (fallback) ────────────────────────────────
function buildOrderEmailText(order, user) {
  const orderNum = String(order.id).padStart(6, '0');
  const date     = new Date(order.created_at || new Date()).toLocaleString('fr-FR');
  const lignes   = order.items.map(i =>
    `  • ${i.nom_produit || i.name} × ${i.quantity} → ${formatPrice((i.price_at_time || i.price || 0) * i.quantity)}`
  ).join('\n');

  return `
NOUVELLE COMMANDE #${orderNum} — ${process.env.SHOP_NAME || 'ATL Shop'}
${'='.repeat(50)}

CLIENT : ${user.nom} (${user.email})
DATE   : ${date}

PRODUITS :
${lignes}

TOTAL : ${formatPrice(order.total)}

→ Administrer : http://localhost:${process.env.PORT || 3000}/admin.html
  `.trim();
}

// ── Fonction principale ───────────────────────────────────
async function sendOrderNotification(order, user) {
  const t = getTransporter();
  if (!t) {
    console.log('📧 [Mailer] Email non envoyé (transporter non configuré).');
    return { sent: false, reason: 'non_configured' };
  }

  const orderNum = String(order.id).padStart(6, '0');
  const shopName = process.env.SHOP_NAME || 'ATL Shop';

  try {
    const info = await t.sendMail({
      from:    `"${shopName}" <${process.env.GMAIL_USER}>`,
      to:      process.env.NOTIFY_EMAIL,
      subject: `🛒 Nouvelle commande #${orderNum} — ${formatPrice(order.total)} | ${shopName}`,
      text:    buildOrderEmailText(order, user),
      html:    buildOrderEmailHTML(order, user)
    });

    console.log(`✅ [Mailer] Email envoyé → ${process.env.NOTIFY_EMAIL} (ID: ${info.messageId})`);
    return { sent: true, messageId: info.messageId };
  } catch (err) {
    console.error('❌ [Mailer] Échec envoi email :', err.message);
    // Ne pas bloquer la commande si l'email échoue
    return { sent: false, reason: err.message };
  }
}

module.exports = { sendOrderNotification };
