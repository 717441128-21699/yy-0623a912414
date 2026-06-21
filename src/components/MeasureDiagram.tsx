import type { DiagramType } from "@/types";

interface Props {
  type: DiagramType;
  className?: string;
}

export default function MeasureDiagram({ type, className = "" }: Props) {
  const common = (
    <defs>
      <linearGradient id="wall" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#F5F0E8" />
        <stop offset="100%" stopColor="#E8DFD0" />
      </linearGradient>
      <linearGradient id="ruler" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#FFD4A3" />
        <stop offset="100%" stopColor="#FF9F43" />
      </linearGradient>
    </defs>
  );

  const rulerTicks = (
    <>
      {Array.from({ length: 9 }).map((_, i) => (
        <line
          key={i}
          x1={0}
          y1={10 + i * 22}
          x2={7}
          y2={10 + i * 22}
          stroke="#666"
          strokeWidth={1}
        />
      ))}
    </>
  );

  const content = (() => {
    switch (type) {
      case "plumb":
        return (
          <g>
            <rect x="40" y="20" width="220" height="260" rx="8" fill="url(#wall)" stroke="#D4C8B4" strokeWidth="2" />
            <path d="M70 60 L70 280" stroke="#C8B89E" strokeDasharray="4 6" strokeWidth="1" />
            <rect x="120" y="40" width="18" height="220" rx="3" fill="url(#ruler)" stroke="#E55A0E" strokeWidth="1.5" transform="rotate(-2 129 150)" />
            <polygon points="135,42 126,62 144,62" fill="#E74C3C" />
            <text x="142" y="130" fontSize="11" fill="#E55A0E" fontWeight="bold">靠尺</text>
            <text x="150" y="180" fontSize="10" fill="#666">竖放</text>
            {rulerTicks}
          </g>
        );
      case "level":
        return (
          <g>
            <rect x="20" y="80" width="260" height="180" rx="8" fill="url(#wall)" stroke="#D4C8B4" strokeWidth="2" />
            <line x1="40" y1="200" x2="260" y2="200" stroke="#C8B89E" strokeDasharray="4 6" strokeWidth="1" />
            <rect x="35" y="155" width="230" height="18" rx="3" fill="url(#ruler)" stroke="#E55A0E" strokeWidth="1.5" transform="rotate(3 150 164)" />
            <circle cx="150" cy="164" r="8" fill="#27AE60" opacity="0.9" />
            <line x1="142" y1="164" x2="158" y2="164" stroke="white" strokeWidth="2" />
            <rect x="80" y="145" width="6" height="18" fill="#3498DB" />
            <rect x="195" y="145" width="6" height="18" fill="#3498DB" />
            <text x="100" y="125" fontSize="11" fill="#E55A0E" fontWeight="bold">2m靠尺横放</text>
          </g>
        );
      case "rightAngle":
        return (
          <g>
            <path d="M40 40 L40 260 L260 260 L260 40 Z" fill="none" stroke="#D4C8B4" strokeWidth="2" strokeDasharray="6 6" />
            <rect x="40" y="40" width="220" height="220" fill="url(#wall)" opacity="0.6" />
            <path d="M40 260 L40 120 L180 260 Z" fill="url(#ruler)" stroke="#E55A0E" strokeWidth="2" />
            <circle cx="70" cy="240" r="14" fill="#27AE60" />
            <path d="M63 240 L69 246 L78 236" stroke="white" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
            <text x="100" y="180" fontSize="11" fill="#E55A0E" fontWeight="bold">直角检测尺</text>
            <text x="110" y="200" fontSize="10" fill="#666">卡紧阴阳角</text>
          </g>
        );
      case "line":
        return (
          <g>
            <rect x="20" y="60" width="260" height="140" rx="6" fill="url(#wall)" stroke="#D4C8B4" strokeWidth="2" />
            <rect x="20" y="200" width="260" height="80" fill="#E8DFD0" stroke="#D4C8B4" strokeWidth="1" />
            <line x1="40" y1="110" x2="260" y2="110" stroke="#E74C3C" strokeWidth="1.5" />
            <circle cx="40" cy="110" r="4" fill="#E74C3C" />
            <circle cx="260" cy="110" r="4" fill="#E74C3C" />
            <line x1="110" y1="110" x2="110" y2="195" stroke="#3498DB" strokeDasharray="3 3" />
            <line x1="190" y1="110" x2="190" y2="195" stroke="#3498DB" strokeDasharray="3 3" />
            <path d="M105 195 L115 195 L115 200 L105 200 Z" fill="#3498DB" />
            <path d="M185 195 L195 195 L195 200 L185 200 Z" fill="#3498DB" />
            <text x="90" y="90" fontSize="11" fill="#E74C3C" fontWeight="bold">5m拉线绷紧</text>
            <text x="140" y="225" fontSize="10" fill="#3498DB">钢直尺量取</text>
          </g>
        );
      case "tileHollow":
        return (
          <g>
            <rect x="30" y="30" width="240" height="240" fill="url(#wall)" stroke="#D4C8B4" strokeWidth="2" />
            <line x1="150" y1="30" x2="150" y2="270" stroke="#C8B89E" strokeWidth="1" />
            <line x1="30" y1="110" x2="270" y2="110" stroke="#C8B89E" strokeWidth="1" />
            <line x1="30" y1="190" x2="270" y2="190" stroke="#C8B89E" strokeWidth="1" />
            {[
              { x: 90, y: 70, c: "#27AE60" },
              { x: 210, y: 70, c: "#27AE60" },
              { x: 90, y: 150, c: "#E74C3C" },
              { x: 210, y: 150, c: "#27AE60" },
              { x: 90, y: 230, c: "#27AE60" },
              { x: 150, y: 70, c: "#27AE60" },
              { x: 150, y: 150, c: "#F39C12" },
              { x: 150, y: 230, c: "#27AE60" },
              { x: 210, y: 230, c: "#27AE60" },
            ].map((p, i) => (
              <circle key={i} cx={p.x} cy={p.y} r="8" fill={p.c} opacity="0.85" />
            ))}
            <path d="M200 60 L205 40 L212 50 L218 35" stroke="#8B4513" strokeWidth="2.5" fill="none" strokeLinecap="round" />
            <circle cx="220" cy="33" r="8" fill="#8B4513" />
            <text x="60" y="268" fontSize="10" fill="#666">🔴空鼓 🟡可疑 🟢密实</text>
            <text x="160" y="268" fontSize="11" fill="#8B4513" fontWeight="bold">小锤敲</text>
          </g>
        );
      case "tileGap":
        return (
          <g>
            <rect x="20" y="60" width="110" height="180" fill="#D4A574" stroke="#8B6F47" strokeWidth="2" />
            <rect x="160" y="60" width="110" height="180" fill="#C8956A" stroke="#8B6F47" strokeWidth="2" />
            <rect x="130" y="60" width="30" height="180" fill="#F5F0E8" />
            <rect x="50" y="220" width="190" height="20" fill="url(#ruler)" stroke="#E55A0E" strokeWidth="1.5" rx="2" />
            <line x1="145" y1="60" x2="145" y2="220" stroke="#E74C3C" strokeWidth="2" strokeDasharray="4 3" />
            <polygon points="142,65 148,65 145,58" fill="#E74C3C" />
            <polygon points="142,215 148,215 145,222" fill="#E74C3C" />
            <rect x="140" y="130" width="10" height="40" fill="#3498DB" opacity="0.9" />
            <text x="170" y="155" fontSize="10" fill="#E74C3C" fontWeight="bold">塞尺</text>
            <text x="170" y="170" fontSize="9" fill="#666">测高低差</text>
          </g>
        );
      case "floorLevel":
        return (
          <g>
            <rect x="20" y="180" width="260" height="90" fill="#D9E4EC" stroke="#A9BDCE" strokeWidth="2" rx="4" />
            <line x1="20" y1="210" x2="280" y2="210" stroke="#27AE60" strokeWidth="1.5" strokeDasharray="5 4" />
            <line x1="60" y1="180" x2="60" y2="270" stroke="#8B6F47" strokeWidth="2" />
            <rect x="54" y="185" width="12" height="85" fill="url(#ruler)" />
            {[0, 1, 2, 3, 4, 5, 6].map((i) => (
              <line key={i} x1="54" y1={260 - i * 12} x2="66" y2={260 - i * 12} stroke="#333" strokeWidth="1" />
            ))}
            <polygon points="140,210 150,210 145,202" fill="#27AE60" />
            <line x1="145" y1="202" x2="145" y2="90" stroke="#27AE60" strokeWidth="2" strokeDasharray="3 3" />
            <rect x="115" y="60" width="60" height="30" fill="#34495E" stroke="#2C3E50" strokeWidth="2" rx="4" />
            <circle cx="130" cy="75" r="6" fill="#27AE60" />
            <circle cx="160" cy="75" r="6" fill="#E74C3C" />
            <line x1="130" y1="75" x2="160" y2="75" stroke="#F39C12" strokeWidth="1" />
            <text x="125" y="115" fontSize="10" fill="#2C3E50" fontWeight="bold">水平仪</text>
            <text x="35" y="260" fontSize="10" fill="#E55A0E" fontWeight="bold">标尺</text>
          </g>
        );
      case "slope":
        return (
          <g>
            <polygon points="20,240 280,180 280,260 20,260" fill="#D9E4EC" stroke="#A9BDCE" strokeWidth="2" />
            <line x1="20" y1="210" x2="280" y2="210" stroke="#2C3E50" strokeWidth="1" strokeDasharray="5 4" />
            <rect x="40" y="150" width="200" height="30" fill="url(#ruler)" stroke="#E55A0E" strokeWidth="2" rx="3" transform="rotate(-8 140 165)" />
            <circle cx="140" cy="165" r="12" fill="#2C3E50" stroke="#F39C12" strokeWidth="2" />
            <line x1="140" y1="165" x2="135" y2="156" stroke="#F39C12" strokeWidth="2" strokeLinecap="round" />
            <path d="M140 165 L140 155" stroke="#E74C3C" strokeWidth="2.5" strokeLinecap="round" />
            <text x="210" y="105" fontSize="10" fill="#E55A0E" fontWeight="bold">坡度尺</text>
            <text x="60" y="290" fontSize="10" fill="#2C3E50" fontWeight="bold">↘ 向排水方向倾斜</text>
            <path d="M60 210 L60 240" stroke="#E74C3C" strokeWidth="2" markerEnd="url(#arrow)" />
          </g>
        );
      case "axis":
        return (
          <g>
            <rect x="120" y="30" width="40" height="240" fill="#C8956A" stroke="#8B6F47" strokeWidth="2" />
            <line x1="80" y1="150" x2="200" y2="150" stroke="#27AE60" strokeWidth="2.5" strokeDasharray="6 4" />
            <polygon points="74,150 84,145 84,155" fill="#27AE60" />
            <polygon points="206,150 196,145 196,155" fill="#27AE60" />
            <line x1="140" y1="30" x2="140" y2="270" stroke="#27AE60" strokeWidth="2" strokeDasharray="6 4" />
            <polygon points="140,24 135,34 145,34" fill="#27AE60" />
            <polygon points="140,276 135,266 145,266" fill="#27AE60" />
            <text x="180" y="170" fontSize="10" fill="#27AE60" fontWeight="bold">设计轴线</text>
            <line x1="100" y1="150" x2="100" y2="260" stroke="#E74C3C" strokeDasharray="3 3" />
            <line x1="155" y1="150" x2="155" y2="260" stroke="#E74C3C" strokeDasharray="3 3" />
            <path d="M100 250 L155 250" stroke="#E74C3C" strokeWidth="2" markerEnd="url(#arrow)" />
            <text x="110" y="285" fontSize="10" fill="#E74C3C" fontWeight="bold">偏移量</text>
          </g>
        );
      case "plumbLine":
        return (
          <g>
            <rect x="80" y="20" width="140" height="260" fill="#C8956A" stroke="#8B6F47" strokeWidth="2" />
            <line x1="250" y1="40" x2="250" y2="260" stroke="#2C3E50" strokeWidth="1" />
            <circle cx="250" cy="40" r="4" fill="#2C3E50" />
            <line x1="250" y1="40" x2="250" y2="240" stroke="#C0392B" strokeWidth="1" />
            <polygon points="246,240 254,240 250,260" fill="#555" stroke="#333" strokeWidth="1" />
            <rect x="180" y="50" width="14" height="200" fill="url(#ruler)" stroke="#E55A0E" strokeWidth="1.5" rx="2" transform="rotate(4 187 150)" />
            <line x1="220" y1="55" x2="245" y2="55" stroke="#2C3E50" strokeDasharray="3 2" />
            <line x1="220" y1="245" x2="240" y2="245" stroke="#E74C3C" strokeDasharray="3 2" />
            <text x="195" y="150" fontSize="10" fill="#E55A0E" fontWeight="bold">托线板</text>
            <text x="200" y="170" fontSize="9" fill="#E74C3C">有偏差</text>
            <text x="255" y="150" fontSize="9" fill="#2C3E50" fontWeight="bold">铅锤</text>
          </g>
        );
      case "mortarJoint":
        return (
          <g>
            <rect x="30" y="230" width="230" height="40" fill="#C8956A" stroke="#8B6F47" strokeWidth="1.5" />
            <rect x="50" y="190" width="200" height="40" fill="#D4A574" stroke="#8B6F47" strokeWidth="1.5" />
            <rect x="30" y="150" width="230" height="40" fill="#C8956A" stroke="#8B6F47" strokeWidth="1.5" />
            <rect x="50" y="110" width="200" height="40" fill="#D4A574" stroke="#8B6F47" strokeWidth="1.5" />
            <rect x="30" y="70" width="230" height="40" fill="#C8956A" stroke="#8B6F47" strokeWidth="1.5" />
            <line x1="30" y1="225" x2="260" y2="225" stroke="#888" strokeWidth="1" />
            <rect x="140" y="70" width="10" height="188" fill="#F39C12" opacity="0.85" />
            <rect x="135" y="250" width="120" height="18" fill="url(#ruler)" stroke="#E55A0E" strokeWidth="1.5" rx="2" />
            {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
              <line key={i} x1={140 + i * 15} y1="250" x2={140 + i * 15} y2="257" stroke="#333" strokeWidth="1" />
            ))}
            <text x="40" y="248" fontSize="9" fill="#666">10皮砖</text>
            <text x="150" y="290" fontSize="10" fill="#E55A0E" fontWeight="bold">累计量厚</text>
          </g>
        );
      case "doorWidth":
        return (
          <g>
            <rect x="60" y="40" width="180" height="220" fill="none" stroke="#8B6F47" strokeWidth="4" />
            <rect x="70" y="50" width="160" height="200" fill="#FFF8F0" />
            <line x1="60" y1="150" x2="240" y2="150" stroke="#3498DB" strokeWidth="2" strokeDasharray="4 3" />
            <polygon points="54,150 64,145 64,155" fill="#3498DB" />
            <polygon points="246,150 236,145 236,155" fill="#3498DB" />
            <rect x="85" y="160" width="130" height="18" fill="url(#ruler)" stroke="#E55A0E" strokeWidth="1.5" rx="2" />
            {[0, 1, 2, 3, 4, 5, 6].map((i) => (
              <line key={i} x1={90 + i * 18} y1="160" x2={90 + i * 18} y2="167" stroke="#333" strokeWidth="1" />
            ))}
            <text x="60" y="90" fontSize="10" fill="#2C3E50" fontWeight="bold">门窗洞口</text>
            <text x="115" y="200" fontSize="10" fill="#3498DB" fontWeight="bold">钢直尺量宽度</text>
            <line x1="70" y1="50" x2="70" y2="130" stroke="#E74C3C" strokeDasharray="2 3" />
            <line x1="230" y1="50" x2="230" y2="130" stroke="#E74C3C" strokeDasharray="2 3" />
            <path d="M70 90 L230 90" stroke="#E74C3C" strokeWidth="1.5" />
            <text x="130" y="80" fontSize="9" fill="#E74C3C">上口</text>
          </g>
        );
      default:
        return <rect x="40" y="40" width="220" height="220" fill="#eee" />;
    }
  })();

  return (
    <svg
      viewBox="0 0 300 300"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      aria-label={`测量示意: ${type}`}
    >
      {common}
      <defs>
        <marker id="arrow" markerWidth="10" markerHeight="10" refX="8" refY="3" orient="auto">
          <path d="M0,0 L0,6 L9,3 z" fill="#E74C3C" />
        </marker>
      </defs>
      {content}
    </svg>
  );
}
