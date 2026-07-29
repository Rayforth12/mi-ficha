// Se conecta a Gmail por IMAP usando una contraseña de aplicación (no OAuth).
//
// Por qué así y no con el login de Google: un proyecto de Google Cloud sin
// verificar (que es lo normal para un proyecto personal) hace que el acceso
// expire cada 7 días — la sincronización se rompería cada semana sin avisar.
// Las contraseñas de aplicación de Gmail no tienen ese límite, se pueden
// revocar en cualquier momento desde la cuenta de Google, y no piden crear
// ni verificar ningún proyecto en Google Cloud.
import { ImapFlow } from "imapflow";
import { simpleParser } from "mailparser";
import { BANK_PARSERS, findParserForSender } from "./emailParsers";

export async function fetchBankTransactions({ emailAddress, appPassword, sinceDate }) {
  const client = new ImapFlow({
    host: "imap.gmail.com",
    port: 993,
    secure: true,
    auth: { user: emailAddress, pass: appPassword },
    logger: false,
  });

  const found = [];

  await client.connect();
  try {
    const lock = await client.getMailboxLock("INBOX");
    try {
      // Filtramos por remitente DIRECTAMENTE en el servidor de Gmail, no después
      // de traer los correos. Sin esto, revisaríamos la bandeja entera (podían
      // ser miles de correos) en vez de solo los pocos del banco — eso era lo
      // que causaba el timeout.
      const senderFilters = BANK_PARSERS.map((p) => ({ from: p.from }));
      const searchCriteria =
        senderFilters.length > 1
          ? { since: sinceDate, or: senderFilters }
          : { since: sinceDate, ...senderFilters[0] };

      const uids = await client.search(searchCriteria, { uid: true });

      for (const uid of uids || []) {
        let message;
        try {
          message = await client.fetchOne(uid, { source: true }, { uid: true });
        } catch (e) {
          continue; // un correo puntual que falle no debe tumbar toda la sincronización
        }
        if (!message?.source) continue;

        const parsedMail = await simpleParser(message.source);
        const fromAddress = parsedMail.from?.value?.[0]?.address || "";
        const parserEntry = findParserForSender(fromAddress);
        if (!parserEntry) continue;

        const html = parsedMail.html || (parsedMail.text ? `<pre>${parsedMail.text}</pre>` : "");
        if (!html) continue;

        const emailId = (parsedMail.messageId || String(uid)).replace(/[<>]/g, "");
        const transactions = parserEntry.parse(html, emailId);

        for (const tx of transactions) {
          if (tx.approved === false) continue;
          found.push({ ...tx, bank: parserEntry.bank });
        }
      }
    } finally {
      lock.release();
    }
  } finally {
    await client.logout().catch(() => client.close());
  }

  return found;
}