import { useAuth } from "../auth";
import { Paper, Button, Divider, Tag } from "./paper";

const NAV_LINKS = [
  { label: "About", href: "#" },
  { label: "Privacy", href: "#" },
  { label: "Terms", href: "#" },
  { label: "Contact", href: "#" },
];

export function LoginPage() {
  const { login } = useAuth();

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{
        backgroundColor: "#f3ecd7",
        backgroundImage: "radial-gradient(#d9cfb8 1px, transparent 1px)",
        backgroundSize: "22px 22px",
      }}
    >
      <Header />
      <Hero onLogin={login} />
      <Footer />
    </div>
  );
}

function Header() {
  return (
    <header className="max-w-6xl mx-auto w-full px-8 py-6 flex items-center justify-between">
      <div className="flex items-baseline gap-3">
        <span className="tracking-[0.3em] text-[#7a6a45]">日本語</span>
        <span className="italic" style={{ fontSize: "1.4rem" }}>Kotoba Press</span>
      </div>
      <nav className="hidden md:flex gap-8 italic text-[#3a2f22]">
        {NAV_LINKS.map((l) => (
          <a key={l.label} href={l.href} className="hover:text-[#1f1a14]">{l.label}</a>
        ))}
      </nav>
    </header>
  );
}

function Hero({ onLogin }: { onLogin: () => void }) {
  return (
    <section className="flex-1 max-w-6xl mx-auto w-full px-8 py-12 grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
      <div className="lg:col-span-7">
        <p className="tracking-[0.3em] text-[#7a6a45]">A QUIET STUDY</p>
        <h1 className="italic mt-4" style={{ fontSize: "4rem", lineHeight: 1.05 }}>
          Learn Japanese,<br />
          the way of a <span className="underline decoration-[#a89770] underline-offset-8">slow reader</span>.
        </h1>
        <p className="mt-6 text-[#3a2f22] max-w-xl" style={{ fontSize: "1.1rem", lineHeight: 1.6 }}>
          A paper-style study companion for the JLPT — flashcards, grammar,
          and mock examinations, set in calm typography.
        </p>

        <div className="mt-8">
          <Button onClick={onLogin} className="flex items-center gap-3">
            <GoogleMark />
            <span>Sign in with Google</span>
          </Button>
        </div>
      </div>

      <div className="lg:col-span-5">
        <Paper className="p-8 -rotate-1">
          <p className="italic text-[#7a6a45]">今日の言葉 · word of the day</p>
          <p className="mt-3" style={{ fontSize: "3.5rem", lineHeight: 1 }}>懐かしい</p>
          <p className="italic text-[#5e5132] mt-1">なつかしい</p>
          <Divider className="my-4" />
          <p>dear; nostalgic; missed</p>
          <p className="italic text-[#7a6a45] mt-1" style={{ fontSize: "0.9rem" }}>adj-i · JLPT N2</p>
        </Paper>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="border-t border-[#cdbf9d] bg-[#fbf8f1]">
      <div className="max-w-6xl mx-auto px-8 py-6 flex flex-col md:flex-row justify-between gap-3 italic text-[#7a6a45]" style={{ fontSize: "0.9rem" }}>
        <span>Kotoba Press · est. 2026</span>
        <div className="flex gap-6">
          {NAV_LINKS.map((l) => (
            <a key={l.label} href={l.href} className="hover:text-[#1f1a14]">{l.label}</a>
          ))}
        </div>
      </div>
    </footer>
  );
}

function GoogleMark() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden>
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3c-1.6 4.6-6 8-11.3 8-6.6 0-12-5.4-12-12s5.4-12 12-12c3 0 5.8 1.1 7.9 3l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.2-.1-2.3-.4-3.5z" />
      <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 16 19 13 24 13c3 0 5.8 1.1 7.9 3l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.6 8.4 6.3 14.7z" />
      <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2c-2 1.4-4.5 2.4-7.2 2.4-5.3 0-9.7-3.4-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z" />
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.1-4 5.5l6.2 5.2C40.9 35.5 44 30.2 44 24c0-1.2-.1-2.3-.4-3.5z" />
    </svg>
  );
}
