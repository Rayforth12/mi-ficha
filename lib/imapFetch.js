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
import { findParserForSender } from "./emailParsers";

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
      const uids = await client.search({ since: sinceDate }, { uid: true });

      for (const uid of uids || []) {
        const message = await client.fetchOne(uid, { source: true }, { uid: true });
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
