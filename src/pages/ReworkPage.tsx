
import { useMemo, useState } from "react";
import {
  ArrowRight,
  Bell,
  Camera,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  UserPlus,
  Users,
  AlertTriangle,
  Flame,
  Minus,
  ListTodo,
  List,
  Clock,
  X,
} from "lucide-react";
import type { ReworkItem, ReworkStatus, Worker } from "@/types";
import StatusBadge from "@/components/StatusBadge";
import PhotoInput from "@/components/PhotoInput";
import { useAppStore } from "@/store/useAppStore";
import { calcIsPass } from "@/data/processData";

type ViewMode = "list" | "todo";
type GroupBy = "worker" | "process" | "severity";
type SeverityLevel = "severe" | "medium" | "mild";

const SEVERITY_LABEL: Record<SeverityLevel, { label: string; color: string; bg: string; icon: React.ReactNode }> = {
  severe: {
    label: "严重",
    color: "text-site-fail",
    bg: "bg-site-failBg",
    icon: <Flame size={18} strokeWidth={2.5} />,
  },
  medium: {
    label: "一般",
    color: "text-site-warn",
    bg: "bg-site-warnBg",
    icon: <AlertTriangle size={18} strokeWidth={2.5} />,
  },
  mild: {
    label: "轻微",
    color: "text-site-pass",
    bg: "bg-site-passBg",
    icon: <Minus size={18} strokeWidth={2.5} />,
  },
};

function getSeverity(item: ReworkItem): SeverityLevel {
  const ratio = item.allowDeviation > 0 ? item.deviationAmount / item.allowDeviation : 99;
  if (ratio > 1.5) return "severe";
  if (ratio > 0.5) return "medium";
  return "mild";
}

function WorkerAvatar({
  worker,
  size = "md",
}: {
  worker?: Pick<Worker, "name" | "color"> | null;
  size?: "sm" | "md" | "lg";
}) {
  const sizes = {
    sm: "h-8 w-8 text-body-md",
    md: "h-12 w-12 text-body-lg",
    lg: "h-14 w-14 text-title-md",
  };
  const name = worker?.name ?? "未指派";
  const color = worker?.color ?? "#95A5A6";
  return (
    <div
      className={`flex ${sizes[size]} shrink-0 items-center justify-center rounded-full font-bold text-white shadow-sm`}
      style={{ backgroundColor: color }}
    >
      {name.slice(-2)}
    </div>
  );
}

export default function ReworkPage() {
  const reworks = useAppStore((s) => s.reworks);
  const workers = useAppStore((s) => s.workers);
  const assignReworkWorker = useAppStore((s) => s.assignReworkWorker);
  const updateReworkStatus = useAppStore((s) => s.updateReworkStatus);
  const submitReworkRecheck = useAppStore((s) => s.submitReworkRecheck);
  const addWorker = useAppStore((s) => s.addWorker);
  const addNotification = useAppStore((s) => s.addNotification);

  const [viewMode, setViewMode] = useState<ViewMode>("todo");
  const [groupBy, setGroupBy] = useState<GroupBy>("worker");
  const [listFilter, setListFilter] = useState<ReworkStatus | "all">("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [detailItemId, setDetailItemId] = useState<string | null>(null);
  const [recheckValue, setRecheckValue] = useState("");
  const [recheckPhoto, setRecheckPhoto] = useState<string | null>(null);
  const [showWorkerSelect, setShowWorkerSelect] = useState(false);
  const [newWorkerName, setNewWorkerName] = useState("");
  const [showAddWorker, setShowAddWorker] = useState(false);
  const [notifyRemark, setNotifyRemark] = useState("");
  const [showNotifyInput, setShowNotifyInput] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());
  const [workerDoneMsg, setWorkerDoneMsg] = useState<string | null>(null);

  const pendingReworks = useMemo(
    () => reworks.filter((r) => r.status !== "passed"),
    [reworks],
  );

  const pendingCount = reworks.filter((r) => r.status === "pending").length;
  const recheckCount = reworks.filter((r) => r.status === "rechecking").length;
  const passedCount = reworks.filter((r) => r.status === "passed").length;

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 2200);
  };

  const toggleExpand = (id: string) =>
    setExpandedId((cur) => (cur === id ? null : id));

  const toggleGroup = (key: string) => {
    setCollapsedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const handleAssignWorker = (reworkId: string, worker: Worker) => {
    assignReworkWorker(reworkId, worker.id, worker.name);
    setShowWorkerSelect(false);
    showToast(`已指派：${worker.name}`);
  };

  const handleAddWorker = () => {
    const name = newWorkerName.trim();
    if (!name) return;
    const colors = [
      "#FF6B1A",
      "#27AE60",
      "#3498DB",
      "#9B59B6",
      "#F39C12",
      "#E91E63",
      "#1ABC9C",
    ];
    addWorker({
      name,
      skills: ["plastering", "tiling", "flooring", "masonry"],
      color: colors[workers.length % colors.length],
    });
    setNewWorkerName("");
    setShowAddWorker(false);
    showToast(`工人「${name}」已添加`);
  };

  const handleNotify = (item: ReworkItem) => {
    if (!item.assignedWorkerId || !item.assignedWorkerName) {
      showToast("请先指派工人");
      return;
    }
    addNotification(item.id, item.assignedWorkerId, item.assignedWorkerName, notifyRemark.trim());
    setNotifyRemark("");
    setShowNotifyInput(false);
    showToast(`已记录通知：${item.assignedWorkerName}`);
  };

  const handleStartRecheck = (item: ReworkItem) => {
    setDetailItemId(item.id);
    setRecheckValue("");
    setRecheckPhoto("");
    setShowWorkerSelect(false);
    setShowNotifyInput(false);
    setNotifyRemark("");
  };

  const handleCancelRecheck = () => {
    setDetailItemId(null);
    setRecheckValue("");
    setRecheckPhoto(null);
    setShowWorkerSelect(false);
    setShowNotifyInput(false);
  };

  const handleSubmitRecheck = () => {
    if (!detailItemId || recheckValue === "") return;
    const res = submitReworkRecheck(detailItemId, Number(recheckValue), recheckPhoto);
    setDetailItemId(null);
    setRecheckValue("");
    setRecheckPhoto(null);
    setShowWorkerSelect(false);
    setShowNotifyInput(false);

    if (res.passed) {
      showToast("✅ 复测合格，已关闭！");
      if (res.assignedWorkerId) {
        const nextItem = reworks.find(
          (r) =>
            r.id !== detailItemId &&
            r.assignedWorkerId === res.assignedWorkerId &&
            r.status !== "passed",
        );
        if (nextItem) {
          setTimeout(() => handleStartRecheck(nextItem), 600);
        } else {
          const worker = workers.find((w) => w.id === res.assignedWorkerId);
          setWorkerDoneMsg(worker ? `${worker.name} 的待办已全部处理完` : "该工人所有待办已处理完");
          setTimeout(() => setWorkerDoneMsg(null), 3000);
        }
      }
    } else {
      showToast("⚠ 仍不合格，继续返工");
    }
  };

  const handleMarkRechecking = (reworkId: string) => {
    updateReworkStatus(reworkId, "rechecking");
    showToast("已标记整改完成，等待复测");
  };

  const detailItem = detailItemId ? reworks.find((r) => r.id === detailItemId) : null;

  const groupedData = useMemo(() => {
    const groups = new Map<string, { key: string; title: string; subtitle?: string; items: ReworkItem[]; icon?: React.ReactNode }>();

    pendingReworks.forEach((item) => {
      let key = "";
      let title = "";
      let subtitle = "";
      let icon: React.ReactNode = null;

      if (groupBy === "worker") {
        const w = workers.find((x) => x.id === item.assignedWorkerId);
        key = item.assignedWorkerId ?? "unassigned";
        title = w?.name ?? "未指派工人";
        subtitle = w ? "" : "请尽快指派";
        icon = <WorkerAvatar worker={w} size="sm" />;
      } else if (groupBy === "process") {
        key = item.processType;
        title = item.processName;
        subtitle = `${pendingReworks.filter((x) => x.processType === item.processType).length} 项待处理`;
      } else {
        const sev = getSeverity(item);
        const cfg = SEVERITY_LABEL[sev];
        key = sev;
        title = cfg.label + "超差";
        icon = <span className={cfg.color}>{cfg.icon}</span>;
      }

      if (!groups.has(key)) {
        groups.set(key, { key, title, subtitle, items: [], icon });
      }
      groups.get(key)!.items.push(item);
    });

    groups.forEach((g) => {
      g.items.sort((a, b) => {
        const sevOrder = { severe: 0, medium: 1, mild: 2 };
        return sevOrder[getSeverity(a)] - sevOrder[getSeverity(b)];
      });
    });

    const sorted = Array.from(groups.values());
    if (groupBy === "severity") {
      const sevOrder = { severe: 0, medium: 1, mild: 2 };
      sorted.sort((a, b) => sevOrder[a.key as SeverityLevel] - sevOrder[b.key as SeverityLevel]);
    } else {
      sorted.sort((a, b) => b.items.length - a.items.length);
    }
    return sorted;
  }, [pendingReworks, groupBy, workers]);

  const renderReworkCard = (item: ReworkItem, compact = false) => {
    const assignedWorker = item.assignedWorkerId
      ? workers.find((w) => w.id === item.assignedWorkerId)
      : null;
    const expanded = expandedId === item.id;
    const sev = getSeverity(item);
    const sevCfg = SEVERITY_LABEL[sev];

    return (
      <div
        key={item.id}
        className={`card overflow-hidden border-l-[6px] ${
          item.status === "passed"
            ? "border-l-site-pass"
            : item.status === "rechecking"
            ? "border-l-site-warn"
            : sev === "severe"
            ? "border-l-site-fail"
            : sev === "medium"
            ? "border-l-site-warn"
            : "border-l-site-pass"
        }`}
      >
        <div className={`flex items-start gap-3 ${compact ? "p-3" : "p-4"}`}>
          <div className="mt-0.5 shrink-0">
            <WorkerAvatar worker={assignedWorker} size={compact ? "sm" : "md"} />
          </div>
          <div className="min-w-0 flex-1">
            <div className="mb-1 flex items-start justify-between gap-2">
              <h3 className={`font-bold text-site-dark ${compact ? "text-body-lg" : "text-title-md"}`}>
                {item.itemName}
              </h3>
              <StatusBadge
                type={
                  item.status === "passed"
                    ? "done"
                    : item.status === "rechecking"
                    ? "rechecking"
                    : "pending"
                }
              />
            </div>
            <p className={`mb-2 font-medium text-site-darkLight ${compact ? "text-sm" : "text-body-md"}`}>
              {item.processName} · {item.date}
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-site-failBg px-3 py-1 text-body-md font-bold text-site-fail">
                原值 {item.originalValue}
                {item.unit}
              </span>
              <span className={`rounded-full px-3 py-1 text-body-md font-bold ${sevCfg.bg} ${sevCfg.color}`}>
                超差 {item.deviationAmount.toFixed(1)}
                {item.unit}
              </span>
              {item.notifications.length > 0 && (
                <span className="rounded-full bg-site-orange/10 px-2 py-0.5 text-xs font-bold text-site-orange">
                  <Bell size={12} className="inline mr-0.5" />已通知{item.notifications.length}次
                </span>
              )}
            </div>
            {!compact && (
              <div className="mt-3 flex items-center gap-2">
                <Users size={16} className="text-site-darkLight" strokeWidth={2} />
                <span className="text-body-md font-medium text-site-dark">
                  {assignedWorker ? (
                    <>
                      <span className="text-site-orange font-bold">{assignedWorker.name}</span> 负责整改
                    </>
                  ) : (
                    <span className="text-site-fail font-semibold">尚未指派工人</span>
                  )}
                </span>
              </div>
            )}
          </div>
        </div>

        {!compact && (
          <button
            onClick={() => toggleExpand(item.id)}
            className="flex w-full items-center justify-center gap-1 border-t border-site-border bg-gray-50/60 py-3 text-body-md font-semibold text-site-darkLight"
          >
            {expanded ? (
              <>
                <ChevronUp size={18} strokeWidth={2.5} /> 收起详情
              </>
            ) : (
              <>
                <ChevronDown size={18} strokeWidth={2.5} /> 展开详情 / 操作
              </>
            )}
          </button>
        )}

        {expanded && !compact && (
          <div className="space-y-4 border-t border-site-border bg-white p-4">
            {item.photo && (
              <div>
                <p className="mb-2 text-body-md font-semibold text-site-dark">问题现场图</p>
                <img
                  src={item.photo}
                  alt="问题照片"
                  className="h-44 w-full rounded-btn object-cover border border-site-border"
                />
              </div>
            )}

            {item.status === "pending" && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-body-lg font-semibold text-site-dark">整改工人</p>
                  <button
                    onClick={() => setShowAddWorker((s) => !s)}
                    className="flex items-center gap-1 text-body-md font-semibold text-site-orange"
                  >
                    <UserPlus size={18} strokeWidth={2.5} /> 添加工人
                  </button>
                </div>

                {showAddWorker && (
                  <div className="flex gap-2 rounded-btn bg-gray-50 p-3">
                    <input
                      type="text"
                      value={newWorkerName}
                      onChange={(e) => setNewWorkerName(e.target.value)}
                      placeholder="输入工人姓名"
                      className="h-12 flex-1 rounded-btn border border-site-border bg-white px-4 text-body-lg outline-none focus:border-site-orange"
                    />
                    <button
                      onClick={handleAddWorker}
                      className="h-12 rounded-btn bg-site-orange px-5 text-btn-lg font-semibold text-white"
                    >
                      确认
                    </button>
                  </div>
                )}

                {showWorkerSelect ? (
                  <div className="grid grid-cols-3 gap-2 rounded-btn bg-gray-50 p-3">
                    {workers.map((w) => {
                      const isMatch = w.skills.includes(item.processType);
                      return (
                        <button
                          key={w.id}
                          onClick={() => handleAssignWorker(item.id, w)}
                          className={`flex flex-col items-center gap-1.5 rounded-btn border-2 bg-white p-3 transition-all active:scale-95 ${
                            isMatch ? "border-site-orange/60" : "border-site-border opacity-60"
                          }`}
                        >
                          <WorkerAvatar worker={w} size="sm" />
                          <span className="text-body-md font-semibold text-site-dark truncate w-full text-center">
                            {w.name}
                          </span>
                          {isMatch && (
                            <span className="rounded-full bg-site-orange/10 px-2 py-0.5 text-xs font-bold text-site-orange">
                              擅长
                            </span>
                          )}
                        </button>
                      );
                    })}
                    <button
                      onClick={() => setShowWorkerSelect(false)}
                      className="col-span-3 mt-1 h-12 rounded-btn border border-site-border text-body-md font-semibold text-site-darkLight"
                    >
                      取消
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setShowWorkerSelect(true)}
                    className="btn-secondary flex items-center justify-center gap-2"
                  >
                    <Users size={20} strokeWidth={2.5} />
                    {assignedWorker ? "更换工人" : "指派工人 →"}
                  </button>
                )}

                <div className="rounded-btn border border-site-border bg-gray-50/60 p-3 space-y-3">
                  <p className="text-body-md font-semibold text-site-dark flex items-center gap-2">
                    <Bell size={18} className="text-site-orange" strokeWidth={2.5} />
                    通知工人
                  </p>
                  {item.notifications.length > 0 && (
                    <div className="space-y-2">
                      {item.notifications.map((n) => (
                        <div key={n.id} className="flex items-start gap-2 rounded-lg bg-white p-2.5 border border-site-border">
                          <Clock size={14} className="mt-0.5 shrink-0 text-site-darkLight" strokeWidth={2} />
                          <div className="text-body-md">
                            <span className="font-semibold text-site-dark">{n.workerName}</span>
                            <span className="text-site-darkLight"> · {n.time}</span>
                            {n.remark && <p className="text-site-darkLight mt-0.5">{n.remark}</p>}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  {showNotifyInput ? (
                    <div className="space-y-2">
                      <input
                        type="text"
                        value={notifyRemark}
                        onChange={(e) => setNotifyRemark(e.target.value)}
                        placeholder="备注（选填，如：明天上午来修）"
                        className="h-12 w-full rounded-btn border border-site-border bg-white px-4 text-body-lg outline-none focus:border-site-orange"
                      />
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          onClick={() => { setShowNotifyInput(false); setNotifyRemark(""); }}
                          className="h-11 rounded-btn border border-site-border text-body-md font-semibold text-site-darkLight"
                        >
                          取消
                        </button>
                        <button
                          onClick={() => handleNotify(item)}
                          disabled={!item.assignedWorkerId}
                          className={`h-11 rounded-btn bg-site-orange text-btn-lg font-semibold text-white ${!item.assignedWorkerId ? "!bg-gray-300" : ""}`}
                        >
                          确认通知
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => setShowNotifyInput(true)}
                      disabled={!assignedWorker}
                      className={`btn-secondary flex items-center justify-center gap-2 ${!assignedWorker ? "!bg-gray-100 !text-gray-400" : ""}`}
                    >
                      <Bell size={18} strokeWidth={2.5} />
                      记录通知
                    </button>
                  )}
                </div>

                <button
                  onClick={() => handleMarkRechecking(item.id)}
                  disabled={!assignedWorker}
                  className={`btn-success flex items-center justify-center gap-2 ${
                    !assignedWorker ? "!bg-gray-300" : ""
                  }`}
                >
                  <RefreshCw size={22} strokeWidth={2.5} />
                  工人已整改，申请复测
                </button>
              </div>
            )}

            {(item.status === "rechecking" || item.status === "pending") && (
              <button
                onClick={() => handleStartRecheck(item)}
                className="btn-primary flex items-center justify-center gap-2"
              >
                <Camera size={22} strokeWidth={2.5} />
                现在去复测
              </button>
            )}

            {item.status === "passed" && item.recheckDate && (
              <div className="rounded-btn bg-site-passBg p-4">
                <div className="flex items-center gap-2 text-site-pass">
                  <CheckCircle2 size={22} strokeWidth={2.5} />
                  <span className="text-body-lg font-bold">复测合格，已关闭</span>
                </div>
                <p className="mt-2 text-body-md text-site-darkLight">
                  复测值：<b className="text-site-pass">{item.recheckValue}{item.unit}</b>
                  {" · "}日期：{item.recheckDate}
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="mx-auto max-w-2xl px-4 pt-6 pb-safe-bottom">
      <header className="mb-4">
        <h1 className="text-title-lg text-site-dark">返工清单</h1>
        <p className="mt-1 text-body-md text-site-darkLight">
          按清单追踪整改，复测合格后关闭
        </p>
      </header>

      <div className="mb-5 grid grid-cols-3 gap-3">
        <div className="card bg-site-failBg !shadow-none p-3 text-center border border-site-fail/20">
          <div className="text-title-md font-bold text-site-fail">{pendingCount}</div>
          <div className="text-body-md font-medium text-site-darkLight">待返工</div>
        </div>
        <div className="card bg-site-warnBg !shadow-none p-3 text-center border border-site-warn/20">
          <div className="text-title-md font-bold text-site-warn">{recheckCount}</div>
          <div className="text-body-md font-medium text-site-darkLight">待复测</div>
        </div>
        <div className="card bg-site-passBg !shadow-none p-3 text-center border border-site-pass/20">
          <div className="text-title-md font-bold text-site-pass">{passedCount}</div>
          <div className="text-body-md font-medium text-site-darkLight">已合格</div>
        </div>
      </div>

      <div className="mb-4 flex rounded-btn border-2 border-site-border bg-white p-1">
        <button
          onClick={() => setViewMode("todo")}
          className={`segment-item flex items-center justify-center gap-1.5 rounded-lg ${
            viewMode === "todo" ? "bg-site-orange text-white shadow-md" : "text-site-darkLight"
          }`}
        >
          <ListTodo size={18} strokeWidth={2.5} />
          明日待办
        </button>
        <button
          onClick={() => setViewMode("list")}
          className={`segment-item flex items-center justify-center gap-1.5 rounded-lg ${
            viewMode === "list" ? "bg-site-orange text-white shadow-md" : "text-site-darkLight"
          }`}
        >
          <List size={18} strokeWidth={2.5} />
          全部列表
        </button>
      </div>

      {viewMode === "list" && (
        <div className="mb-4 flex rounded-btn border-2 border-site-border bg-white p-1">
          {[
            { key: "all" as const, label: "全部" },
            { key: "pending" as const, label: "待返工" },
            { key: "rechecking" as const, label: "待复测" },
            { key: "passed" as const, label: "已合格" },
          ].map((f) => (
            <button
              key={f.key}
              onClick={() => setListFilter(f.key)}
              className={`segment-item rounded-lg ${
                listFilter === f.key ? "bg-site-dark text-white" : "text-site-darkLight"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      )}

      {viewMode === "todo" && (
        <div className="mb-4 flex rounded-btn border-2 border-site-border bg-white p-1">
          {[
            { key: "worker" as const, label: "按工人", icon: <Users size={16} strokeWidth={2} /> },
            { key: "process" as const, label: "按工序", icon: <Clock size={16} strokeWidth={2} /> },
            { key: "severity" as const, label: "按严重度", icon: <AlertTriangle size={16} strokeWidth={2} /> },
          ].map((g) => (
            <button
              key={g.key}
              onClick={() => setGroupBy(g.key)}
              className={`segment-item flex items-center justify-center gap-1 rounded-lg ${
                groupBy === g.key ? "bg-site-dark text-white" : "text-site-darkLight"
              }`}
            >
              {g.icon}
              {g.label}
            </button>
          ))}
        </div>
      )}

      {viewMode === "todo" ? (
        <>
          {pendingReworks.length === 0 ? (
            <div className="card flex flex-col items-center justify-center gap-3 py-20">
              <CheckCircle2 size={64} className="text-site-pass" strokeWidth={2} />
              <p className="text-title-md font-bold text-site-dark">没有待处理项</p>
              <p className="text-body-md text-site-darkLight">全部整改合格，做得不错！</p>
            </div>
          ) : (
            <div className="space-y-5">
              {groupedData.map((g) => {
                const collapsed = collapsedGroups.has(g.key);
                return (
                  <div key={g.key} className="card overflow-hidden">
                    <button
                      onClick={() => toggleGroup(g.key)}
                      className="flex w-full items-center gap-3 border-b border-site-border bg-gray-50/80 px-4 py-4 text-left"
                    >
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white shadow-sm">
                        {g.icon ?? <ListTodo size={20} className="text-site-orange" strokeWidth={2.5} />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-title-md font-bold text-site-dark">{g.title}</h3>
                        {g.subtitle && (
                          <p className="text-body-md font-medium text-site-darkLight">
                            {g.subtitle}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="rounded-full bg-site-orange px-3 py-1 text-body-md font-bold text-white">
                          {g.items.length} 项
                        </span>
                        {collapsed ? (
                          <ChevronDown size={22} strokeWidth={2.5} className="text-site-darkLight" />
                        ) : (
                          <ChevronUp size={22} strokeWidth={2.5} className="text-site-darkLight" />
                        )}
                      </div>
                    </button>

                    {!collapsed && (
                      <div className="divide-y divide-site-border/60 bg-white">
                        {g.items.map((item) => {
                          const assignedWorker = item.assignedWorkerId
                            ? workers.find((w) => w.id === item.assignedWorkerId)
                            : null;
                          const sev = getSeverity(item);
                          const sevCfg = SEVERITY_LABEL[sev];
                          return (
                            <button
                              key={item.id}
                              onClick={() => handleStartRecheck(item)}
                              className="flex w-full items-center gap-3 p-3 text-left transition-all active:bg-gray-50"
                            >
                              <WorkerAvatar worker={assignedWorker} size="sm" />
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center justify-between gap-2">
                                  <h4 className="text-body-lg font-bold text-site-dark truncate">
                                    {item.itemName}
                                  </h4>
                                  <StatusBadge
                                    type={
                                      item.status === "rechecking" ? "rechecking" : "pending"
                                    }
                                  />
                                </div>
                                <div className="mt-1 flex flex-wrap items-center gap-2">
                                  <span className="text-body-md font-medium text-site-darkLight">
                                    {item.processName}
                                  </span>
                                  <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${sevCfg.bg} ${sevCfg.color}`}>
                                    {sevCfg.label}
                                  </span>
                                  <span className="text-body-md font-bold text-site-fail">
                                    +{item.deviationAmount.toFixed(1)}{item.unit}
                                  </span>
                                  {assignedWorker && (
                                    <span className="text-body-md font-semibold text-site-orange">
                                      {assignedWorker.name}
                                    </span>
                                  )}
                                </div>
                              </div>
                              <ArrowRight size={18} className="shrink-0 text-site-darkLight" strokeWidth={2} />
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
              <p className="pt-2 text-center text-body-md text-site-darkLight">
                💡 点待办项可直接复测
              </p>
            </div>
          )}
        </>
      ) : (
        <div className="space-y-4">
          {(listFilter === "all"
            ? reworks
            : reworks.filter((r) => r.status === listFilter)
          ).length === 0 ? (
            <div className="card flex flex-col items-center justify-center gap-3 py-20">
              <ListTodo size={64} className="text-site-darkLight" strokeWidth={1.5} />
              <p className="text-title-md font-bold text-site-dark">暂无记录</p>
              <p className="text-body-md text-site-darkLight">
                去「今日自检」录入数据后会自动生成
              </p>
            </div>
          ) : (
            (listFilter === "all" ? reworks : reworks.filter((r) => r.status === listFilter)).map(
              (item) => renderReworkCard(item),
            )
          )}
        </div>
      )}

      {detailItemId && detailItem && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 backdrop-blur-sm sm:items-center">
          <div className="w-full max-w-2xl max-h-[92vh] overflow-y-auto rounded-t-3xl bg-site-bg pb-safe-bottom animate-[slideUp_.25s_ease] sm:rounded-3xl">
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-site-border bg-site-bg/95 backdrop-blur px-5 py-4">
              <h2 className="text-title-md font-bold text-site-dark">
                {detailItem.itemName}
              </h2>
              <button
                onClick={handleCancelRecheck}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 text-site-dark transition-transform active:scale-90"
              >
                <X size={20} strokeWidth={2.5} />
              </button>
            </div>

            <div className="space-y-5 p-5">
              <div className="card p-4 !shadow-none border border-site-border">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <StatusBadge
                        type={
                          detailItem.status === "rechecking" ? "rechecking" : "pending"
                        }
                      />
                      <span className="text-body-md font-semibold text-site-darkLight">
                        {detailItem.processName}
                      </span>
                    </div>
                    <p className="text-body-md text-site-darkLight">
                      {detailItem.standardValue === 0
                        ? `允许偏差 ±${detailItem.allowDeviation}${detailItem.unit}`
                        : `标准 ${detailItem.standardValue}${detailItem.unit}，允许 ±${detailItem.allowDeviation}${detailItem.unit}`}
                    </p>
                    <p className="mt-2 text-body-md font-semibold text-site-fail">
                      原不合格值：{detailItem.originalValue}{detailItem.unit}
                      {" · "}超差 +{detailItem.deviationAmount.toFixed(1)}{detailItem.unit}
                    </p>
                  </div>
                  {(() => {
                    const sev = getSeverity(detailItem);
                    const cfg = SEVERITY_LABEL[sev];
                    return (
                      <span className={`shrink-0 rounded-full px-3 py-1.5 text-body-md font-bold ${cfg.bg} ${cfg.color}`}>
                        {cfg.label}
                      </span>
                    );
                  })()}
                </div>
              </div>

              {detailItem.photo && (
                <div>
                  <p className="mb-2 text-body-md font-semibold text-site-fail flex items-center gap-1">
                    <Camera size={16} strokeWidth={2} /> 超差现场照片
                  </p>
                  <img
                    src={detailItem.photo}
                    alt="超差照片"
                    className="h-44 w-full rounded-btn object-cover border border-site-fail/30"
                  />
                </div>
              )}

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-body-lg font-semibold text-site-dark">整改工人</p>
                  <button
                    onClick={() => setShowAddWorker((s) => !s)}
                    className="flex items-center gap-1 text-body-md font-semibold text-site-orange"
                  >
                    <UserPlus size={18} strokeWidth={2.5} /> 添加
                  </button>
                </div>

                {showAddWorker && (
                  <div className="flex gap-2 rounded-btn bg-gray-50 p-3">
                    <input
                      type="text"
                      value={newWorkerName}
                      onChange={(e) => setNewWorkerName(e.target.value)}
                      placeholder="输入工人姓名"
                      className="h-12 flex-1 rounded-btn border border-site-border bg-white px-4 text-body-lg outline-none focus:border-site-orange"
                    />
                    <button
                      onClick={handleAddWorker}
                      className="h-12 rounded-btn bg-site-orange px-5 text-btn-lg font-semibold text-white"
                    >
                      确认
                    </button>
                  </div>
                )}

                {showWorkerSelect ? (
                  <div className="grid grid-cols-3 gap-2 rounded-btn bg-gray-50 p-3">
                    {workers.map((w) => {
                      const isMatch = w.skills.includes(detailItem.processType);
                      return (
                        <button
                          key={w.id}
                          onClick={() => handleAssignWorker(detailItem.id, w)}
                          className={`flex flex-col items-center gap-1.5 rounded-btn border-2 bg-white p-3 transition-all active:scale-95 ${
                            isMatch ? "border-site-orange/60" : "border-site-border opacity-60"
                          }`}
                        >
                          <WorkerAvatar worker={w} size="sm" />
                          <span className="text-body-md font-semibold text-site-dark truncate w-full text-center">
                            {w.name}
                          </span>
                          {isMatch && (
                            <span className="rounded-full bg-site-orange/10 px-2 py-0.5 text-xs font-bold text-site-orange">
                              擅长
                            </span>
                          )}
                        </button>
                      );
                    })}
                    <button
                      onClick={() => setShowWorkerSelect(false)}
                      className="col-span-3 mt-1 h-12 rounded-btn border border-site-border text-body-md font-semibold text-site-darkLight"
                    >
                      取消
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setShowWorkerSelect(true)}
                    className="btn-secondary flex items-center justify-center gap-2"
                  >
                    <Users size={20} strokeWidth={2.5} />
                    {detailItem.assignedWorkerName ? "更换工人" : "指派工人 →"}
                  </button>
                )}
              </div>

              <div className="rounded-btn border border-site-border bg-gray-50/60 p-3 space-y-3">
                <p className="text-body-md font-semibold text-site-dark flex items-center gap-2">
                  <Bell size={18} className="text-site-orange" strokeWidth={2.5} />
                  通知记录
                </p>
                {detailItem.notifications.length > 0 && (
                  <div className="space-y-2">
                    {detailItem.notifications.map((n) => (
                      <div key={n.id} className="flex items-start gap-2 rounded-lg bg-white p-2.5 border border-site-border">
                        <Clock size={14} className="mt-0.5 shrink-0 text-site-darkLight" strokeWidth={2} />
                        <div className="text-body-md">
                          <span className="font-semibold text-site-dark">{n.workerName}</span>
                          <span className="text-site-darkLight"> · {n.time}</span>
                          {n.remark && <p className="text-site-darkLight mt-0.5">{n.remark}</p>}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                {showNotifyInput ? (
                  <div className="space-y-2">
                    <input
                      type="text"
                      value={notifyRemark}
                      onChange={(e) => setNotifyRemark(e.target.value)}
                      placeholder="备注（选填，如：明天上午来修）"
                      className="h-12 w-full rounded-btn border border-site-border bg-white px-4 text-body-lg outline-none focus:border-site-orange"
                    />
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => { setShowNotifyInput(false); setNotifyRemark(""); }}
                        className="h-11 rounded-btn border border-site-border text-body-md font-semibold text-site-darkLight"
                      >
                        取消
                      </button>
                      <button
                        onClick={() => handleNotify(detailItem)}
                        disabled={!detailItem.assignedWorkerId}
                        className={`h-11 rounded-btn bg-site-orange text-btn-lg font-semibold text-white ${!detailItem.assignedWorkerId ? "!bg-gray-300" : ""}`}
                      >
                        确认通知
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => setShowNotifyInput(true)}
                    disabled={!detailItem.assignedWorkerId}
                    className={`btn-secondary flex items-center justify-center gap-2 ${!detailItem.assignedWorkerId ? "!bg-gray-100 !text-gray-400" : ""}`}
                  >
                    <Bell size={18} strokeWidth={2.5} />
                    记录通知
                  </button>
                )}
              </div>

              <div className="border-t border-site-border pt-4 space-y-4">
                <div>
                  <label className="mb-2 block text-body-lg font-semibold text-site-dark">
                    复测数值（{detailItem.unit}）
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      type="number"
                      step="0.1"
                      inputMode="decimal"
                      autoFocus
                      value={recheckValue}
                      onChange={(e) => setRecheckValue(e.target.value)}
                      placeholder="请输入复测值"
                      className={`input-num flex-1 text-right pr-16 ${
                        recheckValue !== ""
                          ? calcIsPass(
                              Number(recheckValue),
                              detailItem.standardValue,
                              detailItem.allowDeviation,
                            )
                            ? "!border-site-pass bg-site-passBg"
                            : "!border-site-fail bg-site-failBg"
                          : ""
                      }`}
                    />
                    <div className="-ml-14 w-11 text-body-lg font-bold text-site-darkLight">
                      {detailItem.unit}
                    </div>
                  </div>
                  {recheckValue !== "" && (
                    <p
                      className={`mt-2 text-body-md font-bold ${
                        calcIsPass(
                          Number(recheckValue),
                          detailItem.standardValue,
                          detailItem.allowDeviation,
                        )
                          ? "text-site-pass"
                          : "text-site-fail"
                      }`}
                    >
                      {calcIsPass(
                        Number(recheckValue),
                        detailItem.standardValue,
                        detailItem.allowDeviation,
                      )
                        ? "✅ 本次复测合格，可以关闭"
                        : "❌ 仍不合格，需继续返工"}
                    </p>
                  )}
                </div>

                <PhotoInput
                  value={recheckPhoto}
                  onChange={setRecheckPhoto}
                  label="拍整改后照片"
                />

                <div className="grid grid-cols-2 gap-3 pt-1">
                  <button onClick={handleCancelRecheck} className="btn-secondary">
                    取消
                  </button>
                  <button
                    onClick={handleSubmitRecheck}
                    disabled={recheckValue === ""}
                    className={`btn-success flex items-center justify-center gap-2 ${
                      recheckValue === "" ? "!bg-gray-300" : ""
                    }`}
                  >
                    <CheckCircle2 size={22} strokeWidth={2.5} />
                    提交复测
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {toastMsg && (
        <div className="pointer-events-none fixed left-1/2 top-20 z-[60] -translate-x-1/2 rounded-full bg-site-dark/90 px-6 py-3 text-body-lg font-semibold text-white shadow-xl animate-[fadeIn_.2s_ease]">
          {toastMsg}
        </div>
      )}

      {workerDoneMsg && (
        <div className="pointer-events-none fixed left-1/2 top-32 z-[60] -translate-x-1/2 rounded-btn bg-site-pass px-6 py-3 text-body-lg font-bold text-white shadow-xl animate-[fadeIn_.2s_ease]">
          🎉 {workerDoneMsg}
        </div>
      )}
    </div>
  );
}
