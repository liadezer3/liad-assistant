import { parseIncomingWhatsAppMessage, sendWhatsAppText } from "../services/whatsappService.js";
import { handleIncomingMessage } from "../services/responseService.js";

export async function verifyWebhook(req, res) {
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  if (mode === "subscribe" && token === process.env.WHATSAPP_VERIFY_TOKEN) {
    return res.status(200).send(challenge);
  }

  return res.sendStatus(403);
}

export async function receiveWebhook(req, res) {
  try {
    const message = parseIncomingWhatsAppMessage(req.body);

    if (!message) {
      return res.status(200).json({ ok: true, foundMessage: false });
    }

    if (message.type !== "text") {
      return res.status(200).json({ ok: true, supported: false });
    }

    const from = message.from;
    const text = message.text?.body?.trim() || "";

    const result = await handleIncomingMessage(text);
    await sendWhatsAppText(from, result.replyText);

    return res.status(200).json({
      ok: true,
      from,
      text,
      result
    });
  } catch (error) {
    return res.status(500).json({
      ok: false,
      error: error.message
    });
  }
}