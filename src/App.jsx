import { useState, useRef, useEffect } from "react";
import VoiceChatScreen from "./VoiceChatScreen";

const PRIMARY_RED = "#A6192E";
const WHITE = "#FFFFFF";
const LIGHT_GREY = "#F5F5F5";
const TEXT_DARK = "#1A1A1A";
const TEXT_MID = "#5C5C5C";
const BORDER_COLOR = "#E0E0E0";
const CORNER_SM = 4;
const CORNER_MD = 8;

const MAP_LOCATIONS = [
  { id: 1, name: "Gerbang Utama", x: 50, y: 18, info: "Dibangun pada abad ke-15, gerbang utama ini merupakan pintu masuk resmi menuju kawasan istana kerajaan. Konstruksinya menggunakan batu andesit lokal dengan ornamen ukiran yang mencerminkan kejayaan Kerajaan Majapahit. Gerbang ini pernah menjadi saksi bisu berbagai upacara kenegaraan dan penyambutan tamu-tamu agung dari seluruh Nusantara.", year: "c. 1400-an", width: 88 },
  { id: 2, name: "Balai Persidangan", x: 32, y: 38, info: "Balai megah ini dahulu berfungsi sebagai pusat pengambilan keputusan kerajaan. Para pembesar dan patih berkumpul di sini untuk merundingkan kebijakan kenegaraan. Atap joglo-nya yang khas dibuat dari kayu jati pilihan yang hingga kini masih berdiri kokoh, mencerminkan keahlian para empu dan pengrajin tradisional masa lampau.", year: "c. 1380-an", width: 100 },
  { id: 3, name: "Sumur Tua Keramat", x: 65, y: 52, info: "Sumur berdiameter 1,2 meter ini diyakini telah ada sejak abad ke-13. Air dari sumur ini dipercaya memiliki khasiat penyembuhan dan digunakan dalam berbagai ritual keagamaan. Menurut naskah kuno Pararaton, sumur ini menjadi sumber air utama bagi istana selama lebih dari tiga abad berturut-turut.", year: "c. 1250-an", width: 92 },
  { id: 4, name: "Candi Petirtaan", x: 20, y: 65, info: "Petirtaan atau kolam pemandian suci ini dibangun sebagai tempat penyucian diri bagi keluarga kerajaan. Arsitekturnya memadukan gaya Hindu-Jawa dengan ornamen relief yang menggambarkan kisah-kisah dari epik Mahabharata. Kualitas pahatan reliefnya menjadi bukti tingginya peradaban seni rupa pada era Majapahit.", year: "c. 1350-an", width: 92 },
  { id: 5, name: "Menara Pengawas", x: 72, y: 30, info: "Berdiri setinggi 18 meter, menara ini dulunya digunakan sebagai pos pengawasan keamanan wilayah kerajaan. Dari puncak menara, penjaga dapat memantau radius hingga puluhan kilometer. Struktur bata merahnya yang unik menggunakan teknik pemasangan tanpa perekat, melainkan mengandalkan gravitasi dan presisi perhitungan sang arsitek.", year: "c. 1420-an", width: 90 },
];

const INITIAL_MESSAGES = [
  { id: 1, role: "ai", text: "Selamat datang di Asisten Sejarah AI. Saya siap membantu Anda menjelajahi warisan budaya dan sejarah kawasan ini. Apa yang ingin Anda ketahui?" },
];

const SUGGESTED_QUESTIONS = [
  "Ceritakan tentang Kerajaan Majapahit",
  "Apa fungsi Balai Persidangan?",
  "Bagaimana arsitektur candi Jawa kuno?",
];

export default function App() {
  const [activeScreen, setActiveScreen] = useState("map");
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [messages, setMessages] = useState(INITIAL_MESSAGES);
  const [inputText, setInputText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  const handleSend = async () => {
    const text = inputText.trim();
    if (!text || isLoading) return;
    const userMsg = { id: Date.now(), role: "user", text };
    setMessages((prev) => [...prev, userMsg]);
    setInputText("");
    setIsLoading(true);
    try {
      // INI DIPAKAI KALAU MAU CEK DI LOKAL
      // const response = await fetch("http://localhost:3001/api/chat", {
      //   method: "POST",
      //   headers: { "Content-Type": "application/json" },
      //   body: JSON.stringify({
      //     model: "claude-sonnet-4-6",
      //     max_tokens: 1000,
      //     system: "Anda adalah Asisten Sejarah AI untuk aplikasi 'AI Heritage Guide', sebuah panduan wisata heritage interaktif. Spesialisasi Anda adalah sejarah Indonesia, terutama era Kerajaan Majapahit, arsitektur candi Jawa, dan warisan budaya Nusantara. Berikan jawaban yang informatif, akurat, dan edukatif dalam Bahasa Indonesia. Gunakan bahasa yang formal namun mudah dipahami. Setiap jawaban maksimal 3 paragraf singkat.",
      //     messages: [{ role: "user", content: text }],
      //   }),
      // });
      // const data = await response.json();
      // const aiText = data.content?.map((c) => c.text || "").join("") || "Maaf, saya tidak dapat memproses permintaan ini saat ini.";

      // INI DIPAKAI SEMISAL BACKENDNYA BEDA WEB
      // const response = await fetch("ai-heritage-backend-production.up.railway.app", {
      //   method: "POST",
      //   headers: { "Content-Type": "application/json" },
      //   body: JSON.stringify({ message: text, history: [] }),
      // });

      // INI DIPAKAI KALAU HOSTING DI TEMPAT YG SM
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text, history: history.slice(-6) }),
      });
      
      const data = await response.json();
      const aiText = data.text || "Maaf, tidak dapat memproses saat ini.";
      setMessages((prev) => [...prev, { id: Date.now() + 1, role: "ai", text: aiText }]);
    } catch {
      setMessages((prev) => [...prev, { id: Date.now() + 1, role: "ai", text: "Koneksi bermasalah. Silakan coba lagi." }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSuggest = (q) => {
    setInputText(q);
  };

  return (
    <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "100vh", background: "#1C1C1E", fontFamily: "'Inter', 'Roboto', -apple-system, sans-serif" }}>
      <div style={{ width: 390, height: 844, background: WHITE, borderRadius: 44, overflow: "hidden", display: "flex", flexDirection: "column", boxShadow: "0 32px 80px rgba(0,0,0,0.55)", position: "relative" }}>
        {/* Status Bar */}
        <div style={{ height: 44, background: activeScreen === "map" ? PRIMARY_RED : WHITE, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 28px", flexShrink: 0 }}>
          <span style={{ fontSize: 15, fontWeight: 600, color: activeScreen === "map" ? WHITE : TEXT_DARK }}>9:41</span>
          <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
            <svg width="17" height="12" viewBox="0 0 17 12" fill={activeScreen === "map" ? WHITE : TEXT_DARK}><rect x="0" y="3" width="3" height="9" rx="1"/><rect x="4.5" y="2" width="3" height="10" rx="1"/><rect x="9" y="0.5" width="3" height="11.5" rx="1"/><rect x="13.5" y="0" width="3" height="12" rx="1" opacity="0.3"/></svg>
            <svg width="16" height="12" viewBox="0 0 16 12" fill="none"><path d="M8 2.5C9.8 2.5 11.4 3.2 12.6 4.3L14 2.9C12.4 1.4 10.3 0.5 8 0.5C5.7 0.5 3.6 1.4 2 2.9L3.4 4.3C4.6 3.2 6.2 2.5 8 2.5Z" fill={activeScreen === "map" ? WHITE : TEXT_DARK}/><path d="M8 5.5C9.1 5.5 10.1 5.9 10.8 6.6L12.2 5.2C11.1 4.2 9.6 3.5 8 3.5C6.4 3.5 4.9 4.2 3.8 5.2L5.2 6.6C5.9 5.9 6.9 5.5 8 5.5Z" fill={activeScreen === "map" ? WHITE : TEXT_DARK}/><circle cx="8" cy="9.5" r="1.5" fill={activeScreen === "map" ? WHITE : TEXT_DARK}/></svg>
            <svg width="25" height="12" viewBox="0 0 25 12" fill="none"><rect x="0.5" y="0.5" width="21" height="11" rx="3.5" stroke={activeScreen === "map" ? WHITE : TEXT_DARK} strokeOpacity="0.35"/><rect x="2" y="2" width="16" height="8" rx="2" fill={activeScreen === "map" ? WHITE : TEXT_DARK}/><path d="M23 4.5V7.5C23.8 7.2 24.4 6.4 24.4 5.5S23.8 3.8 23 4.5Z" fill={activeScreen === "map" ? WHITE : TEXT_DARK} fillOpacity="0.4"/></svg>
          </div>
        </div>

        {/* Screen Content */}
        <div style={{ flex: 1, overflow: "hidden", display: "flex", flexDirection: "column" }}>
          {activeScreen === "map" ? (
            <MapScreen locations={MAP_LOCATIONS} onPinTap={setSelectedLocation} />
          ) : (
            // <VoiceChatScreen />
            <ChatScreen messages={messages} inputText={inputText} setInputText={setInputText} onSend={handleSend} isLoading={isLoading} messagesEndRef={messagesEndRef} suggestions={SUGGESTED_QUESTIONS} onSuggest={handleSuggest} />
          )}
        </div>

        {/* Bottom Navigation */}
        <BottomNav activeScreen={activeScreen} onNavigate={setActiveScreen} />

        {/* Detail Modal */}
        {selectedLocation && (
          <DetailModal location={selectedLocation} onClose={() => setSelectedLocation(null)} />
        )}
      </div>
    </div>
  );
}

function MapScreen({ locations, onPinTap }) {
  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
      {/* Map Header */}
      <div style={{ background: PRIMARY_RED, padding: "0 20px 16px", flexShrink: 0 }}>
        <h1 style={{ color: WHITE, fontSize: 20, fontWeight: 700, letterSpacing: 0.3, margin: 0 }}>AI Heritage Guide</h1>
        <p style={{ color: "rgba(255,255,255,0.75)", fontSize: 13, margin: "4px 0 0", letterSpacing: 0.2 }}>Situs Bersejarah · Jawa Timur</p>
      </div>

      {/* Map Container */}
      <div style={{ flex: 1, position: "relative", overflow: "hidden", background: LIGHT_GREY }}>
        {/* Map Background — Stylized 2D Village Layout */}
        <MapBackground />
        {/* Pins */}
        {locations.map((loc) => (
          <MapPin key={loc.id} location={loc} onTap={() => onPinTap(loc)} />
        ))}
        {/* Map Legend */}
        <div style={{ position: "absolute", bottom: 16, left: 16, background: "rgba(255,255,255,0.92)", borderRadius: CORNER_MD, padding: "8px 12px", backdropFilter: "blur(8px)", border: `0.5px solid ${BORDER_COLOR}` }}>
          <p style={{ fontSize: 11, color: TEXT_MID, margin: 0, letterSpacing: 0.3 }}>PETA KAWASAN HERITAGE</p>
          <p style={{ fontSize: 12, fontWeight: 600, color: TEXT_DARK, margin: "2px 0 0" }}>5 Situs · Abad XII–XV</p>
        </div>
        {/* Compass */}
        <div style={{ position: "absolute", top: 16, right: 16, background: "rgba(255,255,255,0.92)", borderRadius: "50%", width: 40, height: 40, display: "flex", alignItems: "center", justifyContent: "center", border: `0.5px solid ${BORDER_COLOR}` }}>
          <svg width="20" height="20" viewBox="0 0 20 20"><polygon points="10,2 12,9 10,8 8,9" fill={PRIMARY_RED}/><polygon points="10,18 12,11 10,12 8,11" fill="#BDBDBD"/><circle cx="10" cy="10" r="1.5" fill={TEXT_DARK}/></svg>
        </div>
      </div>
    </div>
  );
}

function MapBackground() {
  return (
    <svg width="100%" height="100%" viewBox="0 0 390 600" style={{ position: "absolute", top: 0, left: 0 }} preserveAspectRatio="xMidYMid slice">
      {/* Ground */}
      <rect width="390" height="600" fill="#EAE6DC"/>
      {/* Pathways */}
      <path d="M195,0 L195,600" stroke="#D4CFC4" strokeWidth="10" fill="none" strokeDasharray="none"/>
      <path d="M0,220 L390,220" stroke="#D4CFC4" strokeWidth="8" fill="none"/>
      <path d="M0,400 L390,400" stroke="#D4CFC4" strokeWidth="6" fill="none"/>
      <path d="M80,0 L80,600" stroke="#D4CFC4" strokeWidth="6" fill="none"/>
      <path d="M310,0 L310,600" stroke="#D4CFC4" strokeWidth="6" fill="none"/>
      {/* Diagonal paths */}
      <path d="M80,220 L195,80" stroke="#CCC8BC" strokeWidth="4" fill="none"/>
      <path d="M310,220 L195,80" stroke="#CCC8BC" strokeWidth="4" fill="none"/>
      <path d="M80,400 L195,520" stroke="#CCC8BC" strokeWidth="4" fill="none"/>
      {/* Water Feature */}
      <ellipse cx="280" cy="360" rx="55" ry="30" fill="#BCDCEE" opacity="0.6"/>
      <ellipse cx="280" cy="360" rx="42" ry="22" fill="#A8D0E6" opacity="0.5"/>
      {/* Trees / Vegetation clusters */}
      {[[40,60],[360,50],[40,500],[350,480],[150,290],[250,150],[320,480],[60,340]].map(([x,y],i)=>(
        <g key={i}>
          <circle cx={x} cy={y} r={14} fill="#8CB87A" opacity="0.7"/>
          <circle cx={x+5} cy={y-4} r={10} fill="#A0CA8C" opacity="0.7"/>
          <circle cx={x-4} cy={y+3} r={9} fill="#7AAD68" opacity="0.7"/>
        </g>
      ))}
      {/* Building footprints */}
      <rect x="155" y="40" width="80" height="60" rx={CORNER_SM} fill="#C9C0B0" opacity="0.6"/>
      <rect x="25" y="160" width="100" height="80" rx={CORNER_SM} fill="#C9C0B0" opacity="0.5"/>
      <rect x="240" y="160" width="70" height="70" rx={CORNER_SM} fill="#C9C0B0" opacity="0.5"/>
      <rect x="60" y="380" width="70" height="60" rx={CORNER_SM} fill="#C9C0B0" opacity="0.5"/>
      {/* Grid texture */}
      {Array.from({length:8}).map((_,i)=>(
        <line key={`v${i}`} x1={i*55} y1="0" x2={i*55} y2="600" stroke="#D8D4C8" strokeWidth="0.5" opacity="0.4"/>
      ))}
      {Array.from({length:12}).map((_,i)=>(
        <line key={`h${i}`} x1="0" y1={i*55} x2="390" y2={i*55} stroke="#D8D4C8" strokeWidth="0.5" opacity="0.4"/>
      ))}
      {/* Contour rings */}
      <path d="M195,300 m-120,0 a120,80 0 1,0 240,0 a120,80 0 1,0 -240,0" stroke="#D0CAB8" strokeWidth="1" fill="none" opacity="0.5"/>
      <path d="M195,300 m-80,0 a80,54 0 1,0 160,0 a80,54 0 1,0 -160,0" stroke="#D0CAB8" strokeWidth="1" fill="none" opacity="0.5"/>
    </svg>
  );
}

function MapPin({ location, onTap }) {
  const [pressed, setPressed] = useState(false);
  const left = `${location.x}%`;
  const top = `${location.y}%`;
  return (
    <div
      onClick={onTap}
      onMouseDown={() => setPressed(true)}
      onMouseUp={() => setPressed(false)}
      onMouseLeave={() => setPressed(false)}
      style={{ position: "absolute", left, top, transform: `translate(-50%, -100%) scale(${pressed ? 0.9 : 1})`, cursor: "pointer", transition: "transform 0.12s ease", zIndex: 10 }}
    >
      {/* Label */}
      <div style={{ background: "rgba(255,255,255,0.95)", border: `0.5px solid ${BORDER_COLOR}`, borderRadius: CORNER_SM, padding: "3px 7px", marginBottom: 4, whiteSpace: "nowrap", textAlign: "center" }}>
        <span style={{ fontSize: 10, fontWeight: 600, color: TEXT_DARK, letterSpacing: 0.2 }}>{location.name}</span>
      </div>
      {/* Pin shape */}
      <div style={{ display: "flex", justifyContent: "center" }}>
        <svg width="28" height="36" viewBox="0 0 28 36">
          <path d="M14 0C6.27 0 0 6.27 0 14C0 24.5 14 36 14 36C14 36 28 24.5 28 14C28 6.27 21.73 0 14 0Z" fill={PRIMARY_RED}/>
          <circle cx="14" cy="14" r="6" fill="white"/>
          <circle cx="14" cy="14" r="3" fill={PRIMARY_RED}/>
        </svg>
      </div>
    </div>
  );
}

function DetailModal({ location, onClose }) {
  const placeholderColors = ["#C5B8A3", "#A8C5C0", "#C5A8A8", "#B8C5A8", "#A8B0C5"];
  const bgColor = placeholderColors[location.id % placeholderColors.length];
  return (
    <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.6)", display: "flex", alignItems: "center", justifyContent: "center", padding: "24px 20px", zIndex: 50 }} onClick={onClose}>
      <div style={{ background: WHITE, borderRadius: 12, width: "100%", maxHeight: "85%", overflow: "hidden", display: "flex", flexDirection: "column" }} onClick={(e) => e.stopPropagation()}>
        {/* Photo Placeholder (4:5 ratio) */}
        <div style={{ width: "100%", paddingBottom: "62%", background: bgColor, position: "relative", flexShrink: 0 }}>
          <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
            <svg width="48" height="48" viewBox="0 0 48 48" fill="none"><rect width="48" height="48" rx="8" fill="rgba(255,255,255,0.2)"/><path d="M10 34L18 22L24 30L30 24L38 34H10Z" fill="rgba(255,255,255,0.5)"/><circle cx="32" cy="18" r="4" fill="rgba(255,255,255,0.5)"/></svg>
            <p style={{ color: "rgba(255,255,255,0.8)", fontSize: 11, marginTop: 8, letterSpacing: 0.5 }}>FOTO LOKASI</p>
          </div>
          {/* Year Badge */}
          <div style={{ position: "absolute", top: 12, left: 12, background: PRIMARY_RED, borderRadius: CORNER_SM, padding: "4px 10px" }}>
            <span style={{ color: WHITE, fontSize: 11, fontWeight: 600, letterSpacing: 0.5 }}>{location.year}</span>
          </div>
          {/* Close Button */}
          <button onClick={onClose} style={{ position: "absolute", top: 12, right: 12, width: 32, height: 32, borderRadius: "50%", background: "rgba(0,0,0,0.4)", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: WHITE, fontSize: 18, lineHeight: 1 }}>×</button>
        </div>
        {/* Content */}
        <div style={{ padding: "20px 20px 24px", overflowY: "auto" }}>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: TEXT_DARK, margin: "0 0 6px", letterSpacing: 0.2 }}>{location.name}</h2>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 14 }}>
            <div style={{ width: 4, height: 4, borderRadius: "50%", background: PRIMARY_RED }}/>
            <span style={{ fontSize: 12, color: PRIMARY_RED, fontWeight: 600, letterSpacing: 0.5 }}>SITUS BERSEJARAH · KAWASAN HERITAGE</span>
          </div>
          <p style={{ fontSize: 14, color: TEXT_MID, lineHeight: 1.75, margin: 0 }}>{location.info}</p>
        </div>
        {/* Close Button */}
        <div style={{ padding: "0 20px 20px", flexShrink: 0 }}>
          <button onClick={onClose} style={{ width: "100%", height: 46, background: PRIMARY_RED, border: "none", borderRadius: CORNER_MD, color: WHITE, fontSize: 15, fontWeight: 600, cursor: "pointer", letterSpacing: 0.5 }}>Tutup</button>
        </div>
      </div>
    </div>
  );
}

function ChatScreen({ messages, inputText, setInputText, onSend, isLoading, messagesEndRef, suggestions, onSuggest }) {
  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
      {/* Chat Header */}
      <div style={{ background: WHITE, borderBottom: `1px solid ${BORDER_COLOR}`, padding: "14px 20px 14px" }}>
        <h1 style={{ fontSize: 18, fontWeight: 700, color: TEXT_DARK, margin: 0 }}>Asisten Sejarah AI</h1>
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 3 }}>
          <div style={{ width: 7, height: 7, borderRadius: "50%", background: "#34C759" }}/>
          <span style={{ fontSize: 12, color: TEXT_MID }}>Aktif · Siap membantu</span>
        </div>
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: "auto", padding: "16px 16px 8px", background: LIGHT_GREY, display: "flex", flexDirection: "column", gap: 12 }}>
        {messages.map((msg) => (
          <MessageBubble key={msg.id} message={msg} />
        ))}
        {isLoading && <TypingIndicator />}
        <div ref={messagesEndRef} />
      </div>

      {/* Suggestions */}
      {messages.length <= 2 && (
        <div style={{ background: LIGHT_GREY, padding: "0 16px 8px", display: "flex", gap: 8, overflowX: "auto" }}>
          {suggestions.map((q, i) => (
            <button key={i} onClick={() => onSuggest(q)} style={{ background: WHITE, border: `1px solid ${BORDER_COLOR}`, borderRadius: 20, padding: "6px 12px", fontSize: 12, color: TEXT_DARK, cursor: "pointer", whiteSpace: "nowrap", flexShrink: 0 }}>
              {q}
            </button>
          ))}
        </div>
      )}

      {/* Input Area */}
      <div style={{ background: WHITE, borderTop: `1px solid ${BORDER_COLOR}`, padding: "12px 16px", display: "flex", gap: 10, alignItems: "flex-end" }}>
        <div style={{ flex: 1, background: LIGHT_GREY, borderRadius: 22, border: `1px solid ${BORDER_COLOR}`, padding: "10px 16px", minHeight: 44, display: "flex", alignItems: "center" }}>
          <input
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && onSend()}
            placeholder="Tanyakan tentang sejarah..."
            style={{ width: "100%", border: "none", background: "transparent", fontSize: 14, color: TEXT_DARK, outline: "none", fontFamily: "inherit" }}
          />
        </div>
        <button
          onClick={onSend}
          disabled={!inputText.trim() || isLoading}
          style={{ width: 44, height: 44, borderRadius: "50%", background: inputText.trim() && !isLoading ? PRIMARY_RED : "#D0D0D0", border: "none", cursor: inputText.trim() && !isLoading ? "pointer" : "default", display: "flex", alignItems: "center", justifyContent: "center", transition: "background 0.2s", flexShrink: 0 }}
        >
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M2 9L16 2L9 16L8 10L2 9Z" fill="white" strokeLinejoin="round"/></svg>
        </button>
      </div>
    </div>
  );
}

function MessageBubble({ message }) {
  const isAI = message.role === "ai";
  return (
    <div style={{ display: "flex", justifyContent: isAI ? "flex-start" : "flex-end", gap: 8, alignItems: "flex-end" }}>
      {isAI && (
        <div style={{ width: 30, height: 30, borderRadius: "50%", background: PRIMARY_RED, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="white"><path d="M8 2C5.8 2 4 3.8 4 6C4 7.4 4.7 8.6 5.8 9.3C3.7 9.8 2 11.1 2 13H14C14 11.1 12.3 9.8 10.2 9.3C11.3 8.6 12 7.4 12 6C12 3.8 10.2 2 8 2Z"/></svg>
        </div>
      )}
      <div style={{ maxWidth: "72%", background: isAI ? WHITE : PRIMARY_RED, borderRadius: isAI ? `${CORNER_MD}px ${CORNER_MD}px ${CORNER_MD}px 3px` : `${CORNER_MD}px ${CORNER_MD}px 3px ${CORNER_MD}px`, padding: "10px 14px", border: isAI ? `0.5px solid ${BORDER_COLOR}` : "none" }}>
        <p style={{ fontSize: 14, color: isAI ? TEXT_DARK : WHITE, margin: 0, lineHeight: 1.65 }}>{message.text}</p>
      </div>
    </div>
  );
}

function TypingIndicator() {
  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap: 8 }}>
      <div style={{ width: 30, height: 30, borderRadius: "50%", background: PRIMARY_RED, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        <svg width="16" height="16" viewBox="0 0 16 16" fill="white"><path d="M8 2C5.8 2 4 3.8 4 6C4 7.4 4.7 8.6 5.8 9.3C3.7 9.8 2 11.1 2 13H14C14 11.1 12.3 9.8 10.2 9.3C11.3 8.6 12 7.4 12 6C12 3.8 10.2 2 8 2Z"/></svg>
      </div>
      <div style={{ background: WHITE, borderRadius: `${CORNER_MD}px ${CORNER_MD}px ${CORNER_MD}px 3px`, padding: "12px 16px", border: `0.5px solid ${BORDER_COLOR}`, display: "flex", gap: 4, alignItems: "center" }}>
        {[0, 1, 2].map((i) => (
          <div key={i} style={{ width: 6, height: 6, borderRadius: "50%", background: TEXT_MID, animation: `pulse 1.2s ${i * 0.2}s infinite` }}/>
        ))}
      </div>
      <style>{`@keyframes pulse{0%,80%,100%{transform:scale(0.7);opacity:0.5}40%{transform:scale(1);opacity:1}}`}</style>
    </div>
  );
}

function BottomNav({ activeScreen, onNavigate }) {
  const tabs = [
    { id: "map", label: "Peta", icon: <svg width="22" height="22" viewBox="0 0 22 22" fill="none"><path d="M1 5L7 2L15 5L21 2V17L15 20L7 17L1 20V5Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" fill="none"/><path d="M7 2V17M15 5V20" stroke="currentColor" strokeWidth="1.5"/></svg> },
    { id: "chat", label: "Chat AI", icon: <svg width="22" height="22" viewBox="0 0 22 22" fill="none"><path d="M3 4H19C20.1 4 21 4.9 21 6V14C21 15.1 20.1 16 19 16H13L8 20V16H3C1.9 16 1 15.1 1 14V6C1 4.9 1.9 4 3 4Z" stroke="currentColor" strokeWidth="1.5" fill="none"/><circle cx="7" cy="10" r="1" fill="currentColor"/><circle cx="11" cy="10" r="1" fill="currentColor"/><circle cx="15" cy="10" r="1" fill="currentColor"/></svg> },
  ];
  return (
    <div style={{ height: 72, background: WHITE, borderTop: `1px solid ${BORDER_COLOR}`, display: "flex", alignItems: "center", flexShrink: 0 }}>
      {tabs.map((tab) => {
        const active = activeScreen === tab.id;
        return (
          <button key={tab.id} onClick={() => onNavigate(tab.id)} style={{ flex: 1, height: "100%", background: "none", border: "none", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 4, color: active ? PRIMARY_RED : "#9E9E9E", transition: "color 0.15s" }}>
            {tab.icon}
            <span style={{ fontSize: 11, fontWeight: active ? 600 : 400, letterSpacing: 0.3 }}>{tab.label}</span>
            {active && <div style={{ position: "absolute", bottom: 0, width: 40, height: 2.5, background: PRIMARY_RED, borderRadius: 2 }}/>}
          </button>
        );
      })}
    </div>
  );
}
