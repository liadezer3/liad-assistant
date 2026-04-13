import express from "express";
import dotenv from "dotenv";
dotenv.config({ path: './src/config/.env' });

import webhookRoutes from "./routes/webhookRoutes.js";
import { ensureDB } from "./storage/db.js";
import { startReminderWorker } from "./services/reminderService.js";
import { sendTelegramMessage } from "./services/telegramService.js";
import "./services/whatsappService.js";

const app = express();
app.use(express.json());

ensureDB();

app.use("/", webhookRoutes);

startReminderWorker(async (text) => {
  console.log("⏰ Reminder worker:", text);
  await sendTelegramMessage(text);
});

const PORT = process.env.PORT || 3000;

const server = app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`❌ פורט ${PORT} תפוס. מחכה 2 שניות ומנסה שוב...`);
    setTimeout(() => {
      server.close();
      server.listen(PORT);
    }, 2000);
  } else {
    throw err;
  }
});