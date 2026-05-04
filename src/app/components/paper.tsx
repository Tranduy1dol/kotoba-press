import type { ReactNode, HTMLAttributes } from "react";

export function Paper({ children, className = "", ...rest }: { children: ReactNode; className?: string } & HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      {...rest}
      className={`bg-[#fbf8f1] border border-[#d9cfb8] shadow-[0_1px_0_#e9e0c8,0_8px_24px_-12px_rgba(40,30,15,0.18)] ${className}`}
    >
      {children}
    </div>
  );
}

export function Divider({ className = "" }: { className?: string }) {
  return <div className={`h-px bg-[#cdbf9d] ${className}`} />;
}

export function Button({
  children,
  onClick,
  variant = "solid",
  className = "",
  type = "button",
  disabled,
}: {
  children: ReactNode;
  onClick?: () => void;
  variant?: "solid" | "ghost" | "outline";
  className?: string;
  type?: "button" | "submit";
  disabled?: boolean;
}) {
  const base =
    "px-4 py-2 transition-colors border tracking-wide disabled:opacity-50 disabled:cursor-not-allowed";
  const styles = {
    solid: "bg-[#1f1a14] text-[#fbf8f1] border-[#1f1a14] hover:bg-[#3a2f22]",
    outline: "bg-transparent text-[#1f1a14] border-[#1f1a14] hover:bg-[#1f1a14] hover:text-[#fbf8f1]",
    ghost: "bg-transparent text-[#3a2f22] border-transparent hover:bg-[#efe6cf]",
  }[variant];
  return (
    <button type={type} onClick={onClick} disabled={disabled} className={`${base} ${styles} ${className}`}>
      {children}
    </button>
  );
}

export function Tag({ children }: { children: ReactNode }) {
  return (
    <span className="inline-block px-2 py-0.5 border border-[#a89770] text-[#5e5132] bg-[#f4ecd6] tracking-wide">
      {children}
    </span>
  );
}
