"use client";

import { useRouter } from "next/navigation";
import { CheckCircleFilled } from "@ant-design/icons";
import { Button, Card, Flex, Progress, Typography } from "antd";

import { palette } from "@/core/theme/palette";

import type { OnboardingStep } from "../domain/dashboard.types";

export function OnboardingCard({ steps }: { steps: OnboardingStep[] }) {
  const router = useRouter();
  const completed = steps.filter((step) => step.done).length;

  return (
    <Card variant="borderless" title="Primeros pasos" style={{ height: "100%" }}>
      <Flex align="center" gap={20} style={{ marginBottom: 24 }}>
        <Progress
          type="circle"
          size={64}
          percent={steps.length ? Math.round((completed / steps.length) * 100) : 0}
          strokeColor={palette.purple[500]}
        />
        <Flex vertical gap={4}>
          <Typography.Text strong>
            {completed} de {steps.length} completados
          </Typography.Text>
          <Typography.Text type="secondary" style={{ fontSize: 13 }}>
            Completa la base contable del cliente.
          </Typography.Text>
        </Flex>
      </Flex>

      <Flex vertical gap={6}>
        {steps.map((step) => (
          <Flex
            key={step.key}
            align="center"
            justify="space-between"
            gap={16}
            style={{ padding: "10px 12px", borderRadius: 10, background: "var(--cf-surface-muted)" }}
          >
            <Flex align="center" gap={12}>
              <CheckCircleFilled style={{ color: step.done ? "var(--cf-accent)" : "var(--cf-border-strong)", fontSize: 18 }} />
              <Typography.Text delete={step.done} type={step.done ? "secondary" : undefined}>
                {step.title}
              </Typography.Text>
            </Flex>
            {!step.done && step.href && (
              <Button size="small" type="link" onClick={() => router.push(step.href!)}>
                Empezar
              </Button>
            )}
          </Flex>
        ))}
      </Flex>
    </Card>
  );
}
