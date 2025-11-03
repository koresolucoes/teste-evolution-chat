import { createClient } from '@supabase/supabase-js';
import { GoogleGenAI } from "@google/genai";
import type { VercelRequest, VercelResponse } from '@vercel/node';

// Helper to set CORS headers
const allowCors = (fn: (req: VercelRequest, res: VercelResponse) => Promise<void>) => async (req: VercelRequest, res: VercelResponse) => {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }
  await fn(req, res);
};

async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  try {
    // 1. Initialize Clients from Environment Variables
    const supabase = createClient(
      process.env['SUPABASE_URL']!,
      process.env['SUPABASE_SERVICE_ROLE_KEY']!
    );
    const ai = new GoogleGenAI({ apiKey: process.env['GEMINI_API_KEY']! });
    const evolutionApiUrl = process.env['EVOLUTION_API_URL']!;

    // 2. Get and validate webhook payload
    const body = req.body;
    const instanceName = body.instance;
    const data = body.data;

    // Only process new text messages from users (not from the bot)
    if (body.event !== 'messages.upsert' || data.key.fromMe || !data.message?.conversation) {
      res.status(200).json({ message: "Event ignored" });
      return;
    }

    // 3. Security: Verify Webhook Secret sent by Evolution API
    const webhookSecret = req.headers['apikey']; // Vercel lowercases headers
    const { data: instance, error: instanceError } = await supabase
      .from('whatsapp_instances')
      .select('apikey, webhook_secret')
      .eq('instance_name', instanceName)
      .single();

    if (instanceError || !instance || !instance.webhook_secret || instance.webhook_secret !== webhookSecret) {
      console.error('Unauthorized: Invalid instance or webhook secret.');
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    // 4. Process the message content and sender
    const userMessage = data.message.conversation;
    const userPhone = data.key.remoteJid.split('@')[0];

    // 5. Find Patient and the active AI Agent from DB
    const { data: patient } = await supabase.from('patients').select('*').like('phone', `%${userPhone}%`).single();
    const { data: agent } = await supabase.from('agents').select('*').eq('status', 'active').single();

    if (!patient) {
      console.warn(`Patient not found for phone: ${userPhone}`);
      res.status(200).json({ message: "Patient not found" });
      return;
    }

    if (!agent) {
       console.error('No active AI agent found.');
       res.status(200).json({ message: "No active agent configuration found" });
       return;
    }

    // 6. Construct Prompt and generate AI response
    const fullPrompt = `
      ${agent.system_prompt}

      ---
      CONTEXTO DEL PACIENTE:
      Nombre: ${patient.full_name}
      Notas del Historial Médico: ${patient.medical_history_notes}
      ---
      MENSAJE RECIBIDO DEL PACIENTE:
      "${userMessage}"
    `;

    const geminiResponse = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: fullPrompt });
    const replyText = geminiResponse.text;

    // 7. Send the AI-generated reply back to the user via Evolution API
    await fetch(`${evolutionApiUrl}/message/sendText/${instanceName}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'apikey': instance.apikey },
      body: JSON.stringify({
        number: data.key.remoteJid,
        options: { delay: 1200, presence: 'composing' },
        textMessage: { text: replyText },
      }),
    });
    
    res.status(200).json({ success: true, reply: replyText });
    return;

  } catch (error: any) {
    console.error('Error in webhook handler:', error.message);
    res.status(500).json({ error: error.message });
    return;
  }
}

export default allowCors(handler);