import { Button, Card, Table, Tag, Typography, type TableProps } from "antd";
import dayjs from "dayjs";

import { formatMoney } from "@/shared/lib/format";

import type { JournalEntrySummary } from "../domain/dashboard.types";

const columns: TableProps<JournalEntrySummary>["columns"] = [
  {
    title: "Asiento",
    dataIndex: "id",
    render: (id: string) => <Typography.Text strong>{id}</Typography.Text>,
  },
  {
    title: "Fecha",
    dataIndex: "date",
    render: (date: string) => dayjs(date).format("DD MMM YYYY"),
    responsive: ["md"],
  },
  { title: "Descripción", dataIndex: "description", ellipsis: true },
  { title: "Cuenta", dataIndex: "account", responsive: ["lg"], ellipsis: true },
  {
    title: "Estado",
    dataIndex: "status",
    render: (status: JournalEntrySummary["status"]) =>
      status === "posted" ? <Tag color="purple">Contabilizado</Tag> : <Tag>Borrador</Tag>,
  },
  {
    title: "Importe",
    dataIndex: "amount",
    align: "right",
    render: (amount: number) => (
      <Typography.Text strong type={amount < 0 ? "danger" : "success"}>
        {formatMoney(amount)}
      </Typography.Text>
    ),
  },
];

export function RecentEntriesCard({ data, loading }: { data: JournalEntrySummary[]; loading?: boolean }) {
  return (
    <Card
      variant="borderless"
      title="Últimos asientos"
      extra={<Button type="link">Ver todos</Button>}
      styles={{ body: { paddingTop: 0 } }}
    >
      <Table rowKey="id" columns={columns} dataSource={data} loading={loading} pagination={false} size="middle" />
    </Card>
  );
}
