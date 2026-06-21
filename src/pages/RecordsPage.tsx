import { useMemo, useState } from "react";
import { Calendar, CheckCircle2, ChevronLeft, ChevronRight, ClipboardCheck, Image as ImageIcon } from "lucide-react";
import { useAppStore } from "@/store/useAppStore";
import type { DailyInspection, MeasurementRecord } from "@/types";

function formatDateCN(dateStr: string): string {
  const [y, m, d] = dateStr.split("-");
  return `${y}年${Number(m)}月${Number(d)}日`;
}

function todayStr(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function shiftDate(dateStr: string, days: number): string {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + days);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

interface GroupedData {
  date: string;
  inspections: DailyInspection[];
  passCount: number;
  totalCount: number;
  reworkClosedCount: number;
}

export default function RecordsPage() {
  const inspections = useAppStore((s) => s.inspections);
  const reworks = useAppStore((s) => s.reworks);
  const teamLeader = useAppStore((s) => s.teamLeader);

  const [selectedDate, setSelectedDate] = useState(todayStr());
  const [viewMode, setViewMode] = useState<"day" | "all">("day");

  const grouped = useMemo(() => {
    const map = new Map<string, GroupedData>();

    inspections.forEach((insp) => {
      if (!map.has(insp.date)) {
        const rewClosed = reworks.filter(
          (r) => r.recheckDate === insp.date && r.status === "passed",
        ).length;
        map.set(insp.date, {
          date: insp.date,
          inspections: [],
          passCount: 0,
          totalCount: 0,
          reworkClosedCount: rewClosed,
        });
      }
      const g = map.get(insp.date)!;
      g.inspections.push(insp);
      insp.measurements.forEach((m) => {
        g.totalCount++;
        if (m.isPass) g.passCount++;
      });
    });

    return Array.from(map.values()).sort((a, b) => (a.date < b.date ? 1 : -1));
  }, [inspections, reworks]);

  const todayData = grouped.find((g) => g.date === selectedDate);
  const allPassedItems = useMemo(() => {
    const items: (MeasurementRecord & {
      processName: string;
      processType: string;
      date: string;
      teamLeader: string;
    })[] = [];
    inspections.forEach((insp) => {
      insp.measurements.forEach((m) => {
        if (m.isPass) {
          items.push({
            ...m,
            processName: insp.processName,
            processType: insp.processType,
            date: insp.date,
            teamLeader: insp.teamLeader,
          });
        }
      });
    });
    reworks.forEach((r) => {
      if (r.status === "passed" && r.recheckDate) {
        items.push({
          id: r.id,
          itemDefId: "",
          itemName: r.itemName,
          unit: r.unit,
          measuredValue: r.recheckValue,
          standardValue: r.standardValue,
          allowDeviation: r.allowDeviation,
          photo: r.recheckPhoto ?? r.photo,
          repairedOnSite: true,
          isPass: true,
          processName: r.processName + "(复测)",
          processType: r.processType,
          date: r.recheckDate,
          teamLeader: teamLeader,
        });
      }
    });
    return items.sort((a, b) => (a.date < b.date ? 1 : -1));
  }, [inspections, reworks, teamLeader]);

  const displayedItems =
    viewMode === "day" ? allPassedItems.filter((i) => i.date === selectedDate) : allPassedItems;

  const totalStats = useMemo(() => {
    const total = inspections.reduce((s, i) => s + i.measurements.length, 0);
    const pass = inspections.reduce(
      (s, i) => s + i.measurements.filter((m) => m.isPass).length,
      0,
    );
    const rewPassed = reworks.filter((r) => r.status === "passed").length;
    return { total, pass, rewPassed, inspections: inspections.length };
  }, [inspections, reworks]);

  const dateList = useMemo(() => grouped.map((g) => g.date), [grouped]);
  const hasDataOnDate = dateList.includes(selectedDate);

  return (
    <div className="mx-auto max-w-2xl px-4 pt-6 pb-safe-bottom">
      <header className="mb-5">
        <h1 className="text-title-lg text-site-dark">合格记录</h1>
        <p className="mt-1 text-body-md text-site-darkLight">
          所有自检合格项与复测关闭项，可追溯
        </p>
      </header>

      <div className="mb-5 grid grid-cols-2 gap-3">
        <div className="card bg-site-passBg !shadow-none p-4 text-center border border-site-pass/20">
          <div className="text-title-lg font-bold text-site-pass">
            {totalStats.pass + totalStats.rewPassed}
          </div>
          <div className="text-body-md font-medium text-site-darkLight">累计合格项</div>
        </div>
        <div className="card bg-white p-4 text-center">
          <div className="text-title-lg font-bold text-site-dark">{totalStats.inspections}</div>
          <div className="text-body-md font-medium text-site-darkLight">自检批次</div>
        </div>
      </div>

      <div className="mb-4 flex rounded-btn border-2 border-site-border bg-white p-1">
        <button
          onClick={() => setViewMode("day")}
          className={`segment-item rounded-lg ${
            viewMode === "day" ? "bg-site-orange text-white shadow-md" : "text-site-darkLight"
          }`}
        >
          按日期
        </button>
        <button
          onClick={() => setViewMode("all")}
          className={`segment-item rounded-lg ${
            viewMode === "all" ? "bg-site-orange text-white shadow-md" : "text-site-darkLight"
          }`}
        >
          全部记录
        </button>
      </div>

      {viewMode === "day" && (
        <div className="mb-5 card p-4">
          <div className="mb-3 flex items-center justify-between">
            <button
              onClick={() => setSelectedDate((d) => shiftDate(d, -1))}
              className="flex h-11 w-11 items-center justify-center rounded-full bg-gray-100 transition-all active:scale-90"
              aria-label="前一天"
            >
              <ChevronLeft size={22} strokeWidth={2.5} className="text-site-dark" />
            </button>
            <div className="flex items-center gap-2">
              <Calendar size={20} strokeWidth={2} className="text-site-orange" />
              <span className="text-title-md font-bold text-site-dark">
                {formatDateCN(selectedDate)}
              </span>
            </div>
            <button
              onClick={() => setSelectedDate((d) => shiftDate(d, 1))}
              className="flex h-11 w-11 items-center justify-center rounded-full bg-gray-100 transition-all active:scale-90"
              aria-label="后一天"
            >
              <ChevronRight size={22} strokeWidth={2.5} className="text-site-dark" />
            </button>
          </div>

          <div className="flex flex-wrap gap-2">
            {dateList.slice(0, 7).map((d) => (
              <button
                key={d}
                onClick={() => setSelectedDate(d)}
                className={`rounded-full px-4 py-2 text-body-md font-semibold transition-all ${
                  d === selectedDate
                    ? "bg-site-orange text-white shadow-md"
                    : "bg-gray-100 text-site-darkLight"
                }`}
              >
                {d.slice(5)}
              </button>
            ))}
            <button
              onClick={() => setSelectedDate(todayStr())}
              className="ml-auto rounded-full border-2 border-site-orange px-4 py-2 text-body-md font-semibold text-site-orange"
            >
              今日
            </button>
          </div>

          {todayData && (
            <div className="mt-4 rounded-btn bg-site-passBg p-3 text-center">
              <p className="text-body-md font-semibold text-site-dark">
                {todayData.inspections.length} 个工序自检 · 合格率{" "}
                <span className="text-site-pass">
                  {todayData.totalCount > 0
                    ? Math.round((todayData.passCount / todayData.totalCount) * 100)
                    : 0}
                  %
                </span>
                {todayData.reworkClosedCount > 0 && (
                  <span className="ml-2 text-site-warn">
                    · 返工关闭 {todayData.reworkClosedCount} 项
                  </span>
                )}
              </p>
            </div>
          )}
        </div>
      )}

      {displayedItems.length === 0 ? (
        <div className="card flex flex-col items-center justify-center gap-3 py-20">
          <ClipboardCheck size={64} className="text-site-darkLight" strokeWidth={1.5} />
          <p className="text-title-md font-bold text-site-dark">
            {viewMode === "day" && !hasDataOnDate ? "当天暂无记录" : "暂无合格记录"}
          </p>
          <p className="text-body-md text-site-darkLight text-center px-8">
            {viewMode === "day"
              ? "切换日期或去「今日自检」录入数据吧"
              : "完成自检后，合格项会自动出现在这里"}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-body-md font-semibold text-site-darkLight pl-1">
            共 {displayedItems.length} 条合格记录
          </p>
          {displayedItems.map((item, idx) => (
            <div
              key={`${item.id}-${idx}`}
              className="card overflow-hidden border-l-[5px] border-l-site-pass"
            >
              <div className="flex gap-3 p-4">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-site-passBg">
                  <CheckCircle2 size={30} className="text-site-pass" strokeWidth={2.5} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="text-body-lg font-bold text-site-dark truncate">
                      {item.itemName}
                    </h3>
                    <span className="shrink-0 rounded-full bg-site-passBg px-2.5 py-0.5 text-body-md font-bold text-site-pass">
                      {item.measuredValue}
                      {item.unit}
                    </span>
                  </div>
                  <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-body-md text-site-darkLight">
                    <span className="font-semibold text-site-orange">{item.processName}</span>
                    <span>·</span>
                    <span>{viewMode === "all" ? item.date.slice(5) : formatDateCN(item.date).slice(5)}</span>
                    <span>·</span>
                    <span>{item.teamLeader}</span>
                  </div>
                  <p className="mt-1 text-body-md text-site-darkLight">
                    允许 ±{item.allowDeviation}
                    {item.unit}
                    {item.repairedOnSite && <span className="ml-2 text-site-warn">· 已修补</span>}
                  </p>
                </div>
              </div>
              {item.photo && (
                <div className="border-t border-site-border bg-gray-50/60 p-3">
                  <div className="relative inline-block">
                    <img
                      src={item.photo}
                      alt="现场照片"
                      className="h-24 w-32 rounded-btn object-cover border border-site-border"
                    />
                    <ImageIcon
                      size={16}
                      className="absolute bottom-1.5 right-1.5 text-white drop-shadow"
                      strokeWidth={2.5}
                    />
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
