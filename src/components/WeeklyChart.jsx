import {
  Bar,
  BarChart,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload || payload.length === 0) return null;
  const item = payload[0]?.payload;
  return (
    <div className="rounded-xl bg-[#121316] px-3 py-2 shadow-lg text-xs text-[#FAF9F6] border border-white/10">
      <div className="font-display font-semibold mb-1">{label}</div>
      <div className="text-[#9EC0FF]">
        Completed: <span className="font-semibold tabular-nums">{item?.completed ?? 0}</span>
      </div>
      <div className="text-[#D4D7DF]">
        Added: <span className="font-semibold tabular-nums">{item?.added ?? 0}</span>
      </div>
    </div>
  );
}

export function WeeklyChart({ data }) {
  const hasAnyActivity = data.some((d) => d.completed > 0 || d.added > 0);

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between gap-2 mb-4">
        <div>
          <h3 className="font-display text-sm sm:text-base font-semibold text-[#121316]">
            Weekly Activity
          </h3>
          <p className="text-xs text-[#424652] mt-0.5">
            Tasks completed & added over the last 7 days
          </p>
        </div>
        <div className="flex items-center gap-3 text-[11px] text-[#424652]">
          <span className="inline-flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#5B8DEF]" />
            Done
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#121316]" />
            Added
          </span>
        </div>
      </div>

      <div className="relative h-[196px] sm:h-[212px] w-full min-w-0">
        <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={180}>
          <BarChart
            data={data}
            margin={{ top: 8, right: 4, left: -24, bottom: 0 }}
            barGap={4}
          >
            <XAxis
              dataKey="day"
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#424652', fontSize: 11 }}
            />
            <YAxis
              allowDecimals={false}
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#6E7382', fontSize: 11 }}
            />
            <Tooltip
              cursor={{ fill: 'rgba(91, 141, 239, 0.08)', radius: 8 }}
              content={<CustomTooltip />}
            />
            <Bar
              dataKey="completed"
              radius={[6, 6, 6, 6]}
              maxBarSize={18}
            >
              {data.map((entry) => (
                <Cell
                  key={entry.dateKey}
                  fill={entry.isToday ? '#3762C4' : '#5B8DEF'}
                />
              ))}
            </Bar>
            <Bar
              dataKey="added"
              radius={[6, 6, 6, 6]}
              maxBarSize={14}
            >
              {data.map((entry) => (
                <Cell
                  key={`added-${entry.dateKey}`}
                  fill={entry.isToday ? '#121316' : '#B9B5AC'}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>

        {!hasAnyActivity && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <span className="px-3 py-1 rounded-full bg-[#ECE9E1] border border-[#121316]/[0.1] text-[11px] text-[#424652]">
              Complete or add tasks to populate your week
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
