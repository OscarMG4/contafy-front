import { CheckCircleFilled } from "@ant-design/icons";
import { Button, Card, Flex, Progress, Typography } from "antd";

import { palette } from "@/core/theme/palette";

const STEPS = [
  { title: "Crear tu empresa", done: true },
  { title: "Configurar plan de cuentas", done: false },
  { title: "Conectar tu banco", done: false },
  { title: "Invitar a tu equipo", done: false },
];

export function OnboardingCard() {
  const completed = STEPS.filter((step) => step.done).length;

  return (
    <Card variant="borderless" title="Primeros pasos" style={{ height: "100%" }}>
      <Flex align="center" gap={16} style={{ marginBottom: 20 }}>
        <Progress
          type="circle"
          size={64}
          percent={Math.round((completed / STEPS.length) * 100)}
          strokeColor={palette.purple[600]}
        />
        <div>
          <Typography.Text strong>
            {completed} de {STEPS.length} completados
          </Typography.Text>
          <br />
          <Typography.Text type="secondary" style={{ fontSize: 13 }}>
            Deja lista tu contabilidad en minutos.
          </Typography.Text>
        </div>
      </Flex>

      <Flex vertical gap={10}>
        {STEPS.map((step) => (
          <Flex key={step.title} align="center" justify="space-between" gap={8}>
            <Flex align="center" gap={10}>
              <CheckCircleFilled style={{ color: step.done ? palette.purple[600] : "var(--cf-border)", fontSize: 18 }} />
              <Typography.Text delete={step.done} type={step.done ? "secondary" : undefined}>
                {step.title}
              </Typography.Text>
            </Flex>
            {!step.done && (
              <Button size="small" type="link">
                Empezar
              </Button>
            )}
          </Flex>
        ))}
      </Flex>
    </Card>
  );
}
