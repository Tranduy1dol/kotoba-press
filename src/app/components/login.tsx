import { Paper, Button, Divider } from "./paper";
import { useAuth } from "../auth";

export function LoginPage() {
  const { login } = useAuth();
  return (
    <div className="min-h-screen flex items-center justify-center px-6 py-16 bg-[#f3ecd7]" style={{ backgroundImage: "radial-gradient(#d9cfb8 1px, transparent 1px)", backgroundSize: "22px 22px" }}>
      <Paper className="w-full max-w-md p-10">
        <div className="text-center">
          <p className="tracking-[0.3em] text-[#7a6a45]">日本語</p>
          <h1 className="mt-3 italic">Kotoba Press</h1>
          <p className="mt-2 text-[#5e5132]">A quiet study of the Japanese language.</p>
        </div>

        <Divider className="my-8" />

        <p className="text-center text-[#3a2f22]">
          Sign in to continue your studies. Your progress, cards, and notes will be waiting.
        </p>

        <div className="mt-8 flex flex-col gap-3">
          <Button onClick={login} className="w-full flex items-center justify-center gap-3">
            <GoogleMark />
            <span>Continue with Google</span>
          </Button>
          <p className="text-center text-[#7a6a45] mt-2" style={{ fontSize: "0.8rem" }}>
            By continuing you agree to our terms and quiet study principles.
          </p>
        </div>

        <Divider className="my-8" />

        <p className="text-center italic text-[#7a6a45]">
          “A journey of a thousand miles begins with a single step.”
        </p>
      </Paper>
    </div>
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
