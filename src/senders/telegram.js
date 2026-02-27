import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

const TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const CHAT_ID = process.env.TELEGRAM_CHAT_ID;

const telegram = axios.create({
  baseURL: `https://api.telegram.org/bot${TOKEN}`,
  timeout: 10000,
});

export async function sendTelegramMessage(text) {
  await telegram.post("/sendMessage", {
    chat_id: CHAT_ID,
    text,
  });
}