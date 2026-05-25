import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, Cell } from "recharts";

export const WeeklyActivityChart = ({ data }: { data: { day: string; minutes: number }[] }) => {
  const max = Math.max(...data.map(d => d.minutes), 1);
  return (
    <ResponsiveContainer width="100%" height={180}>
      <BarChart data={data} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
        <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11, fontFamily: "JetBrains Mono" }} />
        <YAxis axisLine={false} tickLine={false} tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11, fontFamily: "JetBrains Mono" }} />
        <Tooltip cursor={{ fill: "hsl(var(--muted) / 0.4)" }}
          contentStyle={{ background: "hsl(var(--popover))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }}
          labelStyle={{ color: "hsl(var(--foreground))" }} formatter={(v: number) => [`${v} min`, "Watched"]}/>
        <Bar dataKey="minutes" radius={[6,6,0,0]}>
          {data.map((d, i) => <Cell key={i} fill={d.minutes === max && max > 0 ? "hsl(var(--primary))" : "hsl(var(--muted-foreground) / 0.5)"} />)}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
};
