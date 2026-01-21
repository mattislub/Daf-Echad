import net from 'net';
import tls from 'tls';

const MAIL_CHARSET = process.env.MAIL_CHARSET || 'UTF-8';
const MAIL_HOST = process.env.MAIL_HOST || 'dafechad.com';
const MAIL_PORT = Number(process.env.MAIL_PORT) || 587;
const MAIL_USERNAME = process.env.MAIL_USERNAME || 'web';
const MAIL_PASSWORD = process.env.MAIL_PASSWORD || 'QgGT,XkQmgfih~#';
const MAIL_FROM_ADDRESS = process.env.MAIL_FROM_ADDRESS || 'info@dafechad.com';
const MAIL_FROM_NAME = process.env.MAIL_FROM_NAME || 'דף אחד - מידע';
const MAIL_BCC_ADDRESS = process.env.MAIL_BCC_ADDRESS || 'dafechadout@gmail.com';
const MAIL_BCC_NAME = process.env.MAIL_BCC_NAME || 'דף אחד - עותק';

const BRAND_COLORS = {
  primary: '#b7791f',
  muted: '#4a5568',
  background: '#f7fafc',
  card: '#ffffff',
  border: '#e2e8f0',
};

function escapeHtml(value = '') {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function formatPlaintextToHtml(value = '') {
  const trimmed = value.trim();
  if (!trimmed) return '<p style="margin:0;">&nbsp;</p>';

  return trimmed
    .split(/\r?\n\r?\n/)
    .map((paragraph) => `<p style="margin: 0 0 12px; line-height: 1.6;">${escapeHtml(paragraph).replace(/\r?\n/g, '<br />')}</p>`)
    .join('');
}

function buildStyledHtml({ subject, bodyHtml, bodyText }) {
  const content = bodyHtml || formatPlaintextToHtml(bodyText);
  const headerTitle = escapeHtml(MAIL_FROM_NAME || 'דף אחד');
  const encodedSubject = escapeHtml(subject || '');

  return `
    <div style="font-family: 'Segoe UI', Arial, sans-serif; background:${BRAND_COLORS.background}; padding:24px; color:${BRAND_COLORS.muted}; direction: rtl; text-align: center;">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:620px; margin:0 auto; background:${BRAND_COLORS.card}; border-radius:12px; box-shadow:0 6px 18px rgba(0,0,0,0.08); border:1px solid ${BRAND_COLORS.border}; overflow:hidden; direction: rtl; text-align: center;">
        <tr>
          <td style="background:${BRAND_COLORS.primary}; color:#fff; padding:18px 22px;">
            <div style="font-size:18px; font-weight:700;">${headerTitle}</div>
            ${encodedSubject ? `<div style="font-size:14px; opacity:0.9; margin-top:4px;">${encodedSubject}</div>` : ''}
          </td>
        </tr>
        <tr>
          <td style="padding:20px 22px; text-align: center;">
            ${content}
          </td>
        </tr>
        <tr>
          <td style="padding:16px 22px; background:${BRAND_COLORS.background}; font-size:12px; color:${BRAND_COLORS.muted}; text-align:center;">
            <div style="margin-bottom:6px;">${escapeHtml(MAIL_FROM_ADDRESS)}</div>
            <div style="opacity:0.8;">תודה שבחרתם בדף אחד</div>
          </td>
        </tr>
      </table>
    </div>
  `;
}

function formatAddress(address) {
  if (!address) return '';
  if (typeof address === 'string') return address;

  const name = address.name ? encodeWord(address.name, MAIL_CHARSET) : null;
  if (name) {
    return `${name} <${address.address}>`;
  }

  return address.address;
}

function encodeWord(value, charset = 'UTF-8') {
  return `=?${charset}?B?${Buffer.from(value, 'utf-8').toString('base64')}?=`;
}

function buildRecipients(to, bcc) {
  const primaryRecipients = Array.isArray(to) ? to : [to];
  const bccRecipients = Array.isArray(bcc) ? bcc : bcc ? [bcc] : [];
  const normalized = [...primaryRecipients, ...bccRecipients]
    .filter(Boolean)
    .map((recipient) => (typeof recipient === 'string' ? recipient : recipient.address))
    .filter(Boolean);

  return Array.from(new Set(normalized));
}

function buildMessage({ to, subject, text, html, bcc }) {
  const boundary = `----=_Part_${Date.now()}_${Math.random().toString(16).slice(2)}`;
  const headers = [
    `From: ${formatAddress({ address: MAIL_FROM_ADDRESS, name: MAIL_FROM_NAME })}`,
    `To: ${Array.isArray(to) ? to.map(formatAddress).join(', ') : formatAddress(to)}`,
    `Subject: ${encodeWord(subject || '', MAIL_CHARSET)}`,
    'MIME-Version: 1.0',
  ];

  const parts = [];

  if (text && html) {
    headers.push(`Content-Type: multipart/alternative; boundary="${boundary}"`);
    parts.push(`--${boundary}`);
    parts.push(`Content-Type: text/plain; charset=${MAIL_CHARSET}`);
    parts.push('Content-Transfer-Encoding: 8bit');
    parts.push('');
    parts.push(text);
    parts.push(`--${boundary}`);
    parts.push(`Content-Type: text/html; charset=${MAIL_CHARSET}`);
    parts.push('Content-Transfer-Encoding: 8bit');
    parts.push('');
    parts.push(html);
    parts.push(`--${boundary}--`);
  } else if (html) {
    headers.push(`Content-Type: text/html; charset=${MAIL_CHARSET}`);
    headers.push('Content-Transfer-Encoding: 8bit');
    parts.push(html);
  } else {
    headers.push(`Content-Type: text/plain; charset=${MAIL_CHARSET}`);
    headers.push('Content-Transfer-Encoding: 8bit');
    parts.push(text || '');
  }

  if (bcc) {
    const bccHeader = Array.isArray(bcc) ? bcc.map(formatAddress).join(', ') : formatAddress(bcc);
    if (bccHeader) {
      headers.push(`Bcc: ${bccHeader}`);
    }
  }

  return `${headers.join('\r\n')}\r\n\r\n${parts.join('\r\n')}\r\n`;
}

function readResponse(socket) {
  return new Promise((resolve, reject) => {
    let buffer = '';

    const cleanup = () => {
      socket.off('data', onData);
      socket.off('error', onError);
      socket.off('close', onClose);
    };

    const onError = (error) => {
      cleanup();
      reject(error);
    };

    const onClose = () => {
      cleanup();
      reject(new Error('SMTP connection closed unexpectedly'));
    };

    const onData = (data) => {
      buffer += data.toString('utf8');
      const lines = buffer.split(/\r?\n/).filter(Boolean);
      if (lines.length === 0) return;

      const lastLine = lines[lines.length - 1];
      const isComplete = /^\d{3} /.test(lastLine);

      if (!isComplete) return;

      cleanup();
      const code = Number.parseInt(lastLine.slice(0, 3), 10);
      resolve({ code, lines });
    };

    socket.on('data', onData);
    socket.on('error', onError);
    socket.on('close', onClose);
  });
}

async function sendCommand(socket, command, expectedCodes = []) {
  socket.write(`${command}\r\n`);
  const response = await readResponse(socket);

  if (expectedCodes.length > 0 && !expectedCodes.includes(response.code)) {
    throw new Error(`Unexpected SMTP response for command "${command}": ${response.lines.join(' ')}`);
  }

  return response;
}

async function upgradeToTls(socket, host) {
  return new Promise((resolve, reject) => {
    const secureSocket = tls.connect({ socket, servername: host }, () => resolve(secureSocket));
    secureSocket.on('error', reject);
  });
}

function ensureBcc(bcc) {
  const defaultBcc = { address: MAIL_BCC_ADDRESS, name: MAIL_BCC_NAME };
  const provided = Array.isArray(bcc) ? bcc : bcc ? [bcc] : [];
  const addresses = [...provided, defaultBcc];

  const deduped = [];
  const seen = new Set();

  addresses.forEach((entry) => {
    if (!entry) return;
    const formatted = formatAddress(entry);
    if (!formatted || seen.has(formatted)) return;
    seen.add(formatted);
    deduped.push(entry);
  });

  return deduped;
}

export async function sendEmail({ to, subject, text, html, bcc }) {
  if (!to) throw new Error('Missing email recipient');

  const styledHtml = buildStyledHtml({ subject, bodyHtml: html, bodyText: text });

  const recipients = buildRecipients(to, ensureBcc(bcc));
  const message = buildMessage({ to, subject, text, html: styledHtml, bcc: ensureBcc(bcc) });

  const socket = net.createConnection({ host: MAIL_HOST, port: MAIL_PORT });
  await new Promise((resolve, reject) => {
    socket.once('connect', resolve);
    socket.once('error', reject);
  });

  try {
    let response = await readResponse(socket);
    if (response.code !== 220) {
      throw new Error(`SMTP server rejected connection: ${response.lines.join(' ')}`);
    }

    await sendCommand(socket, `EHLO ${MAIL_HOST}`, [250]);
    await sendCommand(socket, 'STARTTLS', [220]);

    const tlsSocket = await upgradeToTls(socket, MAIL_HOST);
    response = await sendCommand(tlsSocket, `EHLO ${MAIL_HOST}`, [250]);

    const supportsAuth = response.lines.some((line) => line.includes('AUTH'));
    if (supportsAuth && MAIL_USERNAME && MAIL_PASSWORD) {
      await sendCommand(tlsSocket, 'AUTH LOGIN', [334]);
      await sendCommand(tlsSocket, Buffer.from(MAIL_USERNAME, 'utf8').toString('base64'), [334]);
      await sendCommand(tlsSocket, Buffer.from(MAIL_PASSWORD, 'utf8').toString('base64'), [235]);
    }

    await sendCommand(tlsSocket, `MAIL FROM:<${MAIL_FROM_ADDRESS}>`, [250]);

    for (const recipient of recipients) {
      await sendCommand(tlsSocket, `RCPT TO:<${recipient}>`, [250, 251]);
    }

    await sendCommand(tlsSocket, 'DATA', [354]);
    tlsSocket.write(`${message}\r\n.\r\n`);
    const dataResponse = await readResponse(tlsSocket);
    if (dataResponse.code !== 250) {
      throw new Error(`Email was not accepted by the server: ${dataResponse.lines.join(' ')}`);
    }

    await sendCommand(tlsSocket, 'QUIT', [221]);
    tlsSocket.end();
  } catch (error) {
    socket.destroy();
    throw error;
  }
}

export const mailDefaults = {
  charset: MAIL_CHARSET,
  host: MAIL_HOST,
  port: MAIL_PORT,
  username: MAIL_USERNAME,
  from: {
    address: MAIL_FROM_ADDRESS,
    name: MAIL_FROM_NAME,
  },
  bcc: {
    address: MAIL_BCC_ADDRESS,
    name: MAIL_BCC_NAME,
  },
};
