import { useMemo, useState } from "react";
import {
  AlertCircle,
  ArrowLeft,
  Camera,
  CheckCircle2,
  Circle,
  CircleDot,
  Info,
  ListChecks,
  Send,
  Wrench,
  Hammer,
  Brush,
  BrickWall,
} from "lucide-react";
import { PROCESS_LIST, calcIsPass, getProcessByType } from "@/data/processData";
import type { MeasurementRecord, ProcessType } from "@/types";
import MeasureDiagram from "@/components/MeasureDiagram";
import PhotoInput from "@/components/PhotoInput";
import StatusBadge from "@/components/StatusBadge";
import { useAppStore } from "@/store/useAppStore";

const ICONS: Record<ProcessType, React.ReactNode> = {
  plastering: <Brush size={36} strokeWidth={2} />,
  tiling: <BrickWall size={36} strokeWidth={2} />,
  flooring: <Hammer size={36} strokeWidth={2} />,
  masonry: <Wrench size={36} strokeWidth={2} />,
};

type Step = "select" | "input";

function initRecords(processType: ProcessType): MeasurementRecord[] {
  const p = getProcessByType(processType)!;
  return p.items.map((item) => ({
    id: `m_${Date.now()}_${item.id}_${Math.random().toString(36).slice(2, 6)}`,
    itemDefId: item.id,
    itemName: item.name,
    unit: item.unit,
    measuredValue: null,
    standardValue: item.standardValue,
    allowDeviation: item.allowDeviation,
    photo: null,
    repairedOnSite: null,
    isPass: null,
  }));
}

type CompletionStatus = "complete" | "incomplete" | "empty";

function getCompletion(r: MeasurementRecord): CompletionStatus {
  const hasValue = r.measuredValue != null;
  const hasPhoto = r.photo != null;
  const hasRepair = r.repairedOnSite != null;
  if (hasValue && hasPhoto && hasRepair) return "complete";
  if (!hasValue && !hasPhoto && !hasRepair) return "empty";
  return "incomplete";
}

export default function ChecklistPage() {
  const [step, setStep] = useState<Step>("select");
  const [processType, setProcessType] = useState<ProcessType | null>(null);
  const [records, setRecords] = useState<MeasurementRecord[]>([]);
  const [showResult, setShowResult] = useState<{ pass: number; fail: number } | null>(null);
  const [leaderName, setLeaderName] = useState(useAppStore.getState().teamLeader);
  const submitInspection = useAppStore((s) => s.submitInspection);
  const setTeamLeader = useAppStore((s) => s.setTeamLeader);

  const process = useMemo(
    () => (processType ? getProcessByType(processType) : undefined),
    [processType],
  );

  const computedRecords = useMemo(
    () =>
      records.map((r) => {
        const isPass = r.measuredValue != null
          ? calcIsPass(r.measuredValue, r.standardValue, r.allowDeviation)
          : null;
        return { ...r, isPass };
      }),
    [records],
  );

  const completeCount = computedRecords.filter(
    (r) => getCompletion(r) === "complete",
  ).length;
  const canSubmit = completeCount === computedRecords.length;

  const missingList = useMemo(() => {
    return computedRecords
      .map((r, i) => {
        const miss: string[] = [];
        if (r.measuredValue == null) miss.push("测量值");
        if (r.photo == null) miss.push("现场照片");
        if (r.repairedOnSite == null) miss.push("修补状态");
        return { idx: i + 1, name: r.itemName, miss };
      })
      .filter((x) => x.miss.length > 0);
  }, [computedRecords]);

  const handleSelectProcess = (type: ProcessType) => {
    setProcessType(type);
    setRecords(initRecords(type));
    setStep("input");
    setShowResult(null);
  };

  const handleBack = () => {
    setStep("select");
    setProcessType(null);
    setRecords([]);
    setShowResult(null);
  };

  const updateRecord = (id: string, patch: Partial<MeasurementRecord>) => {
    setRecords((rs) => rs.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  };

  const handleSubmit = () => {
    if (!processType || !canSubmit) return;
    const enriched = computedRecords.map((r) => ({
      ...r,
      repairedOnSite: r.repairedOnSite ?? false,
      isPass: r.measuredValue != null
        ? calcIsPass(r.measuredValue, r.standardValue, r.allowDeviation)
        : false,
    }));
    submitInspection(processType, enriched);
    if (leaderName.trim()) setTeamLeader(leaderName.trim());
    const pass = enriched.filter((r) => r.isPass).length;
    const fail = enriched.length - pass;
    setShowResult({ pass, fail });
  };

  const handleContinue = () => {
    handleBack();
  };

  if (showResult) {
    return (
      <div className="mx-auto max-w-2xl px-4 pt-8 pb-safe-bottom">
        <div className="card p-8 text-center">
          <div className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-site-passBg">
            <CheckCircle2 size={60} className="text-site-pass" strokeWidth={2.5} />
          </div>
          <h2 className="mb-2 text-title-md text-site-dark">自检已提交</h2>
          <p className="mb-6 text-body-md text-site-darkLight">
            {process?.name} · {computedRecords.length} 项检测
          </p>

          <div className="mb-8 grid grid-cols-2 gap-4">
            <div className="rounded-btn bg-site-passBg p-5">
              <div className="text-title-lg font-bold text-site-pass">{showResult.pass}</div>
              <div className="text-body-md font-semibold text-site-darkLight">✓ 合格</div>
            </div>
            <div
              className={`rounded-btn p-5 ${
                showResult.fail > 0 ? "bg-site-failBg" : "bg-gray-100"
              }`}
            >
              <div
                className={`text-title-lg font-bold ${
                  showResult.fail > 0 ? "text-site-fail" : "text-gray-400"
                }`}
              >
                {showResult.fail}
              </div>
              <div className="text-body-md font-semibold text-site-darkLight">
                ✗ 超差待返工
              </div>
            </div>
          </div>

          {showResult.fail > 0 && (
            <div className="mb-6 rounded-btn bg-site-warnBg p-4 text-left">
              <p className="text-body-md font-semibold text-site-warn">
                ⚠ 超差点已加入「返工清单」
              </p>
              <p className="mt-1 text-body-md text-site-darkLight">
                明天记得按清单复测，并通知对应工人整改
              </p>
            </div>
          )}

          <button onClick={handleContinue} className="btn-primary">
            继续自检
          </button>
        </div>
      </div>
    );
  }

  if (step === "select") {
    return (
      <div className="mx-auto max-w-2xl px-4 pt-6 pb-safe-bottom">
        <header className="mb-6">
          <h1 className="text-title-lg text-site-dark">今日自检</h1>
          <p className="mt-1 text-body-md text-site-darkLight">
            选择今日负责的工序，每天收工前检查
          </p>
        </header>

        <div className="mb-5">
          <label className="mb-2 block text-body-md font-semibold text-site-dark">
            班组长姓名
          </label>
          <input
            type="text"
            value={leaderName}
            onChange={(e) => setLeaderName(e.target.value)}
            placeholder="请输入姓名"
            className="input-num"
          />
        </div>

        <h3 className="mb-3 text-body-lg font-semibold text-site-dark">选择工序</h3>

        <div className="grid grid-cols-2 gap-4">
          {PROCESS_LIST.map((p) => (
            <button
              key={p.type}
              onClick={() => handleSelectProcess(p.type)}
              className={`card flex min-h-[150px] flex-col items-center justify-center gap-3 p-5 transition-all active:scale-[0.97] ${p.bgColor}`}
            >
              <div className={`flex h-16 w-16 items-center justify-center rounded-2xl ${p.color} text-white shadow-md`}>
                {ICONS[p.type]}
              </div>
              <div className="text-center">
                <div className="text-title-md font-bold text-site-dark">{p.name}</div>
                <div className="mt-0.5 text-body-md font-medium text-site-darkLight">
                  {p.items.length} 项检测
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 pt-4 pb-safe-bottom">
      <header className="mb-4 flex items-center gap-3">
        <button
          onClick={handleBack}
          className="flex h-12 w-12 items-center justify-center rounded-full bg-white shadow-card transition-transform active:scale-90"
          aria-label="返回"
        >
          <ArrowLeft size={22} strokeWidth={2.5} className="text-site-dark" />
        </button>
        <div className="flex-1">
          <h1 className="text-title-md text-site-dark">{process?.name} · 自检</h1>
          <p className="text-body-md text-site-darkLight">
            共 {computedRecords.length} 项 · 已完成 {completeCount} 项
          </p>
        </div>
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-site-passBg text-site-pass">
          <ListChecks size={22} strokeWidth={2.5} />
        </div>
      </header>

      {!canSubmit && (
        <div className="mb-4 rounded-btn border-2 border-site-warn/40 bg-site-warnBg p-4">
          <div className="flex items-start gap-3">
            <AlertCircle size={24} className="mt-0.5 shrink-0 text-site-warn" strokeWidth={2.5} />
            <div className="flex-1">
              <p className="text-body-lg font-bold text-site-dark">还需补齐以下内容</p>
              <ul className="mt-2 space-y-1.5">
                {missingList.slice(0, 3).map((m) => (
                  <li key={m.idx} className="text-body-md font-medium text-site-darkLight">
                    <span className="font-bold text-site-warn">第{m.idx}项</span> {m.name}：
                    <span className="text-site-fail"> 缺{m.miss.join("、")}</span>
                  </li>
                ))}
                {missingList.length > 3 && (
                  <li className="text-body-md font-medium text-site-darkLight">
                    …还有 {missingList.length - 3} 项未完成
                  </li>
                )}
              </ul>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-5">
        {computedRecords.map((rec, idx) => {
          const item = process!.items[idx];
          const status = getCompletion(rec);
          const rangeLabel =
            item.standardValue === 0
              ? `偏差允许 ±${item.allowDeviation}${item.unit}`
              : `标准 ${item.standardValue}${item.unit}，允许 ±${item.allowDeviation}${item.unit}`;

          const borderClass =
            status === "complete"
              ? "border-l-[6px] border-l-site-pass"
              : status === "incomplete"
              ? "border-l-[6px] border-l-site-warn"
              : "border-l-[6px] border-l-gray-300";

          return (
            <div key={rec.id} className={`card overflow-hidden ${borderClass}`}>
              <div className="border-b border-site-border bg-gray-50/80 px-5 py-4">
                <div className="mb-1.5 flex items-start justify-between gap-2">
                  <h3 className="text-title-md font-bold text-site-dark">
                    {idx + 1}. {rec.itemName}
                  </h3>
                  {status === "complete" ? (
                    <StatusBadge type={rec.isPass ? "pass" : "fail"} />
                  ) : (
                    <div className="flex items-center gap-1 rounded-full bg-site-warnBg px-3 py-1 font-semibold text-site-warn">
                      <CircleDot size={16} strokeWidth={2.5} />
                      待补齐
                    </div>
                  )}
                </div>
                <p className="text-body-md font-medium text-site-warn">⚠ {rangeLabel}</p>
                {status !== "complete" && (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {rec.measuredValue == null && (
                      <span className="rounded-md bg-site-fail/10 px-2 py-0.5 text-xs font-bold text-site-fail">
                        缺测量值
                      </span>
                    )}
                    {rec.photo == null && (
                      <span className="rounded-md bg-site-fail/10 px-2 py-0.5 text-xs font-bold text-site-fail">
                        缺照片
                      </span>
                    )}
                    {rec.repairedOnSite == null && (
                      <span className="rounded-md bg-site-fail/10 px-2 py-0.5 text-xs font-bold text-site-fail">
                        缺修补状态
                      </span>
                    )}
                  </div>
                )}
              </div>

              <div className="space-y-4 p-5">
                <div className="overflow-hidden rounded-card bg-gradient-to-br from-gray-50 to-white border border-site-border">
                  <MeasureDiagram type={item.diagram} className="w-full aspect-square" />
                  <div className="border-t border-site-border bg-gray-50/70 px-4 py-3">
                    <div className="flex items-start gap-2 text-body-md text-site-darkLight">
                      <Info size={18} className="mt-0.5 shrink-0 text-site-orange" strokeWidth={2.2} />
                      <div>
                        <p className="font-semibold text-site-dark">使用工具：{item.tool}</p>
                        <p className="mt-0.5">{item.description}</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="mb-2 flex items-center gap-2 text-body-lg font-semibold text-site-dark">
                    测量数值（{rec.unit}）
                    {rec.measuredValue == null && (
                      <span className="text-xs font-bold text-site-fail">*必填</span>
                    )}
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      type="number"
                      step="0.1"
                      inputMode="decimal"
                      value={rec.measuredValue ?? ""}
                      onChange={(e) =>
                        updateRecord(rec.id, {
                          measuredValue: e.target.value === "" ? null : Number(e.target.value),
                        })
                      }
                      placeholder="请输入测量值"
                      className={`input-num flex-1 text-right pr-16 ${
                        rec.isPass === false
                          ? "!border-site-fail bg-site-failBg"
                          : rec.isPass === true
                          ? "!border-site-pass bg-site-passBg"
                          : ""
                      }`}
                    />
                    <div className="-ml-14 w-11 text-body-lg font-bold text-site-darkLight">
                      {rec.unit}
                    </div>
                  </div>
                  {rec.isPass === false && (
                    <p className="mt-2 text-body-md font-semibold text-site-fail">
                      ✗ 已超差，需安排工人返工
                    </p>
                  )}
                </div>

                <div>
                  <div className="mb-2 flex items-center gap-2">
                    <Camera size={20} className="text-site-orange" strokeWidth={2} />
                    <p className="text-body-lg font-semibold text-site-dark">现场照片</p>
                    {rec.photo == null && (
                      <span className="text-xs font-bold text-site-fail">*必拍</span>
                    )}
                  </div>
                  <PhotoInput
                    value={rec.photo}
                    onChange={(v) => updateRecord(rec.id, { photo: v })}
                  />
                </div>

                <div>
                  <div className="mb-2 flex items-center gap-2">
                    <CheckCircle2 size={20} className="text-site-orange" strokeWidth={2} />
                    <p className="text-body-lg font-semibold text-site-dark">
                      是否当场修补？
                    </p>
                    {rec.repairedOnSite == null && (
                      <span className="text-xs font-bold text-site-fail">*必选</span>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => updateRecord(rec.id, { repairedOnSite: true })}
                      className={`flex h-14 items-center justify-center gap-2 rounded-btn border-2 font-semibold text-btn-lg transition-all ${
                        rec.repairedOnSite === true
                          ? "border-site-pass bg-site-passBg text-site-pass"
                          : "border-site-border text-site-darkLight"
                      }`}
                    >
                      <CheckCircle2 size={22} strokeWidth={2.5} />
                      已修补
                    </button>
                    <button
                      type="button"
                      onClick={() => updateRecord(rec.id, { repairedOnSite: false })}
                      className={`flex h-14 items-center justify-center gap-2 rounded-btn border-2 font-semibold text-btn-lg transition-all ${
                        rec.repairedOnSite === false
                          ? "border-site-fail bg-site-failBg text-site-fail"
                          : "border-site-border text-site-darkLight"
                      }`}
                    >
                      <Circle size={22} strokeWidth={2.5} />
                      未修补
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}

        <button
          onClick={handleSubmit}
          disabled={!canSubmit}
          className={`btn-primary mb-2 flex items-center justify-center gap-2 ${
            !canSubmit ? "!bg-gray-300 !shadow-none" : ""
          }`}
        >
          <Send size={22} strokeWidth={2.5} />
          {canSubmit
            ? "提交自检"
            : `还缺 ${missingList.length} 项，补齐后提交`}
        </button>
      </div>
    </div>
  );
}
