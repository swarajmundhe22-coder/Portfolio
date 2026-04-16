const resendApiKey = process.env.RESEND_API_KEY;
const contactInboxEmail =
  process.env.CONTACT_TO_EMAIL ||
  process.env.SECURITY_BOOTSTRAP_ADMIN_EMAIL ||
  'swarajmundhe22@gmail.com';
const contactFromEmail = process.env.CONTACT_FROM_EMAIL || 'Portfolio Contact <onboarding@resend.dev>';

export const isEmailDeliveryConfigured = Boolean(resendApiKey) && Boolean(contactInboxEmail);

const escapeHtml = (value) =>
  String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');

const formatBookingText = (booking) => {
  if (!booking) {
    return 'Booking details: not provided';
  }

  return [
    'Booking details:',
    `- Summary: ${booking.summary}`,
    `- Selected date: ${booking.selectedDateIso}`,
    `- Selected time: ${booking.selectedTime}`,
    `- Timezone: ${booking.timezone}`,
  ].join('\n');
};

const formatBookingHtml = (booking) => {
  if (!booking) {
    return '<p><strong>Booking details:</strong> not provided</p>';
  }

  return [
    '<p><strong>Booking details:</strong></p>',
    '<ul>',
    `<li><strong>Summary:</strong> ${escapeHtml(booking.summary)}</li>`,
    `<li><strong>Selected date:</strong> ${escapeHtml(booking.selectedDateIso)}</li>`,
    `<li><strong>Selected time:</strong> ${escapeHtml(booking.selectedTime)}</li>`,
    `<li><strong>Timezone:</strong> ${escapeHtml(booking.timezone)}</li>`,
    '</ul>',
  ].join('');
};

export const sendContactInboxEmail = async ({
  source,
  name,
  email,
  message,
  booking,
  requestId,
  ipAddress,
}) => {
  if (!isEmailDeliveryConfigured) {
    throw new Error('EMAIL_DELIVERY_NOT_CONFIGURED');
  }

  const normalizedSource = source === 'booking' ? 'booking' : 'contact';
  const subject =
    normalizedSource === 'booking'
      ? `New booking request from ${name}`
      : `New collaboration message from ${name}`;

  const plainTextBody = [
    `Source: ${normalizedSource}`,
    `Name: ${name}`,
    `Email: ${email}`,
    `Request ID: ${requestId}`,
    `IP Address: ${ipAddress}`,
    '',
    formatBookingText(booking),
    '',
    'Message:',
    message,
  ].join('\n');

  const htmlBody = [
    '<div style="font-family:Arial,Helvetica,sans-serif;line-height:1.5;color:#0f172a;">',
    `<p><strong>Source:</strong> ${escapeHtml(normalizedSource)}</p>`,
    `<p><strong>Name:</strong> ${escapeHtml(name)}</p>`,
    `<p><strong>Email:</strong> ${escapeHtml(email)}</p>`,
    `<p><strong>Request ID:</strong> ${escapeHtml(requestId)}</p>`,
    `<p><strong>IP Address:</strong> ${escapeHtml(ipAddress)}</p>`,
    formatBookingHtml(booking),
    `<p><strong>Message:</strong></p><pre style="white-space:pre-wrap;font-family:inherit;">${escapeHtml(message)}</pre>`,
    '</div>',
  ].join('');

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${resendApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: contactFromEmail,
      to: [contactInboxEmail],
      reply_to: email,
      subject,
      text: plainTextBody,
      html: htmlBody,
    }),
  });

  if (!response.ok) {
    const responseText = await response.text();
    throw new Error(`EMAIL_DELIVERY_FAILED:${response.status}:${responseText}`);
  }

  return response.json();
};
