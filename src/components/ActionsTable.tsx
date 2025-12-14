'use client';

import { useState, useEffect } from 'react';
import { ActionData } from '@/lib/logParser';
import {
  BarChart,
  Bar,
  Cell,
  XAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

interface TableProps {
  data: ActionData[];
}

interface ActionGroup {
  name: string;
  runs: ActionData[];
}

function groupActionsByName(data: ActionData[]): ActionGroup[] {
  const groups: { [key: string]: ActionData[] } = {};
  data.forEach((item) => {
    if (!groups[item.name]) {
      groups[item.name] = [];
    }
    groups[item.name].push(item);
  });
  return Object.keys(groups).map((name) => ({
    name,
    runs: groups[name].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()),
  }));
}

function calculateRuntimeData(runs: ActionData[]) {
  return runs.map(run => ({
    timestamp: new Date(run.timestamp).getTime(),
    duration: run.duration || 0,
    status: run.status,
  }));
}

const ArrowUp = () => (
  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" /></svg>
);
const ArrowDown = () => (
  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
);

function ActionRow({ 
  group, 
  onMoveUp, 
  onMoveDown, 
  isFirst, 
  isLast 
}: { 
  group: ActionGroup;
  onMoveUp: () => void;
  onMoveDown: () => void;
  isFirst: boolean;
  isLast: boolean;
}) {
  const runtimeData = calculateRuntimeData(group.runs);
  
  // Calculate min and max timestamp for the domain to ensure consistent time scale if needed,
  // or just let Recharts handle it based on data. 
  // To make it "uniform across time", we use type="number" for XAxis.
  
  return (
    <div className="mb-1 p-2 bg-white dark:bg-gray-800 rounded shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
      <div className="flex items-center sm:w-1/3 min-w-0 gap-2">
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
          <h4 className="text-sm font-semibold truncate mr-2" title={group.name}>{group.name}</h4>
        </div>
      </div>
      
      <div className="flex-1 h-8" title="Runtime Duration">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={runtimeData}>
            <XAxis 
              dataKey="timestamp" 
              type="number" 
              domain={['dataMin', 'dataMax']} 
              hide 
            />
            <Tooltip 
              contentStyle={{ fontSize: '10px', padding: '2px', backgroundColor: '#fff', border: '1px solid #ccc' }}
              itemStyle={{ padding: 0, color: '#000' }}
              labelStyle={{ fontSize: '10px', fontWeight: 'bold', marginBottom: '2px', color: '#000' }}
              labelFormatter={(label) => new Date(label).toLocaleString()}
              formatter={(value: number, name: string, props: any) => {
                const status = props.payload.status;
                return [`${value.toFixed(1)}s (${status})`, 'Duration'];
              }}
            />
            <Bar dataKey="duration" isAnimationActive={false} barSize={4}>
              {runtimeData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.status === 'success' ? '#82ca9d' : '#ff8042'} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export default function ActionsTable({ data }: TableProps) {
  const [orderedNames, setOrderedNames] = useState<string[]>([]);

  useEffect(() => {
    const stored = localStorage.getItem('actions_order');
    if (stored) {
      setOrderedNames(JSON.parse(stored));
    }
  }, []);

  const saveOrder = (newOrder: string[]) => {
    setOrderedNames(newOrder);
    localStorage.setItem('actions_order', JSON.stringify(newOrder));
  };

  const mainBranchData = data.filter((item) => item.branch === 'main');
  const otherBranchData = data.filter((item) => item.branch !== 'main');

  const mainGroups = groupActionsByName(mainBranchData);
  const otherGroups = groupActionsByName(otherBranchData);

  const sortGroups = (groups: ActionGroup[]) => {
    if (orderedNames.length === 0) return groups;
    
    return [...groups].sort((a, b) => {
      const indexA = orderedNames.indexOf(a.name);
      const indexB = orderedNames.indexOf(b.name);
      
      // If both are new (not in order list), keep original order (or sort alphabetically?)
      if (indexA === -1 && indexB === -1) return 0;
      // If A is new, put it at the end
      if (indexA === -1) return 1;
      // If B is new, put it at the end
      if (indexB === -1) return -1;
      
      return indexA - indexB;
    });
  };

  const sortedMainGroups = sortGroups(mainGroups);
  const sortedOtherGroups = sortGroups(otherGroups);

  const handleMove = (groupName: string, direction: 'up' | 'down', list: ActionGroup[]) => {
    const currentOrder = [...orderedNames];
    
    // Ensure all current items are in the order list
    list.forEach(g => {
      if (!currentOrder.includes(g.name)) {
        currentOrder.push(g.name);
      }
    });

    const currentIndex = currentOrder.indexOf(groupName);
    if (currentIndex === -1) return; // Should not happen if we just added them

    const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;

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
    
    const listNames = list.map(g => g.name);
    const visualIndex = listNames.indexOf(groupName);
    
    if (direction === 'up' && visualIndex > 0) {
      const swapWith = listNames[visualIndex - 1];
      // Swap positions in the global order list
      const index1 = currentOrder.indexOf(groupName);
      const index2 = currentOrder.indexOf(swapWith);
      
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
      const targetName = listNames[visualIndex - 1];
      
      // We want groupName to come before targetName in the global list.
      // Let's just re-arrange the global list to ensure groupName is immediately before targetName?
      // Or just swap their indices in the global list?
      
      const idx1 = currentOrder.indexOf(groupName);
      const idx2 = currentOrder.indexOf(targetName);
      
      if (idx1 !== -1 && idx2 !== -1) {
        // Swap
        const temp = currentOrder[idx1];
        currentOrder[idx1] = currentOrder[idx2];
        currentOrder[idx2] = temp;
        saveOrder(currentOrder);
      }
    } else if (direction === 'down' && visualIndex < listNames.length - 1) {
      const targetName = listNames[visualIndex + 1];
      const idx1 = currentOrder.indexOf(groupName);
      const idx2 = currentOrder.indexOf(targetName);
      
      if (idx1 !== -1 && idx2 !== -1) {
        // Swap
        const temp = currentOrder[idx1];
        currentOrder[idx1] = currentOrder[idx2];
        currentOrder[idx2] = temp;
        saveOrder(currentOrder);
      }
    }
  };

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">Actions Summary</h2>
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
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
}
