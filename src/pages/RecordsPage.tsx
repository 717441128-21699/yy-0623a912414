import { useMemo, useState } from "react";
import {
  Bell,
  Calendar,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ClipboardCheck,
  Image as ImageIcon,
  X,
  User,
  Clock,
  ArrowRight,
  BadgeCheck,
  RefreshCcwDot,
  CameraOff,
  Camera,
} from "lucide-react";
import { useAppStore } from "@/store/useAppStore";
import type { NotificationRecord, Worker } from "@/types";
import StatusBadge from "@/components/StatusBadge";

type RecordSource = "inspection" | "rework";

interface PassedRecordItem {
  id: string;
  source: RecordSource;
  itemName: string;
  unit: string;
  processName: string;
  processType: string;
  date: string;
  teamLeader: string;
  measuredValue: number | null;
  standardValue: number;
  allowDeviation: number;
  photo: string | null;
  repairedOnSite: boolean;
  originalValue?: number;
  recheckValue?: number;
  recheckPhoto?: string | null;
  recheckDate?: string;
  assignedWorkerName?: string | null;
  assignedWorker?: Worker | null;
  deviationAmount?: number;
  notifications?: NotificationRecord[];
}

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

export default function RecordsPage() {
  const inspections = useAppStore((s) => s.inspections);
  const reworks = useAppStore((s) => s.reworks);
  const workers = useAppStore((s) => s.workers);
  const teamLeader = useAppStore((s) => s.teamLeader);

  const [selectedDate, setSelectedDate] = useState(todayStr());
  const [viewMode, setViewMode] = useState<"day" | "all">("day");
  const [detailItem, setDetailItem] = useState<PassedRecordItem | null>(null);

  const grouped = useMemo(() => {
    const map = new Map<
      string,
      {
        date: string;
        inspections: typeof inspections;
        passCount: number;
        totalCount: number;
        reworkClosedCount: number;
      }
    >();

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

  const allPassedItems = useMemo<PassedRecordItem[]>(() => {
    const items: PassedRecordItem[] = [];

    inspections.forEach((insp) => {
      insp.measurements.forEach((m) => {
        if (m.isPass) {
          items.push({
            id: `insp_${insp.id}_${m.id}`,
            source: "inspection",
            itemName: m.itemName,
            unit: m.unit,
            processName: insp.processName,
            processType: insp.processType,
            date: insp.date,
            teamLeader: insp.teamLeader,
            measuredValue: m.measuredValue,
            standardValue: m.standardValue,
            allowDeviation: m.allowDeviation,
            photo: m.photo,
            repairedOnSite: m.repairedOnSite ?? false,
          });
        }
      });
    });

    reworks.forEach((r) => {
      if (r.status === "passed" && r.recheckDate) {
        const w = r.assignedWorkerId ? workers.find((x) => x.id === r.assignedWorkerId) ?? null : null;
        items.push({
          id: `rew_${r.id}`,
          source: "rework",
          itemName: r.itemName,
          unit: r.unit,
          processName: r.processName,
          processType: r.processType,
          date: r.recheckDate,
          teamLeader: teamLeader,
          measuredValue: r.recheckValue,
          standardValue: r.standardValue,
          allowDeviation: r.allowDeviation,
          photo: r.photo,
          repairedOnSite: true,
          originalValue: r.originalValue,
          recheckValue: r.recheckValue,
          recheckPhoto: r.recheckPhoto,
          recheckDate: r.recheckDate,
          assignedWorkerName: r.assignedWorkerName,
          assignedWorker: w,
          deviationAmount: r.deviationAmount,
          notifications: r.notifications,
        });
      }
    });

    return items.sort((a, b) => (a.date < b.date ? 1 : -1));
  }, [inspections, reworks, workers, teamLeader]);

  const displayedItems =
    viewMode === "day"
      ? allPassedItems.filter((i) => i.date === selectedDate)
      : allPassedItems;

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
  const todayData = grouped.find((g) => g.date === selectedDate);

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
          {displayedItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setDetailItem(item)}
              className="card w-full overflow-hidden border-l-[5px] border-l-site-pass text-left transition-all active:scale-[0.98]"
            >
              <div className="flex gap-3 p-4">
                <div className="flex h-14 w-14 shrink-0 flex-col items-center justify-center rounded-2xl bg-site-passBg">
                  {item.source === "rework" ? (
                    <RefreshCcwDot size={26} className="text-site-pass" strokeWidth={2.5} />
                  ) : (
                    <CheckCircle2 size={30} className="text-site-pass" strokeWidth={2.5} />
                  )}
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
                    <span>
                      {viewMode === "all"
                        ? item.date.slice(5)
                        : formatDateCN(item.date).slice(5)}
                    </span>
                  </div>
                  <div className="mt-2 flex items-center gap-2">
                    {item.source === "rework" ? (
                      <StatusBadge type="done" text="复测合格" />
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-3 py-1 text-body-md font-semibold text-site-darkLight">
                        <BadgeCheck size={16} strokeWidth={2.5} />
                        一次合格
                      </span>
                    )}
                    {item.photo && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-3 py-1 text-body-md font-semibold text-site-darkLight">
                        <ImageIcon size={16} strokeWidth={2} />
                        有照片
                      </span>
                    )}
                  </div>
                </div>
                <ChevronRight size={22} strokeWidth={2.5} className="mt-5 text-site-darkLight" />
              </div>
            </button>
          ))}
        </div>
      )}

      {detailItem && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm sm:items-center"
          onClick={() => setDetailItem(null)}
        >
          <div
            className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-t-3xl bg-site-bg pb-safe-bottom animate-[slideUp_.25s_ease] sm:rounded-3xl sm:p-0"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-site-border bg-site-bg/95 backdrop-blur px-5 py-4">
              <h2 className="text-title-md font-bold text-site-dark">记录详情</h2>
              <button
                onClick={() => setDetailItem(null)}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 text-site-dark transition-transform active:scale-90"
              >
                <X size={20} strokeWidth={2.5} />
              </button>
            </div>

            <div className="space-y-5 p-5">
              <div className="card overflow-hidden !shadow-none border border-site-border">
                <div className="border-b border-site-border bg-gray-50/80 px-5 py-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="text-title-md font-bold text-site-dark">
                        {detailItem.itemName}
                      </h3>
                      <p className="mt-1 text-body-md font-medium text-site-darkLight">
                        {detailItem.processName} · {detailItem.date}
                      </p>
                    </div>
                    <StatusBadge
                      type={detailItem.source === "rework" ? "done" : "pass"}
                      text={detailItem.source === "rework" ? "复测合格" : "一次合格"}
                    />
                  </div>
                </div>
                <div className="space-y-3 px-5 py-4">
                  <div className="flex justify-between">
                    <span className="text-body-md text-site-darkLight">标准值</span>
                    <span className="text-body-lg font-bold text-site-dark">
                      {detailItem.standardValue}
                      {detailItem.unit}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-body-md text-site-darkLight">允许偏差</span>
                    <span className="text-body-lg font-bold text-site-dark">
                      ±{detailItem.allowDeviation}
                      {detailItem.unit}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-body-md text-site-darkLight">最终合格值</span>
                    <span className="text-body-lg font-bold text-site-pass">
                      {detailItem.measuredValue}
                      {detailItem.unit}
                    </span>
                  </div>
                  {detailItem.repairedOnSite && (
                    <div className="flex justify-between">
                      <span className="text-body-md text-site-darkLight">修补情况</span>
                      <span className="text-body-lg font-bold text-site-warn">已当场修补</span>
                    </div>
                  )}
                </div>
              </div>

              {detailItem.source === "rework" && (
                <div className="card overflow-hidden !shadow-none border-2 border-site-warn/40 bg-site-warnBg/30">
                  <div className="border-b border-site-warn/20 bg-site-warnBg/60 px-5 py-3">
                    <h4 className="text-body-lg font-bold text-site-warn flex items-center gap-2">
                      <RefreshCcwDot size={20} strokeWidth={2.5} />
                      返工追溯
                    </h4>
                  </div>
                  <div className="space-y-3 px-5 py-4">
                    {detailItem.originalValue != null && (
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-body-md text-site-darkLight shrink-0">原始超差值</span>
                        <div className="flex items-center gap-2">
                          <span className="text-body-lg font-bold text-site-fail">
                            {detailItem.originalValue}
                            {detailItem.unit}
                          </span>
                          <ArrowRight size={18} className="text-site-darkLight" strokeWidth={2} />
                          <span className="text-body-lg font-bold text-site-pass">
                            {detailItem.recheckValue}
                            {detailItem.unit}
                          </span>
                        </div>
                      </div>
                    )}
                    {detailItem.deviationAmount != null && detailItem.deviationAmount > 0 && (
                      <div className="flex justify-between">
                        <span className="text-body-md text-site-darkLight">原超差量</span>
                        <span className="text-body-lg font-bold text-site-fail">
                          +{detailItem.deviationAmount.toFixed(1)}
                          {detailItem.unit}
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-body-md text-site-darkLight">整改工人</span>
                      <span className="text-body-lg font-bold text-site-dark flex items-center gap-2">
                        {detailItem.assignedWorker ? (
                          <>
                            <span
                              className="inline-block h-4 w-4 rounded-full"
                              style={{ backgroundColor: detailItem.assignedWorker.color }}
                            />
                            {detailItem.assignedWorkerName}
                          </>
                        ) : (
                          <span className="text-site-darkLight">未记录</span>
                        )}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-body-md text-site-darkLight">复测关闭日期</span>
                      <span className="text-body-lg font-bold text-site-pass flex items-center gap-2">
                        <Clock size={18} strokeWidth={2} />
                        {detailItem.recheckDate}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {detailItem.source === "rework" && (
                <div>
                  <h4 className="mb-3 text-body-lg font-bold text-site-dark flex items-center gap-2">
                    <ImageIcon size={20} strokeWidth={2} className="text-site-orange" />
                    整改前后照片对比
                  </h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <p className="text-body-md font-semibold text-site-fail text-center flex items-center justify-center gap-1">
                        <Camera size={14} strokeWidth={2} />
                        整改前（超差时）
                      </p>
                      <div className="overflow-hidden rounded-btn border-2 border-site-fail/40">
                        {detailItem.photo ? (
                          <img
                            src={detailItem.photo}
                            alt="整改前照片"
                            className="w-full aspect-square object-cover"
                          />
                        ) : (
                          <div className="flex aspect-square w-full flex-col items-center justify-center gap-2 bg-site-failBg/40">
                            <CameraOff size={32} className="text-site-fail/50" strokeWidth={1.5} />
                            <span className="text-body-md font-bold text-site-fail">未留存超差照片</span>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <p className="text-body-md font-semibold text-site-pass text-center flex items-center justify-center gap-1">
                        <CheckCircle2 size={14} strokeWidth={2} />
                        整改后（复测时）
                      </p>
                      <div className="overflow-hidden rounded-btn border-2 border-site-pass/40">
                        {detailItem.recheckPhoto ? (
                          <img
                            src={detailItem.recheckPhoto}
                            alt="整改后照片"
                            className="w-full aspect-square object-cover"
                          />
                        ) : (
                          <div className="flex aspect-square w-full flex-col items-center justify-center gap-2 bg-site-passBg/40">
                            <CameraOff size={32} className="text-site-pass/50" strokeWidth={1.5} />
                            <span className="text-body-md font-bold text-site-pass">未留存复测照片</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  {!detailItem.photo && !detailItem.recheckPhoto && (
                    <p className="mt-2 text-center text-body-md font-semibold text-site-fail">
                      ⚠ 两张照片均未留存，请后续注意拍照留证
                    </p>
                  )}
                </div>
              )}

              {detailItem.source === "inspection" && (
                <div>
                  <h4 className="mb-3 text-body-lg font-bold text-site-dark flex items-center gap-2">
                    <ImageIcon size={20} strokeWidth={2} className="text-site-orange" />
                    现场照片
                  </h4>
                  <div className="overflow-hidden rounded-btn border border-site-border">
                    {detailItem.photo ? (
                      <img
                        src={detailItem.photo}
                        alt="现场照片"
                        className="w-full max-h-80 object-cover"
                      />
                    ) : (
                      <div className="flex h-48 w-full flex-col items-center justify-center gap-2 bg-gray-50">
                        <CameraOff size={32} className="text-site-darkLight/50" strokeWidth={1.5} />
                        <span className="text-body-md font-semibold text-site-darkLight">未留存现场照片</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {detailItem.source === "rework" && detailItem.notifications && detailItem.notifications.length > 0 && (
                <div className="card overflow-hidden !shadow-none border border-site-border">
                  <div className="border-b border-site-border bg-gray-50/80 px-5 py-3">
                    <h4 className="text-body-lg font-bold text-site-dark flex items-center gap-2">
                      <Bell size={20} className="text-site-orange" strokeWidth={2.5} />
                      通知记录
                    </h4>
                  </div>
                  <div className="divide-y divide-site-border/60 px-5 py-3">
                    {detailItem.notifications.map((n) => (
                      <div key={n.id} className="flex items-start gap-3 py-3 first:pt-0 last:pb-0">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-site-orange/10">
                          <Bell size={14} className="text-site-orange" strokeWidth={2} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-body-md font-bold text-site-dark">{n.workerName}</span>
                            <span className="text-body-md text-site-darkLight">{n.time}</span>
                          </div>
                          {n.remark && (
                            <p className="mt-0.5 text-body-md text-site-darkLight">{n.remark}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="card !shadow-none border border-site-border p-4">
                <div className="flex items-start gap-3">
                  <User size={22} strokeWidth={2} className="mt-0.5 text-site-orange shrink-0" />
                  <div>
                    <p className="text-body-md text-site-darkLight">班组长</p>
                    <p className="text-body-lg font-bold text-site-dark">
                      {detailItem.teamLeader}
                    </p>
                  </div>
                </div>
              </div>

              <button
                onClick={() => setDetailItem(null)}
                className="btn-primary"
              >
                关闭
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
