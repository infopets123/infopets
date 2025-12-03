import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const checkApiKey = () => {
  return !!process.env.API_KEY;
};

export const sendMessageToAssistant = async (
  message: string, 
  imageBase64?: string,
  history: { role: 'user' | 'model', text: string }[] = []
): Promise<string> => {
  if (!process.env.API_KEY) throw new Error("API Key não configurada");

  const modelId = "gemini-2.5-flash"; 

  try {
    const parts: any[] = [];
    
    if (imageBase64) {
      parts.push({
        inlineData: {
          mimeType: "image/jpeg",
          data: imageBase64
        }
      });
    }
    
    parts.push({ text: message });

    const response = await ai.models.generateContent({
      model: modelId,
      contents: {
        parts: parts
      },
      config: {
        systemInstruction: "Você é um assistente veterinário virtual amigável e útil do app 'InfoPets'. Dê dicas sobre saúde, alimentação e cuidados. Se for uma emergência médica grave, sempre recomende procurar um veterinário presencial.",
      }
    });

    return response.text || "Desculpe, não consegui processar sua solicitação.";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Ocorreu um erro ao conectar com a IA. Tente novamente mais tarde.";
  }
};

export const verifyReceipt = async (imageBase64: string): Promise<{ approved: boolean; details: string }> => {
  if (!process.env.API_KEY) throw new Error("API Key não configurada");

  const today = new Date();
  const dateString = today.toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' });

  const prompt = `
    Analise esta imagem de comprovante de pagamento (Pix).
    A data de hoje é: ${dateString}.

    Verifique estritamente os seguintes dados:
    1. Nome do destinatário ou envolvido deve conter: "MARCO ANTONIO VIEIRA SANTANA" (pode ser parcial se for muito similar).
    2. Valor deve ser exatamente "10,99" ou "119,99" (ou 10.99 / 119.99).
    3. Data do comprovante deve ser IGUAL a data de hoje (${dateString}). Aceite formatos como DD/MM/AAAA, DD/MM/AA ou por extenso.
    4. Deve conter menção ao Pix ou chave: "fitstartmpe@gmail.com".

    Responda em JSON com este formato:
    {
      "encontrouNome": boolean,
      "encontrouValor": boolean,
      "encontrouData": boolean,
      "encontrouPix": boolean,
      "aprovado": boolean,
      "razao": string
    }
    
    "aprovado" só deve ser true se TODOS os itens forem true. Se a data não for ${dateString}, aprove = false.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: {
        parts: [
          { inlineData: { mimeType: "image/jpeg", data: imageBase64 } },
          { text: prompt }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            encontrouNome: { type: Type.BOOLEAN },
            encontrouValor: { type: Type.BOOLEAN },
            encontrouData: { type: Type.BOOLEAN },
            encontrouPix: { type: Type.BOOLEAN },
            aprovado: { type: Type.BOOLEAN },
            razao: { type: Type.STRING }
          }
        }
      }
    });
    
    let jsonStr = response.text || "{}";
    jsonStr = jsonStr.replace(/```json/g, '').replace(/```/g, '').trim();

    const result = JSON.parse(jsonStr);
    return {
      approved: result.aprovado,
      details: result.razao || (result.aprovado ? "Comprovante validado com sucesso!" : "Dados divergentes. Verifique se a data é de hoje.")
    };

  } catch (error) {
    console.error("Receipt Verification Error:", error);
    throw new Error("Falha na verificação inteligente do comprovante.");
  }
};

export interface FoodAnalysisResult {
  grams: number;
  cups: string; 
  caloriesPerKg: number;
  proteinPct: number;
  proteinGrams: number; 
  fiberPct: number;
  qualityNote: string;
  foodType: string;
}

export const analyzePetFood = async (weight: number, foodName: string): Promise<FoodAnalysisResult> => {
  if (!process.env.API_KEY) throw new Error("API Key não configurada");

  const prompt = `
    Atue como um nutricionista veterinário especialista.
    Eu tenho um pet pesando ${weight}kg.
    Ele se alimenta da ração: "${foodName}".

    Sua tarefa é calcular a porção diária.
    
    1. Identifique se é cão ou gato pelo nome da ração (se não óbvio, assuma cão).
    2. Calcule a quantidade em gramas/dia (NEM).
    3. Converta para "Xícaras" (200ml).
    4. Estime proteína (%) e fibra (%).

    Responda APENAS em JSON:
    {
      "grams": number,
      "cups": string,
      "caloriesPerKg": number,
      "proteinPct": number,
      "fiberPct": number,
      "qualityNote": string (max 15 palavras),
      "foodType": string (ex: "Super Premium")
    }
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            grams: { type: Type.NUMBER },
            cups: { type: Type.STRING },
            caloriesPerKg: { type: Type.NUMBER },
            proteinPct: { type: Type.NUMBER },
            fiberPct: { type: Type.NUMBER },
            qualityNote: { type: Type.STRING },
            foodType: { type: Type.STRING }
          }
        }
      }
    });
    
    let jsonStr = response.text || "{}";
    jsonStr = jsonStr.replace(/```json/g, '').replace(/```/g, '').trim();

    const data = JSON.parse(jsonStr);
    
    const proteinGrams = Math.round(data.grams * (data.proteinPct / 100));

    return { ...data, proteinGrams } as FoodAnalysisResult;
  } catch (error) {
    console.error("Food Analysis Error:", error);
    const grams = Math.round(weight * 25);
    return {
      grams: grams,
      cups: `Aprox. ${(grams / 100).toFixed(1)} xícaras`,
      caloriesPerKg: 3500,
      proteinPct: 22,
      proteinGrams: Math.round(grams * 0.22),
      fiberPct: 4,
      qualityNote: "Cálculo genérico. Consulte a embalagem.",
      foodType: "Estimativa Padrão"
    };
  }
};