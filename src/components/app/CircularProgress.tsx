interface Props {
  value: number;
  size?: number;
  strokeWidth?: number;
  label?: string;
  sublabel?: string;
}
export const CircularProgress = ({ value, size = 200, strokeWidth = 14, label, sublabel }: Props) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (Math.min(100, Math.max(0, value)) / 100) * circumference;
  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="hsl(var(--muted))"
          strokeWidth={strokeWidth}
          fill="none"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="hsl(var(--primary))"
          strokeWidth={strokeWidth}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{
            transition: "stroke-dashoffset 1s cubic-bezier(0.22,1,0.36,1)",
            filter: "drop-shadow(0 0 12px hsl(var(--primary) / 0.5))",
          }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-display text-5xl font-semibold leading-none">
          {Math.round(value)}
          <span className="text-2xl text-muted-foreground">%</span>
        </span>
        {label && <span className="mt-2 text-xs uppercase tracking-widest text-muted-foreground">{label}</span>}
        {sublabel && <span className="text-xs text-muted-foreground/70 mt-0.5">{sublabel}</span>}
      </div>
    </div>
  );
};

// interface CircularProgressProps {
//   value: number;
//   size?: number;
//   strokeWidth?: number;
//   label?: string;
//   sublabel?: string;
//   maxValue?: number;
// }

// export function CircularProgress({
//   value,
//   size = 200,
//   strokeWidth = 14,
//   label,
//   sublabel,
//   maxValue = 100,
// }: CircularProgressProps) {
//   const radius = (size - strokeWidth) / 2;
//   const circumference = 2 * Math.PI * radius;
//   const normalizedValue = Math.min(100, Math.max(0, (value / maxValue) * 100));
//   const offset = circumference - (normalizedValue / 100) * circumference;

//   return (
//     <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
//       <svg width={size} height={size} className="-rotate-90">
//         <circle
//           cx={size / 2}
//           cy={size / 2}
//           r={radius}
//           stroke="hsl(var(--muted))"
//           strokeWidth={strokeWidth}
//           fill="none"
//         />
//         <circle
//           cx={size / 2}
//           cy={size / 2}
//           r={radius}
//           stroke="hsl(var(--primary))"
//           strokeWidth={strokeWidth}
//           fill="none"
//           strokeLinecap="round"
//           strokeDasharray={circumference}
//           strokeDashoffset={offset}
//           style={{
//             transition: "stroke-dashoffset 1s cubic-bezier(0.22,1,0.36,1)",
//             filter: "drop-shadow(0 0 12px hsl(var(--primary) / 0.5))",
//           }}
//         />
//       </svg>
//       <div className="absolute inset-0 flex flex-col items-center justify-center">
//         <span className="text-5xl font-display font-semibold leading-none">
//           {Math.round(normalizedValue)}
//           <span className="text-2xl text-muted-foreground ml-1">%</span>
//         </span>
//         {label && (
//           <span className="mt-3 text-xs uppercase tracking-widest text-muted-foreground font-mono">{label}</span>
//         )}
//         {sublabel && <span className="text-xs text-muted-foreground/70 mt-1 font-mono">{sublabel}</span>}
//       </div>
//     </div>
//   );
// }
