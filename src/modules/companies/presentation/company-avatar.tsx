import { Avatar } from "antd";

const GRADIENTS = [
  "linear-gradient(135deg,#9047F7,#2B107F)",
  "linear-gradient(135deg,#B57CFD,#5420D6)",
  "linear-gradient(135deg,#6C25F2,#1A0A52)",
  "linear-gradient(135deg,#C99BFD,#6C25F2)",
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
