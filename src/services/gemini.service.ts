
import { Injectable } from '@angular/core';
import { GoogleGenAI, GenerateContentResponse } from '@google/genai';

@Injectable({
  providedIn: 'root',
})
export class GeminiService {
  private ai: GoogleGenAI | null = null;

  constructor() {
    // process.env is a placeholder for the build environment. The key must be set there.
    if (process.env && process.env['API_KEY']) {
      this.ai = new GoogleGenAI({ apiKey: process.env['API_KEY'] });
    }
  }

  async generateTestResponse(systemInstruction: string, userPrompt: string): Promise<string> {
    if (!this.ai) {
      console.warn('API key not found. Returning mocked response.');
      await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate network delay
      return "¡Hola! Soy el asistente virtual de la Clínica Zegna. He recibido su mensaje de prueba. Mi instrucción es: '" + systemInstruction.substring(0, 50) + "...'. Estoy listo para ayudar a los pacientes a agendar citas y responder preguntas. ¿En qué más puedo ayudarle?";
    }

    try {
        const response: GenerateContentResponse = await this.ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: userPrompt,
            config: {
                systemInstruction: systemInstruction,
            },
        });
        
        return response.text ?? 'Hubo un error al procesar la respuesta.';

    } catch (error) {
      console.error('Error generating content:', error);
      return 'Hubo un error al procesar su solicitud. Por favor, inténtelo de nuevo.';
    }
  }
}