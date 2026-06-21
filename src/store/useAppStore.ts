import { create } from "zustand";
import { persist } from "zustand/middleware";
import type {
  AppState,
  DailyInspection,
  MeasurementRecord,
  ProcessType,
  ReworkItem,
  ReworkStatus,
  Worker,
} from "@/types";
import {
  DEFAULT_TEAM_LEADER,
  DEFAULT_WORKERS,
  calcDeviation,
  calcIsPass,
  getProcessByType,
} from "@/data/processData";

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

function todayStr(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

interface AppStore extends AppState {
  setTeamLeader: (name: string) => void;
  addWorker: (worker: Omit<Worker, "id">) => void;
  submitInspection: (
    processType: ProcessType,
    measurements: MeasurementRecord[],
  ) => DailyInspection;
  assignReworkWorker: (reworkId: string, workerId: string, workerName: string) => void;
  updateReworkStatus: (reworkId: string, status: ReworkStatus) => void;
  submitReworkRecheck: (
    reworkId: string,
    recheckValue: number,
    recheckPhoto: string | null,
  ) => { passed: boolean };
  addReworkManually: (rework: Omit<ReworkItem, "id">) => void;
}

export const useAppStore = create<AppStore>()(
  persist(
    (set, get) => ({
      workers: DEFAULT_WORKERS,
      inspections: [],
      reworks: [],
      teamLeader: DEFAULT_TEAM_LEADER,

      setTeamLeader: (name) => set({ teamLeader: name }),

      addWorker: (worker) =>
        set((s) => ({
          workers: [...s.workers, { ...worker, id: generateId() }],
        })),

      submitInspection: (processType, measurements) => {
        const process = getProcessByType(processType);
        if (!process) throw new Error("Unknown process");

        const enrichedMeasurements: MeasurementRecord[] = measurements.map((m) => {
          const isPass = m.measuredValue != null
            ? calcIsPass(m.measuredValue, m.standardValue, m.allowDeviation)
            : null;
          return { ...m, isPass };
        });

        const inspection: DailyInspection = {
          id: generateId(),
          date: todayStr(),
          processType,
          processName: process.name,
          teamLeader: get().teamLeader,
          measurements: enrichedMeasurements,
          createdAt: Date.now(),
        };

        const workers = get().workers;
        const matchedWorkers = workers.filter((w) => w.skills.includes(processType));
        const suggestedWorker = matchedWorkers[0] ?? null;

        const newReworks: ReworkItem[] = enrichedMeasurements
          .filter((m) => m.isPass === false)
          .map((m) => {
            const devAmount = m.measuredValue != null
              ? calcDeviation(m.measuredValue, m.standardValue, m.allowDeviation)
              : 0;
            return {
              id: generateId(),
              sourceRecordId: inspection.id,
              date: todayStr(),
              processType,
              processName: process.name,
              itemName: m.itemName,
              unit: m.unit,
              originalValue: m.measuredValue!,
              standardValue: m.standardValue,
              allowDeviation: m.allowDeviation,
              deviationAmount: devAmount,
              photo: m.photo,
              assignedWorkerId: suggestedWorker?.id ?? null,
              assignedWorkerName: suggestedWorker?.name ?? null,
              status: "pending",
              recheckValue: null,
              recheckPhoto: null,
              recheckDate: null,
            } satisfies ReworkItem;
          });

        set((s) => ({
          inspections: [inspection, ...s.inspections],
          reworks: [...newReworks, ...s.reworks],
        }));

        return inspection;
      },

      assignReworkWorker: (reworkId, workerId, workerName) =>
        set((s) => ({
          reworks: s.reworks.map((r) =>
            r.id === reworkId
              ? { ...r, assignedWorkerId: workerId, assignedWorkerName: workerName }
              : r,
          ),
        })),

      updateReworkStatus: (reworkId, status) =>
        set((s) => ({
          reworks: s.reworks.map((r) => (r.id === reworkId ? { ...r, status } : r)),
        })),

      submitReworkRecheck: (reworkId, recheckValue, recheckPhoto) => {
        const rework = get().reworks.find((r) => r.id === reworkId);
        if (!rework) return { passed: false };

        const passed = calcIsPass(recheckValue, rework.standardValue, rework.allowDeviation);
        const newStatus: ReworkStatus = passed ? "passed" : "pending";

        set((s) => ({
          reworks: s.reworks.map((r) =>
            r.id === reworkId
              ? {
                  ...r,
                  recheckValue,
                  recheckPhoto,
                  recheckDate: todayStr(),
                  status: newStatus,
                }
              : r,
          ),
        }));

        return { passed };
      },

      addReworkManually: (rework) =>
        set((s) => ({
          reworks: [{ ...rework, id: generateId() }, ...s.reworks],
        })),
    }),
    {
      name: "qc-checklist-store",
      version: 1,
    },
  ),
);
