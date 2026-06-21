import type { ProcessDef, Worker } from "@/types";

export const PROCESS_LIST: ProcessDef[] = [
  {
    type: "plastering",
    name: "抹灰",
    icon: "🧱",
    color: "bg-site-orange",
    bgColor: "bg-orange-50",
    items: [
      {
        id: "pl-vert",
        name: "立面垂直度",
        unit: "mm",
        standardValue: 0,
        allowDeviation: 4,
        description: "2m靠尺紧贴墙面，竖向放置，读取塞尺数值",
        tool: "2m靠尺 + 塞尺",
        diagram: "plumb",
      },
      {
        id: "pl-horiz",
        name: "表面平整度",
        unit: "mm",
        standardValue: 0,
        allowDeviation: 4,
        description: "2m靠尺横向或斜向放置，取最大缝隙值",
        tool: "2m靠尺 + 塞尺",
        diagram: "level",
      },
      {
        id: "pl-corner",
        name: "阴阳角方正",
        unit: "mm",
        standardValue: 0,
        allowDeviation: 4,
        description: "直角检测尺紧贴阴阳角两边，读取偏差",
        tool: "直角检测尺",
        diagram: "rightAngle",
      },
      {
        id: "pl-qun",
        name: "墙裙上口平直",
        unit: "mm",
        standardValue: 0,
        allowDeviation: 4,
        description: "5m拉线绷紧，钢直尺量取线与上口最大距离",
        tool: "5m拉线 + 钢直尺",
        diagram: "line",
      },
    ],
  },
  {
    type: "tiling",
    name: "贴砖",
    icon: "🟫",
    color: "bg-amber-600",
    bgColor: "bg-amber-50",
    items: [
      {
        id: "tl-horiz",
        name: "表面平整度",
        unit: "mm",
        standardValue: 0,
        allowDeviation: 2,
        description: "2m靠尺横放砖面，塞尺量最大缝隙",
        tool: "2m靠尺 + 塞尺",
        diagram: "level",
      },
      {
        id: "tl-vert",
        name: "立面垂直度",
        unit: "mm",
        standardValue: 0,
        allowDeviation: 2,
        description: "2m靠尺竖贴墙面，读取偏差数值",
        tool: "2m靠尺",
        diagram: "plumb",
      },
      {
        id: "tl-gap",
        name: "接缝高低差",
        unit: "mm",
        standardValue: 0,
        allowDeviation: 0.5,
        description: "钢直尺横搭接缝处，塞尺量两砖高低差",
        tool: "钢直尺 + 塞尺",
        diagram: "tileGap",
      },
      {
        id: "tl-hollow",
        name: "空鼓率",
        unit: "%",
        standardValue: 0,
        allowDeviation: 5,
        description: "小锤轻敲砖面四角及中心，记录空响砖块比例",
        tool: "小锤敲击",
        diagram: "tileHollow",
      },
    ],
  },
  {
    type: "flooring",
    name: "地坪",
    icon: "🟦",
    color: "bg-sky-600",
    bgColor: "bg-sky-50",
    items: [
      {
        id: "fl-horiz",
        name: "表面平整度",
        unit: "mm",
        standardValue: 0,
        allowDeviation: 4,
        description: "2m靠尺放在地坪表面，取最大缝隙读数",
        tool: "2m靠尺 + 塞尺",
        diagram: "level",
      },
      {
        id: "fl-elev",
        name: "标高偏差",
        unit: "mm",
        standardValue: 0,
        allowDeviation: 10,
        description: "水平仪架好，标尺多点测量，与设计标高比较",
        tool: "水平仪 + 标尺",
        diagram: "floorLevel",
      },
      {
        id: "fl-slope",
        name: "坡度",
        unit: "%",
        standardValue: 0,
        allowDeviation: 0.2,
        description: "坡度尺放在地面，读取显示的坡度数值",
        tool: "坡度尺",
        diagram: "slope",
      },
    ],
  },
  {
    type: "masonry",
    name: "砌筑",
    icon: "🧱",
    color: "bg-rose-600",
    bgColor: "bg-rose-50",
    items: [
      {
        id: "ms-axis",
        name: "轴线位移",
        unit: "mm",
        standardValue: 0,
        allowDeviation: 10,
        description: "经纬仪放线，钢直尺量墙体与轴线的偏移",
        tool: "经纬仪 + 钢直尺",
        diagram: "axis",
      },
      {
        id: "ms-vert",
        name: "每层垂直度",
        unit: "mm",
        standardValue: 0,
        allowDeviation: 5,
        description: "2m托线板紧靠墙面，读取偏差数值",
        tool: "2m托线板",
        diagram: "plumbLine",
      },
      {
        id: "ms-horiz",
        name: "表面平整度",
        unit: "mm",
        standardValue: 0,
        allowDeviation: 8,
        description: "2m靠尺斜放墙面，塞尺取最大缝隙值",
        tool: "2m靠尺 + 塞尺",
        diagram: "level",
      },
      {
        id: "ms-joint",
        name: "水平灰缝厚度",
        unit: "mm",
        standardValue: 10,
        allowDeviation: 2,
        description: "钢直尺量10皮砖累计厚度，计算平均偏差",
        tool: "钢直尺(10皮累计)",
        diagram: "mortarJoint",
      },
      {
        id: "ms-door",
        name: "门窗洞口宽度",
        unit: "mm",
        standardValue: 0,
        allowDeviation: 10,
        description: "钢直尺量洞口上下口宽度，与设计值比较",
        tool: "钢直尺",
        diagram: "doorWidth",
      },
    ],
  },
];

export const DEFAULT_WORKERS: Worker[] = [
  { id: "w1", name: "张师傅", skills: ["plastering", "masonry"], color: "#FF6B1A" },
  { id: "w2", name: "李师傅", skills: ["tiling", "plastering"], color: "#27AE60" },
  { id: "w3", name: "王师傅", skills: ["flooring", "tiling"], color: "#3498DB" },
  { id: "w4", name: "赵师傅", skills: ["masonry", "flooring"], color: "#9B59B6" },
  { id: "w5", name: "陈师傅", skills: ["plastering"], color: "#F39C12" },
];

export const DEFAULT_TEAM_LEADER = "李班长";

export function getProcessByType(type: string): ProcessDef | undefined {
  return PROCESS_LIST.find((p) => p.type === type);
}

export function calcIsPass(value: number, standard: number, allow: number): boolean {
  if (standard === 0) {
    return Math.abs(value) <= allow;
  }
  return Math.abs(value - standard) <= allow;
}

export function calcDeviation(value: number, standard: number, allow: number): number {
  const diff = standard === 0 ? Math.abs(value) : Math.abs(value - standard);
  return Math.max(0, diff - allow);
}
