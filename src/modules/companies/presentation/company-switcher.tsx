"use client";

import { useRouter } from "next/navigation";
import { PlusOutlined, SettingOutlined, ShopOutlined } from "@ant-design/icons";
import { App, Button, Divider, Flex, Select, Skeleton, Typography } from "antd";

import { useActiveCompany } from "../application/active-company";
import type { Company } from "../domain/company.types";
import { CompanyAvatar } from "./company-avatar";

interface CompanyOption {
  value: string;
  label: string;
  search: string;
  company: Company;
}

export function CompanySwitcher() {
  const router = useRouter();
  const { message } = App.useApp();
  const { company, selectedId, companies, isLoading, select } = useActiveCompany();

  if (isLoading) {
    return <Skeleton.Input active size="medium" style={{ width: 280, borderRadius: 4 }} />;
  }

  if (!companies.length) {
    return (
      <Button type="primary" icon={<PlusOutlined />} onClick={() => router.push("/companies")}>
        Registrar cliente
      </Button>
    );
  }

  const options: CompanyOption[] = companies.map((item) => ({
    value: item.id,
    label: item.business_name,
    search: `${item.business_name} ${item.trade_name ?? ""} ${item.ruc}`,
    company: item,
  }));

  return (
    <Flex align="center" gap={8} style={{ minWidth: 0 }}>
      <Typography.Text type="secondary" style={{ fontSize: 12, whiteSpace: "nowrap" }}>
        <ShopOutlined style={{ marginInlineEnd: 4 }} />
        Trabajando en
      </Typography.Text>
      <Select<string, CompanyOption>
        aria-label="Cliente con el que trabajas"
        value={selectedId ?? company?.id}
        onChange={(id) => {
          const chosen = companies.find((item) => item.id === id);
          select(id, chosen);
          if (chosen) message.success(`Ahora trabajas con ${chosen.business_name}`);
        }}
        options={options}
        variant="filled"
        style={{ width: 260, minWidth: 180 }}
        popupMatchSelectWidth={340}
        showSearch={{ optionFilterProp: "search" }}
        placeholder="Elige el cliente"
        labelRender={({ value }) => {
          const selected = companies.find((item) => item.id === value);
          return selected ? (
            <Flex align="center" gap={8} style={{ minWidth: 0 }}>
              <CompanyAvatar id={selected.id} name={selected.business_name} size={22} />
              <Typography.Text strong ellipsis style={{ fontSize: 13 }}>
                {selected.trade_name || selected.business_name}
              </Typography.Text>
            </Flex>
          ) : null;
        }}
        optionRender={({ data }) => (
          <Flex align="center" gap={10} style={{ paddingBlock: 2 }}>
            <CompanyAvatar id={data.company.id} name={data.company.business_name} size={30} />
            <div style={{ minWidth: 0, lineHeight: 1.3 }}>
              <Typography.Text strong ellipsis style={{ display: "block", fontSize: 13 }}>
                {data.company.business_name}
              </Typography.Text>
              <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                RUC {data.company.ruc}
              </Typography.Text>
            </div>
          </Flex>
        )}
        popupRender={(menu) => (
          <>
            {menu}
            <Divider style={{ margin: "6px 0" }} />
            <Button type="text" block icon={<SettingOutlined />} onClick={() => router.push("/companies")}>
              Gestionar clientes
            </Button>
          </>
        )}
      />
    </Flex>
  );
}
