export type ProcessType = "plastering" | "tiling" | "flooring" | "masonry";

export type DiagramType =
  | "plumb"
  | "level"
  | "rightAngle"
  | "line"
  | "tileHollow"
  | "tileGap"
  | "floorLevel"
  | "slope"
  | "axis"
  | "plumbLine"
  | "mortarJoint"
  | "doorWidth";

export interface MeasurementItemDef {
  id: string;
  name: string;
  unit: string;
  standardValue: number;
  allowDeviation: number;
  description: string;
  tool: string;
  diagram: DiagramType;
}

export interface ProcessDef {
  type: ProcessType;
  name: string;
  icon: string;
  color: string;
  bgColor: string;
  items: MeasurementItemDef[];
}

export interface MeasurementRecord {
  id: string;
  itemDefId: string;
  itemName: string;
  unit: string;
  measuredValue: number | null;
  standardValue: number;
  allowDeviation: number;
  photo: string | null;
  repairedOnSite: boolean;
  isPass: boolean | null;
}

export interface DailyInspection {
  id: string;
  date: string;
  processType: ProcessType;
  processName: string;
  teamLeader: string;
  measurements: MeasurementRecord[];
  createdAt: number;
}

export type ReworkStatus = "pending" | "rechecking" | "passed";

export interface ReworkItem {
  id: string;
  sourceRecordId: string;
  date: string;
  processType: ProcessType;
  processName: string;
  itemName: string;
  unit: string;
  originalValue: number;
  standardValue: number;
  allowDeviation: number;
  deviationAmount: number;
  photo: string | null;
  assignedWorkerId: string | null;
  assignedWorkerName: string | null;
  status: ReworkStatus;
  recheckValue: number | null;
  recheckPhoto: string | null;
  recheckDate: string | null;
}

export interface Worker {
  id: string;
  name: string;
  skills: ProcessType[];
  color: string;
}

export interface AppState {
  workers: Worker[];
  inspections: DailyInspection[];
  reworks: ReworkItem[];
  teamLeader: string;
}
