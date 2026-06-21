import { useMemo, useState } from "react";
import {
  ArrowLeft,
  Camera,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  UserPlus,
  Users,
} from "lucide-react";
import type { ReworkItem, ReworkStatus, Worker } from "@/types";
import StatusBadge from "@/components/StatusBadge";
import PhotoInput from "@/components/PhotoInput";
import { useAppStore } from "@/store/useAppStore";
import { calcIsPass, getProcessByType } from "@/data/processData";

const FILTERS: { key: ReworkStatus | "all"; label: string }[] = [
  { key: "all", label: "全部" },
  { key: "pending", label: "待返工" },
  { key: "rechecking", label: "待复测" },
  { key: "passed", label: "已合格" },
];

function WorkerAvatar({ worker, size = "md" }: { worker?: Pick<Worker, "name" | "color"> | null; size?: "sm" | "md" | "lg" }) {
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

  const [filter, setFilter] = useState<ReworkStatus | "all">("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [recheckingId, setRecheckingId] = useState<string | null>(null);
  const [recheckValue, setRecheckValue] = useState<string>("");
  const [recheckPhoto, setRecheckPhoto] = useState<string | null>(null);
  const [workerSelectId, setWorkerSelectId] = useState<string | null>(null);
  const [newWorkerName, setNewWorkerName] = useState("");
  const [showAddWorker, setShowAddWorker] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const filtered = useMemo(() => {
    if (filter === "all") return reworks;
    return reworks.filter((r) => r.status === filter);
  }, [reworks, filter]);

  const pendingCount = reworks.filter((r) => r.status === "pending").length;
  const recheckCount = reworks.filter((r) => r.status === "rechecking").length;
  const passedCount = reworks.filter((r) => r.status === "passed").length;

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 2200);
  };

  const toggleExpand = (id: string) => setExpandedId((cur) => (cur === id ? null : id));

  const handleAssignWorker = (reworkId: string, worker: Worker) => {
    assignReworkWorker(reworkId, worker.id, worker.name);
    setWorkerSelectId(null);
    showToast(`已通知：${worker.name}`);
  };

  const handleMarkRechecking = (reworkId: string) => {
    updateReworkStatus(reworkId, "rechecking");
    showToast("已标记整改完成，等待复测");
  };

  const handleStartRecheck = (item: ReworkItem) => {
    setRecheckingId(item.id);
    setRecheckValue("");
    setRecheckPhoto(null);
  };

  const handleCancelRecheck = () => {
    setRecheckingId(null);
    setRecheckValue("");
    setRecheckPhoto(null);
  };

  const handleSubmitRecheck = () => {
    if (!recheckingId || recheckValue === "") return;
    const res = submitReworkRecheck(recheckingId, Number(recheckValue), recheckPhoto);
    if (res.passed) {
      showToast("✅ 复测合格，已关闭！");
    } else {
      showToast("⚠ 仍不合格，继续返工");
    }
    handleCancelRecheck();
  };

  const handleAddWorker = () => {
    const name = newWorkerName.trim();
    if (!name) return;
    const colors = ["#FF6B1A", "#27AE60", "#3498DB", "#9B59B6", "#F39C12", "#E91E63"];
    addWorker({
      name,
      skills: ["plastering", "tiling", "flooring", "masonry"],
      color: colors[workers.length % colors.length],
    });
    setNewWorkerName("");
    setShowAddWorker(false);
    showToast(`工人「${name}」已添加`);
  };

  const activeItem = reworks.find((r) => r.id === recheckingId);

  return (
    <div className="mx-auto max-w-2xl px-4 pt-6 pb-safe-bottom">
      <header className="mb-4">
        <h1 className="text-title-lg text-site-dark">返工清单</h1>
        <p className="mt-1 text-body-md text-site-darkLight">
          每日按清单追踪整改，复测合格后关闭
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

      <div className="mb-5 flex rounded-btn border-2 border-site-border bg-white p-1">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`segment-item rounded-lg transition-all ${
              filter === f.key
                ? "bg-site-orange text-white shadow-md"
                : "text-site-darkLight"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="card flex flex-col items-center justify-center gap-3 py-20">
          <CheckCircle2 size={64} className="text-site-pass" strokeWidth={2} />
          <p className="text-title-md font-bold text-site-dark">没有待处理项</p>
          <p className="text-body-md text-site-darkLight">全部整改合格，做得不错！</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((item) => {
            const assignedWorker = item.assignedWorkerId
              ? workers.find((w) => w.id === item.assignedWorkerId)
              : null;
            const expanded = expandedId === item.id;
            const process = getProcessByType(item.processType);

            return (
              <div
                key={item.id}
                className={`card overflow-hidden border-l-[6px] ${
                  item.status === "passed"
                    ? "border-l-site-pass"
                    : item.status === "rechecking"
                    ? "border-l-site-warn"
                    : "border-l-site-fail"
                }`}
              >
                <div className="flex items-start gap-3 p-4">
                  <div className="mt-0.5 shrink-0">
                    <WorkerAvatar worker={assignedWorker} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="mb-1 flex items-start justify-between gap-2">
                      <h3 className="text-title-md font-bold text-site-dark truncate">
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
                    <p className="mb-2 text-body-md font-medium text-site-darkLight">
                      {item.processName} · {item.date}
                    </p>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full bg-site-failBg px-3 py-1 text-body-md font-bold text-site-fail">
                        原值 {item.originalValue}
                        {item.unit}
                      </span>
                      <span className="rounded-full bg-gray-100 px-3 py-1 text-body-md font-medium text-site-darkLight">
                        允许 ±{item.allowDeviation}
                        {item.unit}
                      </span>
                      {item.deviationAmount > 0 && (
                        <span className="rounded-full bg-site-warnBg px-3 py-1 text-body-md font-bold text-site-warn">
                          超差 +{item.deviationAmount.toFixed(1)}
                          {item.unit}
                        </span>
                      )}
                    </div>
                    <div className="mt-3 flex items-center gap-2">
                      <Users size={16} className="text-site-darkLight" strokeWidth={2} />
                      <span className="text-body-md font-medium text-site-dark">
                        {assignedWorker ? `${assignedWorker.name} 负责` : "尚未指派工人"}
                      </span>
                    </div>
                  </div>
                </div>

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

                {expanded && (
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
                          <p className="text-body-lg font-semibold text-site-dark">
                            指定整改工人
                          </p>
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

                        {workerSelectId === item.id ? (
                          <div className="grid grid-cols-3 gap-2 rounded-btn bg-gray-50 p-3">
                            {workers.map((w) => (
                              <button
                                key={w.id}
                                onClick={() => handleAssignWorker(item.id, w)}
                                className="flex flex-col items-center gap-1.5 rounded-btn border border-site-border bg-white p-3 transition-all active:scale-95 active:border-site-orange"
                              >
                                <WorkerAvatar worker={w} size="sm" />
                                <span className="text-body-md font-semibold text-site-dark truncate w-full text-center">
                                  {w.name}
                                </span>
                              </button>
                            ))}
                            <button
                              onClick={() => setWorkerSelectId(null)}
                              className="col-span-3 mt-1 h-12 rounded-btn border border-site-border text-body-md font-semibold text-site-darkLight"
                            >
                              取消
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setWorkerSelectId(item.id)}
                            disabled={!assignedWorker}
                            className={`btn-secondary flex items-center justify-center gap-2 ${
                              assignedWorker ? "" : "!bg-site-orange !text-white !border-site-orange"
                            }`}
                          >
                            {assignedWorker ? "更换工人" : "指派工人 →"}
                          </button>
                        )}

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
          })}
        </div>
      )}

      {recheckingId && activeItem && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 backdrop-blur-sm sm:items-center">
          <div className="w-full max-w-2xl rounded-t-3xl bg-site-bg p-5 pb-safe-bottom animate-[slideUp_.25s_ease] sm:rounded-3xl sm:p-6">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-title-md font-bold text-site-dark">复测：{activeItem.itemName}</h2>
              <button
                onClick={handleCancelRecheck}
                className="flex h-11 w-11 items-center justify-center rounded-full bg-white shadow-card text-site-darkLight"
              >
                <ArrowLeft size={20} strokeWidth={2.5} />
              </button>
            </div>

            <div className="mb-4 card p-4 !shadow-none border border-site-border">
              <p className="mb-1 text-body-md font-semibold text-site-dark">标准参考</p>
              <p className="text-body-md text-site-darkLight">
                {activeItem.standardValue === 0
                  ? `允许偏差 ±${activeItem.allowDeviation}${activeItem.unit}`
                  : `标准 ${activeItem.standardValue}${activeItem.unit}，允许 ±${activeItem.allowDeviation}${activeItem.unit}`}
              </p>
              <p className="mt-2 text-body-md font-semibold text-site-fail">
                原不合格值：{activeItem.originalValue}{activeItem.unit}
              </p>
            </div>

            <div className="space-y-5">
              <div>
                <label className="mb-2 block text-body-lg font-semibold text-site-dark">
                  复测数值（{activeItem.unit}）
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
                            activeItem.standardValue,
                            activeItem.allowDeviation,
                          )
                          ? "!border-site-pass bg-site-passBg"
                          : "!border-site-fail bg-site-failBg"
                        : ""
                    }`}
                  />
                  <div className="-ml-14 w-11 text-body-lg font-bold text-site-darkLight">
                    {activeItem.unit}
                  </div>
                </div>
                {recheckValue !== "" && (
                  <p
                    className={`mt-2 text-body-md font-bold ${
                      calcIsPass(
                        Number(recheckValue),
                        activeItem.standardValue,
                        activeItem.allowDeviation,
                      )
                        ? "text-site-pass"
                        : "text-site-fail"
                    }`}
                  >
                    {calcIsPass(
                      Number(recheckValue),
                      activeItem.standardValue,
                      activeItem.allowDeviation,
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
      )}

      {toastMsg && (
        <div className="pointer-events-none fixed left-1/2 top-20 z-[60] -translate-x-1/2 rounded-full bg-site-dark/90 px-6 py-3 text-body-lg font-semibold text-white shadow-xl animate-[fadeIn_.2s_ease]">
          {toastMsg}
        </div>
      )}
    </div>
  );
}
