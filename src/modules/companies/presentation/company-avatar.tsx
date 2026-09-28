import { Avatar } from "antd";

const GRADIENTS = [
  "linear-gradient(135deg,#8B5CF6,#4C1D95)",
  "linear-gradient(135deg,#A78BFA,#6D28D9)",
  "linear-gradient(135deg,#7C3AED,#1F1F2B)",
  "linear-gradient(135deg,#C4B5FD,#7C3AED)",
];

export function CompanyAvatar({ id, name, size = 36 }: { id: string; name: string; size?: number }) {
  const index = [...id].reduce((sum, char) => sum + char.charCodeAt(0), 0) % GRADIENTS.length;

  return (
    <Avatar
      shape="square"
      size={size}
      style={{ background: GRADIENTS[index], fontWeight: 600, borderRadius: 4, flexShrink: 0 }}
    >
      {name.trim().charAt(0).toUpperCase()}
    </Avatar>
  );
}
