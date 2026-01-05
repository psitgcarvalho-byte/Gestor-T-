
import { GoogleGenAI, Type } from "@google/genai";

// Factory function to ensure fresh instances with the correct API_KEY
const getAI = () => new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * Extracts structured test results from attached documents (images/PDFs).
 */
export const extractScoresFromDocuments = async (attachments: { data: string, mimeType: string }[]) => {
  try {
    const ai = getAI();
    
    const prompt = `Analise os documentos neuropsicológicos anexados (protocolos de testes, tabelas de escores ou laudos).
      Extraia todos os resultados de testes que encontrar e retorne APENAS um objeto JSON seguindo este esquema:
      {
        "results": [
          {
            "testName": "Nome do Teste",
            "rawScore": 0,
            "standardScore": 0,
            "percentile": 0,
            "observations": "Breve nota sobre o desempenho extraída do texto"
          }
        ]
      }
      
      Se um valor não estiver claro, use 0 para números. Tente mapear o nome do teste da forma mais precisa possível.`;

    const parts: any[] = [{ text: prompt }];
    attachments.forEach(att => {
      parts.push({
        inlineData: {
          data: att.data,
          mimeType: att.mimeType
        }
      });
    });

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: { parts },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            results: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  testName: { type: Type.STRING },
                  rawScore: { type: Type.NUMBER },
                  standardScore: { type: Type.NUMBER },
                  percentile: { type: Type.NUMBER },
                  observations: { type: Type.STRING }
                }
              }
            }
          }
        }
      }
    });

    return JSON.parse(response.text);
  } catch (error) {
    console.error("Extraction error:", error);
    throw error;
  }
};

/**
 * Generates a clinical report draft using Gemini 3 Flash for speed.
 */
export const generateReportDraft = async (anamnesis: string, testResults: string) => {
  try {
    const ai = getAI();
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Você é um assistente de neuropsicologia clínica especializado em redação técnica.
      Gere um rascunho de laudo profissional baseado nos seguintes dados:
      
      Anamnese: ${anamnesis}
      Resultados de Testes: ${testResults}
      
      Estruture com rigor técnico: Identificação, Motivo, Metodologia, Resultados (Quantitativos/Qualitativos), Análise Cognitiva e Recomendações.`,
      config: {
        temperature: 0.4,
      }
    });
    return response.text;
  } catch (error) {
    console.error("Error generating report draft:", error);
    throw error;
  }
};

/**
 * Deep diagnostic analysis using Gemini 3 Pro with Search Grounding and Multi-modal support.
 */
export const analyzeDiagnosticHypothesis = async (
  anamnesis: string, 
  results: string, 
  lang: string, 
  useSearch: boolean = false,
  attachments: { data: string, mimeType: string }[] = []
) => {
  try {
    const ai = getAI();
    const config: any = {
      thinkingConfig: { thinkingBudget: 32768 },
    };

    if (useSearch) {
      config.tools = [{ googleSearch: {} }];
    }

    const textPrompt = `Realize uma síntese diagnóstica neuropsicológica de ALTA COMPLEXIDADE e RIGOR CLÍNICO.
      
      DADOS DO PACIENTE:
      - Histórico e Queixas: ${anamnesis}
      - Resultados dos Instrumentos (Quantitativos): ${results}
      
      SUA MISSÃO:
      Aja como um Senior Neuropsychologist. Analise também os arquivos anexados (se houver), que podem conter protocolos de testes, desenhos (como Figura de Rey ou Bender) ou exames de imagem.
      
      Siga este roteiro estruturado para a resposta:

      1. ANÁLISE QUANTITATIVA E QUALITATIVA: Relacione os escores e a análise visual dos anexos com as queixas funcionais.
      2. FUNDAMENTAÇÃO DSM-5-TR / CID-11: Liste quais critérios específicos foram preenchidos para a(s) hipótese(s) principal(is).
      3. DIAGNÓSTICO DIFERENCIAL: Justifique a exclusão de pelo menos 2 condições alternativas.
      4. CONCLUSÃO E PROGNÓSTICO.
      
      Idioma: ${lang === 'pt-BR' ? 'Português' : 'English'}.`;

    const parts: any[] = [{ text: textPrompt }];
    
    // Add attachments to the request parts
    attachments.forEach(att => {
      parts.push({
        inlineData: {
          data: att.data,
          mimeType: att.mimeType
        }
      });
    });

    const response = await ai.models.generateContent({
      model: "gemini-3-pro-preview",
      contents: { parts },
      config: config
    });

    return {
      text: response.text,
      sources: response.candidates?.[0]?.groundingMetadata?.groundingChunks || []
    };
  } catch (error) {
    console.error("Analysis error:", error);
    throw error;
  }
};

/**
 * Professional clinical chatbot using Gemini 3 Pro.
 */
export const chatWithAssistant = async (message: string, history: any[]) => {
  try {
    const ai = getAI();
    const response = await ai.models.generateContent({
      model: "gemini-3-pro-preview",
      contents: [...history, { role: 'user', parts: [{ text: message }] }],
      config: {
        thinkingConfig: { thinkingBudget: 16000 },
        systemInstruction: "Você é o Gestor T, um assistente especializado em neuropsicologia clínica. Forneça respostas baseadas em evidências, auxilie na interpretação de testes e sugira bibliografias."
      }
    });
    return response.text;
  } catch (error) {
    console.error("Chat error:", error);
    throw error;
  }
};

export const performClinicalResearch = async (query: string) => {
  try {
    const ai = getAI();
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Pesquise as últimas tendências e atualizações científicas sobre: ${query}`,
      config: {
        tools: [{ googleSearch: {} }]
      }
    });
    return {
      text: response.text,
      sources: response.candidates?.[0]?.groundingMetadata?.groundingChunks || []
    };
  } catch (error) {
    console.error("Research error:", error);
    throw error;
  }
};

export const summarizeFeedback = async (feedbacks: any[]) => {
  try {
    const ai = getAI();
    const feedbackText = feedbacks.map(f => f.processComment).join('\n');
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Resuma os pontos críticos e elogios destes feedbacks clínicos:\n${feedbackText}`,
    });
    return response.text;
  } catch (error) {
    console.error("Feedback error:", error);
    throw error;
  }
};
