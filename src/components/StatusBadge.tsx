import { CheckCircle2, AlertTriangle, XCircle } from "lucide-react";

export type StatusBadgeType = "pass" | "fail" | "warn" | "pending" | "rechecking" | "done";

interface Props {
  type: StatusBadgeType;
  text?: string;
  className?: string;
}

const MAP: Record<StatusBadgeType, { bg: string; text: string; icon: React.ReactNode; label: string }> = {
  pass: {
    bg: "bg-site-passBg",
    text: "text-site-pass",
    icon: <CheckCircle2 size={18} strokeWidth={2.5} />,
    label: "合格",
  },
  fail: {
    bg: "bg-site-failBg",
    text: "text-site-fail",
    icon: <XCircle size={18} strokeWidth={2.5} />,
    label: "超差",
  },
  warn: {
    bg: "bg-site-warnBg",
    text: "text-site-warn",
    icon: <AlertTriangle size={18} strokeWidth={2.5} />,
    label: "警告",
  },
  pending: {
    bg: "bg-site-failBg",
    text: "text-site-fail",
    icon: <XCircle size={18} strokeWidth={2.5} />,
    label: "待返工",
  },
  rechecking: {
    bg: "bg-site-warnBg",
    text: "text-site-warn",
    icon: <AlertTriangle size={18} strokeWidth={2.5} />,
    label: "待复测",
  },
  done: {
    bg: "bg-site-passBg",
    text: "text-site-pass",
    icon: <CheckCircle2 size={18} strokeWidth={2.5} />,
    label: "已合格",
  },
};

export default function StatusBadge({ type, text, className = "" }: Props) {
  const cfg = MAP[type];
  return (
    <div
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 ${cfg.bg} ${cfg.text} font-semibold ${className}`}
    >
      {cfg.icon}
      <span className="text-body-md">{text ?? cfg.label}</span>
    </div>
  );
}
