import OpenAI from "openai";
import { ChatMessage, ChatContext } from "@shared/types";

// the newest OpenAI model is "gpt-5" which was released August 7, 2025. do not change this unless explicitly requested by the user
const OPENAI_MODEL = "gpt-5";

export class AIService {
  private openai: OpenAI | null = null;
  private sessions: Map<string, ChatMessage[]> = new Map();

  constructor() {
    this.initializeOpenAI();
  }

  private initializeOpenAI() {
    if (process.env.OPENAI_API_KEY) {
      this.openai = new OpenAI({ 
        apiKey: process.env.OPENAI_API_KEY 
      });
      console.log("OpenAI initialized successfully");
    } else {
      console.warn("OPENAI_API_KEY not found - AI features will be limited");
    }
  }

  // Hent eller opprett chat-sesjon
  getSession(sessionId: string): ChatMessage[] {
    if (!this.sessions.has(sessionId)) {
      this.sessions.set(sessionId, []);
    }
    return this.sessions.get(sessionId)!;
  }

  // Send melding til AI
  async sendMessage(
    sessionId: string, 
    message: string, 
    context?: ChatContext
  ): Promise<string> {
    try {
      if (!this.openai) {
        return this.getFallbackResponse(message, context);
      }

      const session = this.getSession(sessionId);
      
      // Bygg system-prompt med kontekst
      let systemPrompt = `Du er en hjelpsom AI-assistent i MadEasy Browser. 
Du hjelper brukere med å navigere nettet, analysere sider, automatisere oppgaver og svare på spørsmål.
Svar alltid på norsk med mindre brukeren ber om noe annet.
Vær kortfattet men grundig.`;

      if (context) {
        systemPrompt += `\n\nKontekst fra nettleseren:`;
        if (context.url) systemPrompt += `\nURL: ${context.url}`;
        if (context.pageTitle) systemPrompt += `\nSidetittel: ${context.pageTitle}`;
        if (context.selectedText) systemPrompt += `\nValgt tekst: ${context.selectedText}`;
        if (context.pageContent) systemPrompt += `\nSideinnhold: ${context.pageContent.substring(0, 3000)}...`;
      }

      // Legg til brukermelding i sesjonen
      session.push({
        id: Date.now().toString(),
        role: "user",
        content: message,
        timestamp: new Date(),
        context
      });

      // Forbered meldinger for OpenAI
      const messages = [
        { role: "system" as const, content: systemPrompt },
        ...session.slice(-10).map(msg => ({
          role: msg.role as "user" | "assistant",
          content: msg.content
        }))
      ];

      // Send til OpenAI
      const response = await this.openai.chat.completions.create({
        model: OPENAI_MODEL,
        messages,
        temperature: 0.7,
        max_tokens: 1000,
      });

      const aiResponse = response.choices[0].message.content || "Beklager, jeg fikk ikke generert et svar.";

      // Lagre AI-svar i sesjonen
      session.push({
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: aiResponse,
        timestamp: new Date()
      });

      return aiResponse;

    } catch (error) {
      console.error("OpenAI API error:", error);
      return this.getFallbackResponse(message, context);
    }
  }

  // Fallback-respons når OpenAI ikke er tilgjengelig
  private getFallbackResponse(message: string, context?: ChatContext): string {
    const lowerMessage = message.toLowerCase();

    if (lowerMessage.includes("hva kan du")) {
      return `Jeg kan hjelpe deg med:
• Navigere og analysere nettsider
• Automatisere oppgaver og workflows
• Ekstrahere data fra sider
• Svare på spørsmål om innholdet
• Generere rapporter og sammendrag

For full funksjonalitet, sett opp en OpenAI API-nøkkel.`;
    }

    if (lowerMessage.includes("analyser") && context?.url) {
      return `Jeg analyserer siden: ${context.pageTitle || context.url}
For full analyse med AI, vennligst sett opp en OpenAI API-nøkkel.`;
    }

    if (lowerMessage.includes("kontakt") || lowerMessage.includes("finn")) {
      return "Jeg kan hjelpe deg med å finne informasjon på siden. For avansert dataekstraksjon, sett opp en OpenAI API-nøkkel.";
    }

    if (lowerMessage.includes("automatiser") || lowerMessage.includes("workflow")) {
      return "Jeg kan hjelpe deg med å lage automatiserte workflows. Bruk Workflow Builder for å komme i gang.";
    }

    return `Jeg forstår at du sier: "${message}". 
For full AI-funksjonalitet, vennligst sett opp en OpenAI API-nøkkel i innstillingene.`;
  }

  // Tale-til-tekst (Speech-to-Text)
  async speechToText(audioBuffer: Buffer): Promise<string> {
    try {
      if (!this.openai) {
        return "Tale-til-tekst krever OpenAI API-nøkkel";
      }

      // OpenAI Whisper API
      const formData = new FormData();
      const audioBlob = new Blob([audioBuffer], { type: "audio/webm" });
      formData.append("file", audioBlob, "audio.webm");
      formData.append("model", "whisper-1");
      formData.append("language", "no"); // Norsk

      const response = await this.openai.audio.transcriptions.create({
        file: audioBlob as any,
        model: "whisper-1",
        language: "no"
      });

      return response.text;

    } catch (error) {
      console.error("Speech-to-text error:", error);
      return "Kunne ikke konvertere tale til tekst";
    }
  }

  // Tekst-til-tale (Text-to-Speech)
  async textToSpeech(text: string): Promise<Buffer | null> {
    try {
      if (!this.openai) {
        return null;
      }

      const response = await this.openai.audio.speech.create({
        model: "tts-1",
        voice: "nova", // eller "alloy", "echo", "fable", "onyx", "shimmer"
        input: text,
      });

      const buffer = Buffer.from(await response.arrayBuffer());
      return buffer;

    } catch (error) {
      console.error("Text-to-speech error:", error);
      return null;
    }
  }

  // Analyser sideinnhold med AI
  async analyzePage(content: string, url: string): Promise<{
    summary: string;
    keyPoints: string[];
    contacts: any[];
    actionableItems: string[];
  }> {
    try {
      if (!this.openai) {
        return {
          summary: "Sideanalyse krever OpenAI API-nøkkel",
          keyPoints: [],
          contacts: [],
          actionableItems: []
        };
      }

      const prompt = `Analyser følgende nettside og gi:
1. Et kort sammendrag (maks 3 setninger)
2. 3-5 hovedpunkter
3. Eventuelle kontaktdetaljer (navn, e-post, telefon, adresse)
4. 2-3 handlingsforslag basert på innholdet

URL: ${url}
Innhold: ${content.substring(0, 5000)}`;

      const response = await this.openai.chat.completions.create({
        model: OPENAI_MODEL,
        messages: [
          { 
            role: "system", 
            content: "Du er en ekspert på webanalyse. Svar i JSON-format med feltene: summary, keyPoints (array), contacts (array med objekter), actionableItems (array). Svar på norsk."
          },
          { role: "user", content: prompt }
        ],
        response_format: { type: "json_object" },
        temperature: 0.3,
      });

      const result = JSON.parse(response.choices[0].message.content || "{}");
      
      return {
        summary: result.summary || "Ingen analyse tilgjengelig",
        keyPoints: result.keyPoints || [],
        contacts: result.contacts || [],
        actionableItems: result.actionableItems || []
      };

    } catch (error) {
      console.error("Page analysis error:", error);
      return {
        summary: "Kunne ikke analysere siden",
        keyPoints: [],
        contacts: [],
        actionableItems: []
      };
    }
  }

  // Generer workflow-forslag basert på brukerintensjon
  async suggestWorkflow(intention: string, context?: ChatContext): Promise<{
    name: string;
    description: string;
    steps: Array<{
      action: string;
      target: string;
      value?: string;
    }>;
  }> {
    try {
      if (!this.openai) {
        return {
          name: "Foreslått Workflow",
          description: intention,
          steps: [
            { action: "navigate", target: context?.url || "https://example.com" },
            { action: "wait", target: "2000" },
            { action: "extract", target: "data" }
          ]
        };
      }

      const prompt = `Lag en workflow basert på: "${intention}"
${context ? `Kontekst: ${context.url || ''} - ${context.pageTitle || ''}` : ''}
Returner JSON med: name, description, steps (array med action, target, value)`;

      const response = await this.openai.chat.completions.create({
        model: OPENAI_MODEL,
        messages: [
          { 
            role: "system", 
            content: "Du er en ekspert på web-automatisering. Lag praktiske workflows."
          },
          { role: "user", content: prompt }
        ],
        response_format: { type: "json_object" },
        temperature: 0.5,
      });

      return JSON.parse(response.choices[0].message.content || "{}");

    } catch (error) {
      console.error("Workflow suggestion error:", error);
      return {
        name: "Workflow-forslag",
        description: intention,
        steps: []
      };
    }
  }

  // Tøm chat-sesjon
  clearSession(sessionId: string) {
    this.sessions.delete(sessionId);
  }

  // Hent alle sesjoner
  getAllSessions(): Array<{ id: string; name: string; messageCount: number }> {
    return Array.from(this.sessions.entries()).map(([id, messages]) => ({
      id,
      name: `Sesjon ${id}`,
      messageCount: messages.length
    }));
  }
}

// Singleton-instans
export const aiService = new AIService();