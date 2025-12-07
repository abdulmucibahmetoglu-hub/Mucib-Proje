
import { GoogleGenAI, Type } from "@google/genai";
import { RiskAnalysis, Project, Tender, TenderAnalysis } from "../types";

// Initialize Gemini AI
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// Models
const FAST_MODEL = 'gemini-2.5-flash';
const COMPLEX_MODEL = 'gemini-3-pro-preview';

/**
 * Enhances a daily report draft using Gemini Flash for speed.
 */
export const enhanceDailyReport = async (
  projectName: string,
  date: string,
  rawText: string, 
  weather: string,
  mpEmployer: string,
  mpSub: string,
  eqEmployer: string,
  eqSub: string
): Promise<string> => {
  try {
    const prompt = `
      Sen Türkiye'deki büyük bir inşaat projesinde görevli, son derece tecrübeli ve resmi dili iyi kullanan bir Şantiye Şefisin.
      Aşağıdaki ham verileri kullanarak Üst Yönetime ve İşverene sunulmak üzere "Günlük Faaliyet Raporu" oluştur.

      PROJE BİLGİLERİ:
      Proje Adı: ${projectName}
      Tarih: ${date}
      Hava Durumu: ${weather}
      
      KAYNAKLAR (SAHA MEVCUDU):
      - İşveren Personeli: ${mpEmployer}
      - Taşeron Personeli: ${mpSub}
      - İşveren Ekipman/Araç: ${eqEmployer}
      - Taşeron Ekipman/Araç: ${eqSub}

      SAHA NOTLARI (Ham Veri):
      "${rawText}"

      GÖREVİN:
      Bu notları teknik, edilgen ve resmi bir dille yeniden yaz. Şu başlıkları KESİNLİKLE kullan:

      1. YÖNETİCİ ÖZETİ
      (Günün genel ilerlemesini ve saha mevcudunu özetle. Örn: "Sahada toplam X personel ile çalışılmıştır...")

      2. YAPILAN İMALATLAR VE AKTİVİTELER
      (Notlardaki işleri teknik terimler, yer ve miktar belirterek madde madde yaz. Örn: "Beton döküldü" yerine "A Blok temelinde C35 beton dökümü tamamlanmıştır" gibi)

      3. KAYNAK KULLANIMI VE SAHA DURUMU
      (Personel dağılımı, ekipman verimliliği ve hava durumunun işe etkisini belirt)

      4. SORUNLAR, GECİKMELER VE ÇÖZÜMLER
      (Varsa aksaklıkları ve alınan önlemleri belirt. Yoksa "Planlanan akışta devam edilmiştir" yaz)

      5. İSG (İŞ SAĞLIĞI VE GÜVENLİĞİ)
      (Yapılan işlere istinaden genel İSG durumu)

      Not: Çıktı sadece rapor metni olsun, Markdown başlıkları kullanabilirsin ama giriş/çıkış konuşması yapma.
    `;

    const response = await ai.models.generateContent({
      model: FAST_MODEL,
      contents: prompt,
    });

    return response.text || "Rapor oluşturulamadı.";
  } catch (error) {
    console.error("Gemini Report Error:", error);
    return "Rapor oluşturulurken bir hata oluştu. Lütfen tekrar deneyin.";
  }
};

/**
 * Analyzes project descriptions or reports for potential safety risks using Gemini Pro.
 */
export const analyzeSafetyRisks = async (projectDescription: string): Promise<RiskAnalysis> => {
  try {
    const response = await ai.models.generateContent({
      model: COMPLEX_MODEL,
      contents: `Aşağıdaki inşaat aktivitesini veya iş emrini İş Sağlığı ve Güvenliği (İSG) riskleri açısından analiz et. Türkiye İSG mevzuatını ve 6331 sayılı kanunu göz önünde bulundur. Sonucu JSON formatında döndür.
      
      Yapılacak İş / Aktivite: "${projectDescription}"`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            riskLevel: { type: Type.STRING, enum: ['Low', 'Medium', 'High', 'Critical'] },
            concerns: { 
              type: Type.ARRAY, 
              items: { type: Type.STRING },
              description: "Belirlenen tehlikeler ve risklerin Türkçe listesi."
            },
            recommendations: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "Riskleri azaltmak için alınması gereken Türkçe önlemler (Mühendislik ve İdari Kontroller)."
            },
            ppe: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "Bu iş için zorunlu Kişisel Koruyucu Donanımlar (Örn: Baret, Yüksekte Çalışma Kemeri)."
            },
            requirements: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "Gerekli ekipman kontrolleri veya prosedürler (Örn: İskele etiketi kontrolü, Sıcak İş İzni)."
            }
          },
          required: ['riskLevel', 'concerns', 'recommendations', 'ppe', 'requirements']
        }
      }
    });

    const text = response.text;
    if (!text) throw new Error("No response from AI");
    
    return JSON.parse(text) as RiskAnalysis;
  } catch (error) {
    console.error("Gemini Safety Analysis Error:", error);
    return {
      riskLevel: 'Medium',
      concerns: ["AI analizi sırasında bir hata oluştu."],
      recommendations: ["Manuel İSG kontrolü yapınız."],
      ppe: ["Standart KKD"],
      requirements: ["Risk analizi manuel yapılmalıdır."]
    };
  }
};

/**
 * General AI Assistant chat for construction queries (Chat Overlay).
 */
export const chatWithSiteAssistant = async (message: string, history: {role: string, parts: {text: string}[]}[] = []): Promise<string> => {
  try {
    const chat = ai.chats.create({
      model: FAST_MODEL,
      history: [
        {
          role: 'user',
          parts: [{ text: "Sen SiteMaster AI'sın, yardımcı bir asistansın. Kısa cevaplar ver." }]
        },
        ...history
      ]
    });

    const result = await chat.sendMessage({ message });
    return result.text || "Bunu anlayamadım.";
  } catch (error) {
    console.error("Gemini Chat Error:", error);
    return "Sunucu bağlantısında sorun var (AI Hatası).";
  }
};

/**
 * Specialized Senior Site Manager Persona (Full Module).
 */
export const chatWithSeniorSiteManager = async (message: string, history: {role: string, parts: {text: string}[]}[] = [], projectContext?: any): Promise<string> => {
  try {
    let contextPrompt = "";
    if (projectContext) {
      contextPrompt = `
      ŞU ANKİ PROJE BAĞLAMI:
      - Proje: ${projectContext.name}
      - Durum: ${projectContext.status}
      - Bütçe: ₺${projectContext.budget} (Harcanan: ₺${projectContext.spent})
      - İlerleme: %${projectContext.progress}
      Lütfen cevaplarını bu proje verilerine dayandır.
      `;
    }

    const systemPrompt = `
      Sen "Baret Ali", 25 yıllık tecrübeye sahip, Türkiye inşaat sektörünün kurdu olmuş bir Kıdemli Şantiye Şefisin.
      
      KİŞİLİĞİN:
      - Otoriter, mevzuata hakim, babacan ama disiplinli.
      - "Evlat", "Bak şefim", "Mühendis bey/hanım", "Yönetmelik açık" gibi tabirler kullanırsın.
      - Sorunlara hem pratik saha çözümü hem de resmi/hukuki dayanak sunarsın.
      
      HAKİM OLDUĞUN MEVZUAT VE STANDARTLAR (TÜRKİYE):
      1. TS 500: Betonarme Yapıların Tasarım ve Yapım Kuralları (Beton sınıfları, donatı detayları).
      2. TBDY 2018: Türkiye Bina Deprem Yönetmeliği.
      3. 6331 Sayılı İş Sağlığı ve Güvenliği Kanunu ve Yapı İşlerinde İSG Yönetmeliği.
      4. 4734 Sayılı Kamu İhale Kanunu (Metraj, keşif, hakediş usulleri).
      5. 3194 Sayılı İmar Kanunu ve Planlı Alanlar İmar Yönetmeliği.
      6. Yapı Denetim Kanunu ve Uygulama Yönetmeliği.
      7. Çevre ve Şehircilik Bakanlığı Birim Fiyat Tarifleri ve Analizleri.

      GÖREVİN:
      Kullanıcı sana teknik, idari veya hukuki sorular soracak.
      Cevaplarında mutlaka ilgili yönetmeliğe veya standartlara atıfta bulun. (Örn: "TS 500 Madde 7.3'e göre..." veya "4734'e göre bu iş artışına girer...")
      
      ${contextPrompt}
    `;

    const chat = ai.chats.create({
      model: COMPLEX_MODEL, // Using Pro model for better reasoning
      history: [
        {
          role: 'user',
          parts: [{ text: systemPrompt }]
        },
        {
          role: 'model',
          parts: [{ text: "Anlaşıldı şefim. Ben Baret Ali. Sahadaki gözünüz, mevzuattaki rehberinizim. Hangi yönetmelik, hangi imalat kafanıza takıldı? Sorun çözelim." }]
        },
        ...history
      ]
    });

    const result = await chat.sendMessage({ message });
    return result.text || "Şu an sahada gürültü var, dediklerini duyamadım evlat.";
  } catch (error) {
    console.error("Gemini Manager Chat Error:", error);
    return "Bağlantıda sorun var. Telsiz çekmiyor.";
  }
};

/**
 * Analyzes a project's status and provides a summary + recommendations.
 */
export const analyzeProject = async (project: Project): Promise<string> => {
  try {
    // Calculate simple financial metrics for better prompting
    const spentPercentage = project.budget > 0 ? ((project.spent / project.budget) * 100).toFixed(1) : 0;
    const progressGap = Number(spentPercentage) - project.progress; // + means overspent relative to progress

    const prompt = `
      Sen uzman bir Proje Yönetim Danışmanısın. Aşağıdaki inşaat projesi verilerini analiz et ve Proje Yöneticisi için stratejik bir "Durum Özeti" (Executive Summary) hazırla.

      PROJE KÜNYESİ:
      - Proje Adı: ${project.name}
      - Mevcut Durum: ${project.status}
      - Fiziksel İlerleme: %${project.progress}
      - Finansal Durum: Toplam Bütçe ₺${project.budget.toLocaleString()} / Harcanan ₺${project.spent.toLocaleString()} (Bütçenin %${spentPercentage}'i harcandı)
      - Planlanan Bitiş: ${project.endDate}
      
      GÖREV DURUMLARI:
      ${JSON.stringify(project.tasks?.map(t => `- ${t.title}: ${t.status} (Öncelik: ${t.priority}, Bitiş: ${t.dueDate})`) || [])}

      ANALİZ GÖREVİN:
      Aşağıdaki başlıklar altında Türkçe, net ve profesyonel bir analiz yap:

      1. **Genel İlerleme ve Sağlık:** 
         - Fiziksel ilerleme (%${project.progress}) ile Harcama (%${spentPercentage}) arasındaki dengeyi yorumla. (Örn: İlerleme az ama harcama çoksa "Maliyet Aşımı Riski" uyarısı ver. Tam tersi ise "Bütçe İçi" de).
      
      2. **Takvim ve Risk Analizi:**
         - Görev listesine bak. Önceliği "Critical" veya "High" olup durumu "To Do" veya gecikmiş görünen görevler varsa bunları "ACİL" koduyla belirt.
         - Proje bitiş tarihine göre genel tempoyu değerlendir.

      3. **Finansal Öngörü:**
         - Mevcut harcama hızıyla bütçenin yetip yetmeyeceğine dair kısa bir öngörü.

      4. **Yönetici Tavsiyesi:**
         - Proje müdürüne tek cümlelik, en kritik aksiyon önerisi.

      Not: Markdown formatında, okunaklı ve maddeli çıktı ver.
    `;

    const response = await ai.models.generateContent({
      model: COMPLEX_MODEL, // Using Pro for better analytical reasoning
      contents: prompt,
    });

    return response.text || "Proje analizi yapılamadı.";
  } catch (error) {
    console.error("Gemini Project Analysis Error:", error);
    return "Şu anda AI analizi oluşturulamıyor. Lütfen internet bağlantınızı kontrol edin.";
  }
};

/**
 * Analyzes a tender to provide win probability, risks, and required documents.
 */
export const analyzeTender = async (tender: Tender): Promise<TenderAnalysis> => {
  try {
    const prompt = `
      Sen bir Kamu İhale ve İnşaat Teklif Uzmanısın. Aşağıdaki ihale bilgilerini analiz ederek bu ihaleyi kazanma stratejileri geliştir.

      İHALE DETAYLARI:
      Adı: ${tender.name}
      Kurum: ${tender.authority}
      Kayıt No (İKN): ${tender.registrationNumber}
      Tahmini Bedel: ${tender.estimatedBudget} TL
      Teminat: ${tender.bondAmount} TL
      Açıklama: ${tender.description}
      Tarih: ${tender.date}

      İSTENEN ÇIKTI (JSON):
      1. winProbability: İhale açıklamasının karmaşıklığı, yaklaşık maliyet ve kurum tipine göre tahmini bir kazanma/rekabet şansı puanı (0-100 arası sayı).
      2. risks: Bu tip ihalelerde karşılaşılabilecek potansiyel risklerin listesi (Örn: "Aşırı düşük teklif sorgulaması", "Malzeme temin süresi" vb.).
      3. requiredDocuments: Kamu İhale Kanunu'na göre bu tip bir iş için muhtemelen istenecek belgeler (Örn: "İş Bitirme Belgesi", "Geçici Teminat Mektubu", "Ticaret Sicil Gazetesi").
      4. strategy: İhaleyi kazanmak için kısa bir stratejik tavsiye cümlesi.

      Lütfen çıktıyı geçerli bir JSON olarak ver.
    `;

    const response = await ai.models.generateContent({
      model: COMPLEX_MODEL,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            winProbability: { type: Type.INTEGER, description: "0-100 arası kazanma şansı" },
            risks: { 
              type: Type.ARRAY, 
              items: { type: Type.STRING },
              description: "Potansiyel riskler listesi"
            },
            requiredDocuments: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "Gereken belgeler listesi"
            },
            strategy: { type: Type.STRING, description: "Kısa strateji tavsiyesi" }
          },
          required: ['winProbability', 'risks', 'requiredDocuments', 'strategy']
        }
      }
    });

    const text = response.text;
    if (!text) throw new Error("No response from AI");
    
    return JSON.parse(text) as TenderAnalysis;
  } catch (error) {
    console.error("Gemini Tender Analysis Error:", error);
    return {
      winProbability: 50,
      risks: ["Analiz sırasında hata oluştu. Lütfen manuel kontrol yapın."],
      requiredDocuments: ["İdari Şartnameyi inceleyiniz."],
      strategy: "Detaylı inceleme önerilir."
    };
  }
};
