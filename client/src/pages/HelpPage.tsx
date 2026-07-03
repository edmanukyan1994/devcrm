import { Link } from "react-router-dom";
import {
  Check,
  Columns3,
  FolderKanban,
  MessageSquare,
  Minus,
  Wallet,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type Cell = "yes" | "no" | "note";

const ROWS: { feature: string; project: Cell; order: Cell; task: Cell; chat: Cell; hint?: string }[] = [
  { feature: "Название и описание (бриф)", project: "yes", order: "yes", task: "yes", chat: "no" },
  { feature: "Обложка", project: "yes", order: "no", task: "no", chat: "no" },
  { feature: "Заказчик", project: "yes", order: "no", task: "no", chat: "no" },
  { feature: "Статус работы", project: "yes", order: "yes", task: "yes", chat: "no", hint: "Проект: активен/пауза/завершён. Заказ: канбан. Правка: статус задачи." },
  { feature: "Дедлайн", project: "yes", order: "yes", task: "yes", chat: "no" },
  { feature: "Бюджет и оплаты", project: "yes", order: "yes", task: "no", chat: "no" },
  { feature: "Файлы (ТЗ, макеты, результат)", project: "yes", order: "yes", task: "yes", chat: "yes", hint: "На каждом уровне — свои файлы по смыслу." },
  { feature: "Комментарии", project: "yes", order: "yes", task: "yes", chat: "note", hint: "Структурированные комментарии в CRM. Чат — для быстрой переписки." },
  { feature: "Голосовые сообщения", project: "no", order: "no", task: "no", chat: "yes" },
  { feature: "Приоритет", project: "no", order: "no", task: "yes", chat: "no" },
  { feature: "Список вложенных сущностей", project: "note", order: "note", task: "no", chat: "no", hint: "Проект → заказы. Заказ → правки." },
];

function CellIcon({ value }: { value: Cell }) {
  if (value === "yes") return <Check className="h-4 w-4 text-green-600 mx-auto" />;
  if (value === "note") return <span className="text-[10px] text-muted-foreground">см. ниже</span>;
  return <Minus className="h-4 w-4 text-muted-foreground/30 mx-auto" />;
}

export function HelpPage() {
  const { user } = useAuth();
  const isDeveloper = user?.role === "DEVELOPER";

  return (
    <div className="page-section max-w-3xl">
      <header className="space-y-2 mb-8">
        <p className="page-subtitle">Справка</p>
        <h1 className="page-title">Как устроен DevCRM</h1>
        <p className="text-muted-foreground">
          Один сайт — один проект. Внутри — заказы (этапы), внутри заказов — правки (задачи).
        </p>
      </header>

      <section className="space-y-4 mb-10">
        <h2 className="text-lg font-semibold">Иерархия</h2>
        <Card>
          <CardContent className="pt-6 space-y-4 text-sm">
            <div className="rounded-xl bg-muted/50 p-4 font-mono text-xs leading-6">
              Проект «Сайт клиники» — весь сайт, один клиент
              <br />
              &nbsp;&nbsp;├ Заказ «Главная» — страница / этап
              <br />
              &nbsp;&nbsp;│&nbsp;&nbsp;└ Правка «Шрифт в шапке» — конкретная задача
              <br />
              &nbsp;&nbsp;└ Заказ «Услуги»
              <br />
              &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;└ Правка «Таблица цен»
            </div>
            <p className="text-muted-foreground leading-relaxed">
              <strong className="text-foreground">Проект</strong> — договорённость с клиентом целиком: бриф, ТЗ,
              брендбук, общий бюджет, дедлайн сдачи.
              <br />
              <strong className="text-foreground">Заказ</strong> — часть проекта: страница, раздел, этап. Сюда —
              макеты и обсуждение именно этой части.
              <br />
              <strong className="text-foreground">Правка</strong> — мелкая задача: баг, правка, пожелание клиента.
              <br />
              <strong className="text-foreground">Чат</strong> — живая переписка (текст, голос, быстрые файлы), не
              заменяет комментарии в заказах и правках.
            </p>
          </CardContent>
        </Card>
      </section>

      <section className="space-y-4 mb-10">
        <h2 className="text-lg font-semibold">Что где хранить</h2>
        <div className="grid gap-3 sm:grid-cols-2 text-sm">
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm">Файлы в проекте</CardTitle></CardHeader>
            <CardContent className="text-muted-foreground">ТЗ, договор, брендбук, исходники, общие материалы</CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm">Файлы в заказе</CardTitle></CardHeader>
            <CardContent className="text-muted-foreground">Макеты страницы, промежуточный и финальный результат</CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm">Файлы в правке</CardTitle></CardHeader>
            <CardContent className="text-muted-foreground">Скриншот бага, референс, конкретный файл к задаче</CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm">Файлы в чате</CardTitle></CardHeader>
            <CardContent className="text-muted-foreground">Быстрый обмен: «глянь», «вот скрин», голосовое</CardContent>
          </Card>
        </div>
      </section>

      <section className="space-y-4 mb-10">
        <h2 className="text-lg font-semibold">Таблица возможностей</h2>
        <Card>
          <CardContent className="p-0 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left p-4 font-medium min-w-[140px]">Возможность</th>
                  <th className="p-4 font-medium text-center">Проект</th>
                  <th className="p-4 font-medium text-center">Заказ</th>
                  <th className="p-4 font-medium text-center">Правка</th>
                  <th className="p-4 font-medium text-center">Чат</th>
                </tr>
              </thead>
              <tbody>
                {ROWS.map((row) => (
                  <tr key={row.feature} className="border-b border-border last:border-0">
                    <td className="p-4">
                      <p>{row.feature}</p>
                      {row.hint && <p className="text-[11px] text-muted-foreground mt-1">{row.hint}</p>}
                    </td>
                    <td className="p-4"><CellIcon value={row.project} /></td>
                    <td className="p-4"><CellIcon value={row.order} /></td>
                    <td className="p-4"><CellIcon value={row.task} /></td>
                    <td className="p-4"><CellIcon value={row.chat} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      </section>

      <section className="space-y-4 mb-10">
        <h2 className="text-lg font-semibold">Разделы приложения</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {[
            { to: "/messages", icon: MessageSquare, title: "Чат", desc: "Переписка с клиентом в реальном времени" },
            { to: "/finance", icon: Wallet, title: "Финансы", desc: "Бюджеты и оплаты по проектам" },
            { to: "/timeline", icon: Columns3, title: "Сроки", desc: "Календарь дедлайнов" },
            { to: "/search", icon: FolderKanban, title: "Поиск", desc: "Поиск по всем уровням" },
          ].map(({ to, icon: Icon, title, desc }) => (
            <Link key={to} to={to} className="block cursor-pointer">
              <Card className="h-full hover:shadow-md transition-all">
                <CardContent className="flex gap-3 py-4">
                  <Icon className="h-5 w-5 shrink-0 text-muted-foreground" />
                  <div>
                    <p className="font-medium">{title}</p>
                    <p className="text-sm text-muted-foreground">{desc}</p>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </section>

      {isDeveloper && (
        <section className="space-y-4">
          <h2 className="text-lg font-semibold">Быстрый старт</h2>
          <Card>
            <CardContent className="pt-6">
              <ol className="space-y-2 text-sm text-muted-foreground list-decimal list-inside">
                <li><Link to="/projects" className="text-foreground underline">Создайте проект</Link> — один сайт = один проект</li>
                <li>Загрузите в проект ТЗ и брендбук (блок «Файлы»)</li>
                <li>Добавьте <Link to="/orders" className="text-foreground underline">заказы</Link> — страницы или этапы</li>
                <li>В заказе — правки, комментарии и файлы по конкретной части</li>
                <li>Общайтесь в <Link to="/messages" className="text-foreground underline">чате</Link> для оперативных вопросов</li>
              </ol>
            </CardContent>
          </Card>
        </section>
      )}
    </div>
  );
}
