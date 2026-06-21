"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Send, ImagePlus, Loader2 } from "lucide-react";
import { useMascot } from "@/lib/mascot/MascotContext";
import { Aawax } from "./Aawax";
import { compressImage } from "@/lib/imageCompression";
import { MASCOT_NAME } from "@/lib/mascot/config";

type Message = { role: "user" | "assistant"; content: string };

const SUGGESTIONS = [
  "What is my score trend?",
  "What kind of questions do I get wrong?",
  "Where do I need to improve?",
  "Give me a quick study tip",
];

const WELCOME = `Hey, I'm ${MASCOT_NAME}, your study buddy. Ask me anything about your notes, or about how you're doing. I can see your test scores and where you tend to slip up.`;

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export function ChatWithAawax() {
  const { design, color, chatOpen, chatSeed, closeChat, consumeChatSeed, playBoop } = useMascot();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [images, setImages] = useState<string[]>([]);
  const [sending, setSending] = useState(false);
  const [attaching, setAttaching] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    requestAnimationFrame(() => {
      scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
    });
  };

  const send = async (textArg?: string, imgsArg?: string[]) => {
    const text = (textArg ?? input).trim();
    const imgs = imgsArg ?? images;
    if ((!text && imgs.length === 0) || sending) return;

    const nextMessages: Message[] = [...messages, { role: "user", content: text || "(sent a photo)" }];
    setMessages(nextMessages);
    setInput("");
    setImages([]);
    setSending(true);
    scrollToBottom();

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "chat", messages: nextMessages, images: imgs }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.detail || "Aawax could not reply.");
      setMessages((prev) => [...prev, { role: "assistant", content: String(data.reply ?? "") }]);
      playBoop();
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            err instanceof Error && err.message.includes("Sign in")
              ? "Please sign in first so I can see your study history."
              : "Sorry, I had trouble replying just now. Please try again in a moment.",
        },
      ]);
    } finally {
      setSending(false);
      scrollToBottom();
    }
  };

  // Auto-send a seeded message (e.g. from an "Ask Aawax" button).
  useEffect(() => {
    if (chatOpen && chatSeed) {
      const seed = chatSeed;
      consumeChatSeed();
      void send(seed, []);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chatOpen, chatSeed]);

  const handleFiles = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    e.target.value = "";
    if (!files.length) return;
    const room = 3 - images.length;
    if (room <= 0) return;
    setAttaching(true);
    try {
      const picked = files.slice(0, room);
      const urls: string[] = [];
      for (const f of picked) {
        const compressed = await compressImage(f);
        urls.push(await fileToDataUrl(compressed));
      }
      setImages((prev) => [...prev, ...urls].slice(0, 3));
    } catch {
      /* ignore bad image */
    } finally {
      setAttaching(false);
    }
  };

  return (
    <AnimatePresence>
      {chatOpen && (
        <motion.div
          className="fixed inset-0 z-[75] flex flex-col bg-[#06060b]"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 24 }}
          transition={{ duration: 0.22, ease: "easeOut" }}
        >
          {/* Header */}
          <div className="flex items-center gap-3 border-b border-white/[0.06] px-4 py-3">
            <button
              onClick={closeChat}
              aria-label="Close chat"
              className="flex h-9 w-9 items-center justify-center rounded-full bg-white/5 text-white/70 transition-colors hover:bg-white/10 cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>
            <span
              className="flex h-10 w-10 items-center justify-center rounded-full"
              style={{ background: "rgba(var(--accent-glow), 0.12)" }}
            >
              <Aawax design={design} color={color} mood="idle" size={34} float={false} />
            </span>
            <div className="min-w-0">
              <p className="font-serif text-lg leading-none text-white">Ask {MASCOT_NAME}</p>
              <p className="mt-1 flex items-center gap-1.5 text-xs text-white/45">
                <span className="inline-block h-2 w-2 rounded-full bg-green-400" />
                knows your study history
              </p>
            </div>
          </div>

          {/* Messages */}
          <div ref={scrollRef} className="hide-scrollbar flex-1 space-y-4 overflow-y-auto px-4 py-5">
            {/* Welcome */}
            <Bubble role="assistant" design={design} color={color}>
              {WELCOME}
            </Bubble>

            {messages.length === 0 && (
              <div>
                <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.2em] text-white/35">
                  Try asking
                </p>
                <div className="flex flex-wrap gap-2">
                  {SUGGESTIONS.map((s) => (
                    <button
                      key={s}
                      onClick={() => void send(s, [])}
                      className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-white/75 transition-colors hover:bg-white/[0.08] cursor-pointer"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((m, i) => (
              <Bubble key={i} role={m.role} design={design} color={color}>
                {m.content}
              </Bubble>
            ))}

            {sending && (
              <Bubble role="assistant" design={design} color={color}>
                <span className="inline-flex items-center gap-2 text-white/60">
                  <Loader2 className="h-4 w-4 animate-spin" /> thinking...
                </span>
              </Bubble>
            )}
          </div>

          {/* Image previews */}
          {images.length > 0 && (
            <div className="flex gap-2 px-4 pb-2">
              {images.map((src, i) => (
                <div key={i} className="relative h-14 w-14 overflow-hidden rounded-xl border border-white/10">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={src} alt={`attachment ${i + 1}`} className="h-full w-full object-cover" />
                  <button
                    onClick={() => setImages((prev) => prev.filter((_, idx) => idx !== i))}
                    className="absolute right-0.5 top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-black/70 text-white cursor-pointer"
                    aria-label="Remove image"
                  >
                    <X className="h-2.5 w-2.5" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Input */}
          <div className="flex items-center gap-2 border-t border-white/[0.06] px-4 py-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))]">
            <input ref={fileRef} type="file" accept="image/*" multiple hidden onChange={handleFiles} />
            <button
              onClick={() => fileRef.current?.click()}
              disabled={images.length >= 3 || attaching}
              aria-label="Add photo"
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white/5 text-white/70 transition-colors hover:bg-white/10 disabled:opacity-40 cursor-pointer"
            >
              {attaching ? <Loader2 className="h-5 w-5 animate-spin" /> : <ImagePlus className="h-5 w-5" />}
            </button>
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  void send();
                }
              }}
              placeholder={`Ask ${MASCOT_NAME} anything...`}
              className="h-11 flex-1 rounded-full border border-white/10 bg-white/[0.04] px-4 text-sm text-white placeholder:text-white/35 focus:outline-none focus:ring-2"
              style={{ ["--tw-ring-color" as string]: "var(--accent)" }}
            />
            <button
              onClick={() => void send()}
              disabled={sending || (!input.trim() && images.length === 0)}
              aria-label="Send"
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-[#0a0a12] transition-transform active:scale-95 disabled:opacity-40 cursor-pointer"
              style={{ background: "linear-gradient(135deg, var(--accent-soft), var(--accent))" }}
            >
              <Send className="h-5 w-5" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function Bubble({
  role,
  design,
  color,
  children,
}: {
  role: "user" | "assistant";
  design: ReturnType<typeof useMascot>["design"];
  color: ReturnType<typeof useMascot>["color"];
  children: React.ReactNode;
}) {
  if (role === "user") {
    return (
      <div className="flex justify-end">
        <div
          className="max-w-[80%] whitespace-pre-wrap rounded-2xl rounded-br-md px-4 py-2.5 text-sm text-[#0a0a12]"
          style={{ background: "linear-gradient(135deg, var(--accent-soft), var(--accent))" }}
        >
          {children}
        </div>
      </div>
    );
  }
  return (
    <div className="flex items-end gap-2">
      <span className="mb-0.5 hidden h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white/5 sm:flex">
        <Aawax design={design} color={color} mood="idle" size={22} float={false} />
      </span>
      <div className="max-w-[82%] whitespace-pre-wrap rounded-2xl rounded-bl-md border border-white/[0.07] bg-white/[0.04] px-4 py-2.5 text-sm leading-relaxed text-white/85">
        {children}
      </div>
    </div>
  );
}
