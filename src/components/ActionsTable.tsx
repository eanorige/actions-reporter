'use client'

import { useState, useEffect, useMemo } from 'react'
import { ActionData } from '@/lib/logParser'
import { BarChart, Bar, Cell, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import { Payload } from 'recharts/types/component/DefaultTooltipContent'

interface TableProps {
  data: ActionData[]
}

interface ActionGroup {
  name: string
  runs: ActionData[]
}

function groupActionsByName(data: ActionData[]): ActionGroup[] {
  const groups: { [key: string]: ActionData[] } = {}
  data.forEach((item) => {
    if (!groups[item.name]) {
      groups[item.name] = []
    }
    groups[item.name].push(item)
  })
  return Object.keys(groups).map((name) => ({
    name,
    runs: groups[name].sort(
      (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    ),
  }))
}

function calculateRuntimeData(runs: ActionData[]) {
  return runs.map((run) => ({
    timestamp: new Date(run.timestamp).getTime(),
    duration: run.duration || 0,
    status: run.status,
  }))
}

const ArrowUp = () => (
  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
  </svg>
)
const ArrowDown = () => (
  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
  </svg>
)

const ChevronDown = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
  </svg>
)
const ChevronUp = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
  </svg>
)

function ActionRow({
  group,
  onMoveUp,
  onMoveDown,
  isFirst,
  isLast,
  timeRangeWeeks,
}: {
  group: ActionGroup
  onMoveUp: () => void
  onMoveDown: () => void
  isFirst: boolean
  isLast: boolean
  timeRangeWeeks: number
}) {
  const [isExpanded, setIsExpanded] = useState(false)
  const runtimeData = calculateRuntimeData(group.runs)

  const maxDuration = Math.max(...group.runs.map((r) => r.duration || 0))
  const runsPerWeek =
    timeRangeWeeks > 0 ? (group.runs.length / timeRangeWeeks).toFixed(1) : group.runs.length
  const tooltipTitle = `${group.name}\nMax Runtime: ${maxDuration.toFixed(1)}s\nRuns per week: ${runsPerWeek}`

  const successRuns = group.runs.filter((r) => r.status === 'success')
  const failRuns = group.runs.filter((r) => r.status !== 'success')
  const successRate = group.runs.length > 0 ? (successRuns.length / group.runs.length) * 100 : 0
  const avgPassRuntime =
    successRuns.length > 0
      ? successRuns.reduce((acc, r) => acc + (r.duration || 0), 0) / successRuns.length
      : null
  const avgFailRuntime =
    failRuns.length > 0
      ? failRuns.reduce((acc, r) => acc + (r.duration || 0), 0) / failRuns.length
      : null

  const durations = group.runs.map((r) => r.duration || 0).sort((a, b) => a - b)
  const p90Index = Math.floor(durations.length * 0.9)
  const p90Runtime = durations.length > 0 ? durations[p90Index] : 0

  return (
    <div
      className={`relative mb-1 p-2 bg-white dark:bg-gray-800 rounded shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col gap-2 transition-all ${isExpanded ? 'ring-2 ring-blue-100 dark:ring-blue-900' : ''}`}
    >
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="absolute -left-3 top-3 p-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 shadow-sm hover:bg-gray-50 dark:hover:bg-gray-700 rounded-full text-gray-500 z-10"
        title={isExpanded ? 'Collapse' : 'Expand'}
      >
        {isExpanded ? <ChevronUp /> : <ChevronDown />}
      </button>
      <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
        <div className="flex items-center sm:w-1/3 min-w-0 gap-2 ml-2">
          <div className="flex flex-col gap-1">
            <button
              onClick={onMoveUp}
              disabled={isFirst}
              className="p-0.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded disabled:opacity-30"
            >
              <ArrowUp />
            </button>
            <button
              onClick={onMoveDown}
              disabled={isLast}
              className="p-0.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded disabled:opacity-30"
            >
              <ArrowDown />
            </button>
          </div>
          <div className="flex justify-between items-center flex-1 min-w-0">
            <h4 className="text-sm font-semibold truncate mr-2 cursor-help" title={tooltipTitle}>
              {group.name}
            </h4>
          </div>
        </div>

        <div className="flex-1 h-8" title="Runtime Duration">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={runtimeData}>
              <XAxis dataKey="timestamp" type="number" domain={['dataMin', 'dataMax']} hide />
              <Tooltip
                contentStyle={{
                  fontSize: '10px',
                  padding: '2px',
                  backgroundColor: '#fff',
                  border: '1px solid #ccc',
                }}
                itemStyle={{ padding: 0, color: '#000' }}
                labelStyle={{
                  fontSize: '10px',
                  fontWeight: 'bold',
                  marginBottom: '2px',
                  color: '#000',
                }}
                labelFormatter={(label) => new Date(label).toLocaleString()}
                formatter={(value: number, name: string, props: Payload<number, string>) => {
                  const status = props.payload.status
                  return [`${value.toFixed(1)}s (${status})`, 'Duration']
                }}
              />
              <Bar dataKey="duration" isAnimationActive={false} barSize={4}>
                {runtimeData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={entry.status === 'success' ? '#82ca9d' : '#ff8042'}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {isExpanded && (
        <div className="mt-2 pt-4 border-t border-gray-100 dark:border-gray-700 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-1 space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">Success Rate:</span>
              <span className="font-medium">{successRate.toFixed(1)}%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Avg Pass Runtime:</span>
              <span className="font-medium">
                {avgPassRuntime !== null ? `${avgPassRuntime.toFixed(1)}s` : 'n/a'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Avg Fail Runtime:</span>
              <span className="font-medium">
                {avgFailRuntime !== null ? `${avgFailRuntime.toFixed(1)}s` : 'n/a'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">90th Percentile:</span>
              <span className="font-medium">{p90Runtime.toFixed(1)}s</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Total Runs:</span>
              <span className="font-medium">{group.runs.length}</span>
            </div>
          </div>
          <div className="md:col-span-2 h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={runtimeData}>
                <XAxis
                  dataKey="timestamp"
                  type="number"
                  domain={['dataMin', 'dataMax']}
                  tickFormatter={(tick) => new Date(tick).toLocaleDateString()}
                  style={{ fontSize: '10px' }}
                />
                <YAxis style={{ fontSize: '10px' }} />
                <Tooltip
                  contentStyle={{
                    fontSize: '12px',
                    backgroundColor: '#fff',
                    border: '1px solid #ccc',
                  }}
                  labelFormatter={(label) => new Date(label).toLocaleString()}
                  formatter={(value: number, name: string, props: Payload<number, string>) => {
                    const status = props.payload.status
                    return [`${value.toFixed(1)}s (${status})`, 'Duration']
                  }}
                />
                <Bar dataKey="duration" isAnimationActive={false} barSize={8}>
                  {runtimeData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={entry.status === 'success' ? '#82ca9d' : '#ff8042'}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  )
}

function get90thPercentile(values: number[]) {
  if (values.length === 0) return 0
  const sorted = [...values].sort((a, b) => a - b)
  const index = Math.ceil(0.9 * sorted.length) - 1
  return sorted[index]
}

export default function ActionsTable({ data }: TableProps) {
  const [orderedNames, setOrderedNames] = useState<string[]>([])
  const [excludeShortRuns, setExcludeShortRuns] = useState(false)

  useEffect(() => {
    const stored = localStorage.getItem('actions_order')
    if (stored) {
      setTimeout(() => setOrderedNames(JSON.parse(stored)), 0)
    }
  }, [])

  const saveOrder = (newOrder: string[]) => {
    setOrderedNames(newOrder)
    localStorage.setItem('actions_order', JSON.stringify(newOrder))
  }

  const filteredData = useMemo(() => {
    if (!excludeShortRuns) return data

    const groups = groupActionsByName(data)
    const thresholds = new Map<string, number>()

    groups.forEach((group) => {
      const durations = group.runs.map((r) => r.duration || 0)
      const p90 = get90thPercentile(durations)
      thresholds.set(group.name, p90 * 0.05)
    })

    return data.filter((item) => {
      const threshold = thresholds.get(item.name) || 0
      return (item.duration || 0) >= threshold
    })
  }, [data, excludeShortRuns])

  const mainBranchData = filteredData.filter((item) => item.branch === 'main')
  const otherBranchData = filteredData.filter((item) => item.branch !== 'main')

  const mainGroups = groupActionsByName(mainBranchData)
  const otherGroups = groupActionsByName(otherBranchData)

  const timestamps = filteredData.map((d) => new Date(d.timestamp).getTime())
  const minTime = timestamps.length > 0 ? Math.min(...timestamps) : 0
  const maxTime = timestamps.length > 0 ? Math.max(...timestamps) : 0
  // Ensure at least 1 hour span to avoid division by zero or extreme values for very short tests
  const timeRangeWeeks = Math.max((maxTime - minTime) / (1000 * 60 * 60 * 24 * 7), 1 / 168)

  const sortGroups = (groups: ActionGroup[]) => {
    if (orderedNames.length === 0) return groups

    return [...groups].sort((a, b) => {
      const indexA = orderedNames.indexOf(a.name)
      const indexB = orderedNames.indexOf(b.name)

      // If both are new (not in order list), keep original order (or sort alphabetically?)
      if (indexA === -1 && indexB === -1) return 0
      // If A is new, put it at the end
      if (indexA === -1) return 1
      // If B is new, put it at the end
      if (indexB === -1) return -1

      return indexA - indexB
    })
  }

  const sortedMainGroups = sortGroups(mainGroups)
  const sortedOtherGroups = sortGroups(otherGroups)

  const handleMove = (groupName: string, direction: 'up' | 'down', list: ActionGroup[]) => {
    const currentOrder = [...orderedNames]

    // Ensure all current items are in the order list
    list.forEach((g) => {
      if (!currentOrder.includes(g.name)) {
        currentOrder.push(g.name)
      }
    })

    const currentIndex = currentOrder.indexOf(groupName)
    if (currentIndex === -1) return // Should not happen if we just added them

    // Check bounds
    // Note: We are moving within the global list, but visually we are moving within the filtered list (Main or Other).
    // This is tricky. If "Main" has [A, B] and "Other" has [C, D].
    // Global order: [A, B, C, D].
    // If I move B up, it swaps with A. Order: [B, A, C, D]. Main: [B, A]. Correct.
    // If I move C up, it swaps with A? No, C is in "Other".
    // The user sees "Main" list and "Other" list.
    // If I click "Move Up" on C (first in Other), it shouldn't move into Main.
    // So "reordering actions within each group" implies we only care about the relative order of items *within that display group*.

    // Let's simplify: We only swap with the adjacent item *in the current display list*.

    const listNames = list.map((g) => g.name)
    const visualIndex = listNames.indexOf(groupName)

    if (direction === 'up' && visualIndex > 0) {
      // Swap positions in the global order list

      // Remove both
      // This is getting complicated because they might be far apart in the global list if interleaved with other branches.
      // But wait, an action name usually belongs to one workflow, which runs on multiple branches.
      // So "Build" appears in Main and "Build" appears in Other?
      // Yes, `groupActionsByName` groups by name.
      // So "Build" is a single entry in `orderedNames`.
      // But in the UI, we split them.
      // If I move "Build" up in "Main Branch" section, I expect it to move up in "Other Branch" section too?
      // Probably yes, the user wants to order the *Actions*.

      // So if I move "Build" up, I want it to have a lower index than the item visually above it.
      const targetName = listNames[visualIndex - 1]

      // We want groupName to come before targetName in the global list.
      // Let's just re-arrange the global list to ensure groupName is immediately before targetName?
      // Or just swap their indices in the global list?

      const idx1 = currentOrder.indexOf(groupName)
      const idx2 = currentOrder.indexOf(targetName)

      if (idx1 !== -1 && idx2 !== -1) {
        // Swap
        const temp = currentOrder[idx1]
        currentOrder[idx1] = currentOrder[idx2]
        currentOrder[idx2] = temp
        saveOrder(currentOrder)
      }
    } else if (direction === 'down' && visualIndex < listNames.length - 1) {
      const targetName = listNames[visualIndex + 1]
      const idx1 = currentOrder.indexOf(groupName)
      const idx2 = currentOrder.indexOf(targetName)

      if (idx1 !== -1 && idx2 !== -1) {
        // Swap
        const temp = currentOrder[idx1]
        currentOrder[idx1] = currentOrder[idx2]
        currentOrder[idx2] = temp
        saveOrder(currentOrder)
      }
    }
  }

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">Actions Summary</h2>
        <label className="flex items-center space-x-2 text-sm cursor-pointer select-none">
          <input
            type="checkbox"
            checked={excludeShortRuns}
            onChange={(e) => setExcludeShortRuns(e.target.checked)}
            className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
          />
          <span className="text-gray-700 dark:text-gray-300">
            Exclude short runs (&lt; 5% of p90)
          </span>
        </label>
      </div>
      <div className="flex flex-col gap-8">
        <div>
          <h3 className="text-lg font-semibold mb-4 border-b pb-2">Main Branch</h3>
          {sortedMainGroups.length === 0 ? (
            <p className="text-gray-500">No actions found on main branch.</p>
          ) : (
            sortedMainGroups.map((group, index) => (
              <ActionRow
                key={group.name}
                group={group}
                onMoveUp={() => handleMove(group.name, 'up', sortedMainGroups)}
                onMoveDown={() => handleMove(group.name, 'down', sortedMainGroups)}
                isFirst={index === 0}
                isLast={index === sortedMainGroups.length - 1}
                timeRangeWeeks={timeRangeWeeks}
              />
            ))
          )}
        </div>
        <div>
          <h3 className="text-lg font-semibold mb-4 border-b pb-2">Other Branches</h3>
          {sortedOtherGroups.length === 0 ? (
            <p className="text-gray-500">No actions found on other branches.</p>
          ) : (
            sortedOtherGroups.map((group, index) => (
              <ActionRow
                key={group.name}
                group={group}
                onMoveUp={() => handleMove(group.name, 'up', sortedOtherGroups)}
                onMoveDown={() => handleMove(group.name, 'down', sortedOtherGroups)}
                isFirst={index === 0}
                isLast={index === sortedOtherGroups.length - 1}
                timeRangeWeeks={timeRangeWeeks}
              />
            ))
          )}
        </div>
      </div>
    </div>
  )
}
