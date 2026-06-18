import { useState, useRef, useCallback, useEffect } from "react";

const PRIMARY_RED = "#A6192E";
const WHITE = "#FFFFFF";
const LIGHT_GREY = "#F5F5F5";
const TEXT_DARK = "#1A1A1A";
const TEXT_MID = "#5C5C5C";
const BORDER_COLOR = "#E0E0E0";

// const BACKEND_URL = "http://localhost:3001";
// const BACKEND_URL = "https://ai-heritage-backend-production.up.railway.app/";
const BACKEND_URL = "";


// Conversation states: "idle" | "listening" | "thinking" | "speaking"

export default function VoiceChatScreen() {
  const [status, setStatus] = useState("idle");
  const [transcript, setTranscript] = useState("");
  const [aiText, setAiText] = useState("");
  const [history, setHistory] = useState([]);
  const [error, setError] = useState(null);
  const [supported, setSupported] = useState(true);

  const recognitionRef = useRef(null);
  const utteranceRef = useRef(null);
  const handleUserSpeechRef = useRef(null);

  // Init speech recognition once
  useEffect(() => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    console.log("[Voice] SpeechRecognition available:", !!SpeechRecognition);
    console.log("[Voice] speechSynthesis available:", !!window.speechSynthesis);

    if (!SpeechRecognition || !window.speechSynthesis) {
      setTimeout(() => setSupported(false), 1000);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = true;
    // Auto-detect: we default to Indonesian, but allow alternates.
    // Web Speech API doesn't truly auto-detect language mid-recognition,
    // so we set Indonesian as primary and let users switch if needed.
    recognition.lang = "id-ID";

    recognition.onstart = () => {
      console.log("[Voice] recognition started, listening...");
    };

    recognition.onspeechstart = () => {
      console.log("[Voice] speech detected");
    };

    recognition.onaudiostart = () => {
      console.log("[Voice] audio capture started");
    };

    recognition.onresult = (event) => {
      console.log("[Debug] onresult fired", event.results);
      console.log("[Voice] onresult fired", event.results);
      let interim = "";
      let final = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const text = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          final += text;
        } else {
          interim += text;
        }
      }
      setTranscript(final || interim);

      if (final) {
        handleUserSpeechRef.current?.(final.trim());
      }
    };

    recognition.onnomatch = () => {
      console.log("[Debug] no speech match");
    };
    
    recognition.onaudioend = () => {
      console.log("[Debug] audio ended");
    };
    
    recognition.onerror = (event) => {
      if (event.error === "no-speech") {
        setStatus("idle");
        return;
      }
      setError("Terjadi kesalahan pada mikrofon: " + event.error);
      setStatus("idle");
    };

    recognition.onend = () => {
      setStatus((prev) => (prev === "listening" ? "idle" : prev));
    };

    recognitionRef.current = recognition;

    return () => {
      recognition.abort();
      window.speechSynthesis.cancel();
    };
  }, []);

  // Detect simple language heuristic for TTS voice selection
  const detectLanguage = (text) => {
    const idIndicators = /\b(yang|dan|atau|ini|itu|dengan|untuk|dari|adalah|kerajaan|sejarah|bagaimana|apa|kapan|dimana|mengapa)\b/i;
    return idIndicators.test(text) ? "id-ID" : "en-US";
  };

  const speak = useCallback((text, lang) => {
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang;

    // Tuning khusus per bahasa agar terdengar lebih natural
    if (lang === "id-ID") {
      utterance.rate = 0.88;   // lebih lambat agar pelafalan jelas
      utterance.pitch = 1.05;  // sedikit lebih tinggi, terdengar lebih hangat
      utterance.volume = 1.0;
    } else {
      utterance.rate = 0.95;
      utterance.pitch = 1.0;
      utterance.volume = 1.0;
    }

    const trySpeak = () => {
      const voices = window.speechSynthesis.getVoices();

      if (lang === "id-ID") {
        // Prioritas: Google Bahasa Indonesia (perempuan, natural)
        const idVoice =
          voices.find((v) => v.name === "Google Bahasa Indonesia") ||
          voices.find((v) => v.lang === "id-ID" && !v.localService) ||
          voices.find((v) => v.lang === "id-ID") ||
          voices.find((v) => v.lang.startsWith("id")) ||
          null;
        if (idVoice) {
          utterance.voice = idVoice;
          console.log("[TTS] Using voice:", idVoice.name, idVoice.lang);
        } else {
          console.warn("[TTS] No id-ID voice found");
        }
      } else {
        // Untuk English — hindari Microsoft David/Mark (laki-laki)
        // Pilih Google UK English Female atau Zira
        const enVoice =
          voices.find((v) => v.name === "Google UK English Female") ||
          voices.find((v) => v.name === "Microsoft Zira - English (United States)") ||
          voices.find((v) => v.lang === "en-GB" && v.name.toLowerCase().includes("female")) ||
          voices.find((v) => v.lang === "en-US" && !v.localService) ||
          null;
        if (enVoice) utterance.voice = enVoice;
        console.log("[TTS] EN voice:", enVoice?.name);
      }

      utterance.onstart = () => setStatus("speaking");
      utterance.onend = () => setStatus("idle");
      utterance.onerror = () => setStatus("idle");

      utteranceRef.current = utterance;
      window.speechSynthesis.speak(utterance);
    };

    // Voices kadang belum loaded saat pertama kali — tunggu kalau perlu
    const voices = window.speechSynthesis.getVoices();
    if (voices.length === 0) {
      window.speechSynthesis.onvoiceschanged = () => {
        window.speechSynthesis.onvoiceschanged = null;
        trySpeak();
      };
    } else {
      trySpeak();
    }
  }, []);

  const handleUserSpeech = useCallback(async (text) => {
    if (!text) {
      setStatus("idle");
      return;
    }

    setStatus("thinking");
    setError(null);

    const lang = detectLanguage(text);
    const newHistory = [...history, { role: "user", text }];
    setHistory(newHistory);

    try {
      // const response = await fetch(`${BACKEND_URL}/api/chat`, {
      //   method: "POST",
      //   headers: { "Content-Type": "application/json" },
      //   body: JSON.stringify({
      //     message: text,
      //     history: history.slice(-6), // keep last 6 turns for context
      //   }),
      // });

      const response = await fetch(`${BACKEND_URL}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text, history: history.slice(-6) }),
      });
      
      if (!response.ok) throw new Error("Server error");

      const data = await response.json();
      const reply = data.text || "Maaf, saya tidak dapat menjawab saat ini.";

      setAiText(reply);
      setHistory([...newHistory, { role: "assistant", text: reply }]);
      speak(reply, lang);
    } catch  {
      setError("Tidak dapat terhubung ke server. Pastikan backend berjalan.");
      setStatus("idle");
    }
  }, [history, speak]);
  // Sync handleUserSpeech terbaru ke ref
  useEffect(() => {
    handleUserSpeechRef.current = handleUserSpeech;
  }, [handleUserSpeech]);

  // const startListening = () => {
  //   if (!recognitionRef.current) return;
  //   window.speechSynthesis.cancel();
  //   setTranscript("");
  //   setError(null);
  //   setStatus("listening");
  //   try {
  //     recognitionRef.current.start();
  //   } catch {
  //     // already started
  //   }
  // };
  const startListening = () => {
  if (!recognitionRef.current) {
    console.log("[Debug] recognition tidak ada");
    return;
  }
  window.speechSynthesis.cancel();
  setTranscript("");
  setError(null);
  setStatus("listening");
  try {
    recognitionRef.current.start();
    console.log("[Debug] recognition.start() dipanggil");
  } catch(e) {
    console.log("[Debug] error start:", e.message);
  }
};

  const stopListening = () => {
    if (!recognitionRef.current) return;
    recognitionRef.current.stop();
  };

  const handleMicPress = () => {
    if (status === "listening") {
      stopListening();
    } else if (status === "speaking") {
      window.speechSynthesis.cancel();
      setStatus("idle");
    } else if (status === "idle") {
      startListening();
    }
  };

  if (!supported) {
    return (
      <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 32, background: LIGHT_GREY, textAlign: "center" }}>
        <p style={{ fontSize: 14, color: TEXT_MID, lineHeight: 1.6 }}>
          Browser ini tidak mendukung Web Speech API. Silakan gunakan Google Chrome di desktop atau Android untuk fitur suara.
        </p>
      </div>
    );
  }

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
      {/* Header */}
      <div style={{ background: WHITE, borderBottom: `1px solid ${BORDER_COLOR}`, padding: "14px 20px" }}>
        <h1 style={{ fontSize: 18, fontWeight: 700, color: TEXT_DARK, margin: 0 }}>Asisten Sejarah AI</h1>
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 3 }}>
          <div style={{ width: 7, height: 7, borderRadius: "50%", background: status === "idle" ? "#34C759" : PRIMARY_RED }} />
          <span style={{ fontSize: 12, color: TEXT_MID }}>{statusLabel(status)}</span>
        </div>
      </div>

      {/* Main Voice Area */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: LIGHT_GREY, padding: "24px 28px", gap: 24 }}>

        {/* Visualizer Circle */}
        <div style={{ position: "relative", width: 180, height: 180, display: "flex", alignItems: "center", justifyContent: "center" }}>
          {(status === "listening" || status === "speaking") && (
            <>
              <PulseRing delay={0} active={status} />
              <PulseRing delay={0.4} active={status} />
              <PulseRing delay={0.8} active={status} />
            </>
          )}
          <div style={{
            width: 120, height: 120, borderRadius: "50%",
            background: status === "idle" ? WHITE : PRIMARY_RED,
            border: `1px solid ${BORDER_COLOR}`,
            display: "flex", alignItems: "center", justifyContent: "center",
            transition: "background 0.3s ease",
            zIndex: 2,
          }}>
            {status === "thinking" ? (
              <ThinkingDots color={status === "idle" ? TEXT_MID : WHITE} />
            ) : (
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none">
                <rect x="9" y="2" width="6" height="12" rx="3" fill={status === "idle" ? PRIMARY_RED : WHITE} />
                <path d="M5 10v1a7 7 0 0014 0v-1M12 18v3M8.5 21h7" stroke={status === "idle" ? PRIMARY_RED : WHITE} strokeWidth="1.8" strokeLinecap="round" fill="none" />
              </svg>
            )}
          </div>
        </div>

        {/* Status Text */}
        <div style={{ textAlign: "center", minHeight: 70, display: "flex", flexDirection: "column", gap: 8 }}>
          <p style={{ fontSize: 15, fontWeight: 600, color: TEXT_DARK, margin: 0 }}>
            {mainPrompt(status)}
          </p>
          {transcript && status !== "speaking" && (
            <p style={{ fontSize: 13, color: TEXT_MID, margin: 0, fontStyle: "italic", maxWidth: 260 }}>
              "{transcript}"
            </p>
          )}
          {aiText && status === "speaking" && (
            <p style={{ fontSize: 13, color: TEXT_DARK, margin: 0, maxWidth: 280, lineHeight: 1.6, padding: "0 8px" }}>
              {aiText}
            </p>
          )}
          {error && (
            <p style={{ fontSize: 12, color: PRIMARY_RED, margin: 0, maxWidth: 260 }}>
              {error}
            </p>
          )}
        </div>

        {/* Mic Button */}
        <button
          onClick={handleMicPress}
          disabled={status === "thinking"}
          style={{
            width: 64, height: 64, borderRadius: "50%",
            background: status === "listening" ? PRIMARY_RED : WHITE,
            border: `1.5px solid ${status === "listening" ? PRIMARY_RED : BORDER_COLOR}`,
            cursor: status === "thinking" ? "default" : "pointer",
            display: "flex", alignItems: "center", justifyContent: "center",
            opacity: status === "thinking" ? 0.5 : 1,
            transition: "all 0.2s ease",
            boxShadow: status === "listening" ? "0 0 0 6px rgba(166,25,46,0.12)" : "none",
          }}
        >
          {status === "listening" ? (
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
              <rect x="6" y="6" width="12" height="12" rx="2" fill={WHITE} />
            </svg>
          ) : status === "speaking" ? (
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
              <rect x="6" y="6" width="4" height="12" rx="1" fill={PRIMARY_RED} />
              <rect x="14" y="6" width="4" height="12" rx="1" fill={PRIMARY_RED} />
            </svg>
          ) : (
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
              <rect x="9" y="2" width="6" height="12" rx="3" fill={PRIMARY_RED} />
              <path d="M5 10v1a7 7 0 0014 0v-1M12 18v3M8.5 21h7" stroke={PRIMARY_RED} strokeWidth="1.8" strokeLinecap="round" fill="none" />
            </svg>
          )}
        </button>

        <p style={{ fontSize: 11, color: TEXT_MID, margin: 0, textAlign: "center", maxWidth: 240 }}>
          {status === "listening"
            ? "Tekan untuk berhenti merekam"
            : status === "speaking"
            ? "Tekan untuk menghentikan suara"
            : "Tekan dan mulai bicara dalam Bahasa Indonesia atau English"}
        </p>
      </div>
    </div>
  );
}

function statusLabel(status) {
  switch (status) {
    case "listening": return "Mendengarkan...";
    case "thinking": return "Memproses...";
    case "speaking": return "Berbicara...";
    default: return "Aktif · Siap membantu";
  }
}

function mainPrompt(status) {
  switch (status) {
    case "listening": return "Saya mendengarkan...";
    case "thinking": return "Sebentar, saya carikan jawabannya...";
    case "speaking": return "Asisten Sejarah AI";
    default: return "Tekan mikrofon untuk mulai bicara";
  }
}

function ThinkingDots({ color }) {
  return (
    <div style={{ display: "flex", gap: 5 }}>
      {[0, 1, 2].map((i) => (
        <div key={i} style={{
          width: 9, height: 9, borderRadius: "50%", background: color,
          animation: `dotPulse 1.2s ${i * 0.15}s infinite ease-in-out`,
        }} />
      ))}
      <style>{`@keyframes dotPulse{0%,80%,100%{transform:scale(0.6);opacity:0.4}40%{transform:scale(1);opacity:1}}`}</style>
    </div>
  );
}

function PulseRing({ delay, active }) {
  const color = active === "listening" ? PRIMARY_RED : PRIMARY_RED;
  return (
    <div style={{
      position: "absolute", width: 120, height: 120, borderRadius: "50%",
      border: `2px solid ${color}`, opacity: 0,
      animation: `ringPulse 1.8s ${delay}s infinite ease-out`,
    }}>
      <style>{`@keyframes ringPulse{0%{transform:scale(1);opacity:0.5}100%{transform:scale(1.8);opacity:0}}`}</style>
    </div>
  );
}
