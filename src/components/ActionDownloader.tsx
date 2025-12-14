'use client';

import { useState, useEffect } from 'react';
import Papa from 'papaparse';
import { ActionData } from '@/lib/logParser';
import { storeActions, getStoredActions, clearStoredActions } from '@/lib/storage';

export default function ActionDownloader({
  onDataLoaded,
}: {
  onDataLoaded: (data: ActionData[]) => void;
}) {
  const [pat, setPat] = useState('');
  const [repo, setRepo] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [cachedCount, setCachedCount] = useState(0);
  const [timeWindow, setTimeWindow] = useState('24h');

  useEffect(() => {
    const stored = getStoredActions();
    setCachedCount(stored.length);
  }, []);

  const handleLoadCached = () => {
    const stored = getStoredActions();
    onDataLoaded(stored);
  };

  const handleClearCache = () => {
    clearStoredActions();
    setCachedCount(0);
    onDataLoaded([]);
  };

  const handleExportCsv = () => {
    const stored = getStoredActions();
    if (stored.length === 0) return;

    const csv = Papa.unparse(stored);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `actions_export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleFetchData = async () => {
    if (!pat || !repo) {
      setError('Please provide a Personal Access Token and a repository name.');
      return;
    }

    setError(null);
    setIsLoading(true);

    const [owner, repoName] = repo.split('/');
    if (!owner || !repoName) {
      setError('Invalid repository format. Please use "owner/repo".');
      setIsLoading(false);
      return;
    }

    const startDate = new Date();
    switch (timeWindow) {
      case '7d':
        startDate.setDate(startDate.getDate() - 7);
        break;
      case '30d':
        startDate.setDate(startDate.getDate() - 30);
        break;
      case '24h':
      default:
        startDate.setDate(startDate.getDate() - 1);
        break;
    }
    const isoDate = startDate.toISOString().split('T')[0];

    try {
      let allRuns: any[] = [];
      let page = 1;
      let hasMore = true;
      const perPage = 100;

      while (hasMore) {
        const response = await fetch(
          `https://api.github.com/repos/${owner}/${repoName}/actions/runs?created=>=${isoDate}&per_page=${perPage}&page=${page}`,
          {
            headers: {
              Authorization: `token ${pat}`,
              Accept: 'application/vnd.github.v3+json',
            },
          }
        );

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(`GitHub API error: ${errorData.message || response.statusText}`);
        }

        const data = await response.json();
        const runs = data.workflow_runs || [];
        allRuns = [...allRuns, ...runs];

        if (runs.length < perPage) {
          hasMore = false;
        } else {
          page++;
        }
      }
      
      const formattedData: ActionData[] = allRuns.map((run: any) => {
        const startTime = new Date(run.run_started_at || run.created_at).getTime();
        const endTime = new Date(run.updated_at).getTime();
        const duration = (endTime - startTime) / 1000; // seconds

        return {
          id: run.id,
          name: run.name,
          status: run.conclusion,
          branch: run.head_branch,
          timestamp: run.created_at,
          duration: duration > 0 ? duration : 0,
        };
      });

      const mergedData = storeActions(formattedData);
      setCachedCount(mergedData.length);
      onDataLoaded(mergedData);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-4 border-t border-gray-200 dark:border-gray-700">
      <h3 className="text-lg font-semibold mb-2">Download from GitHub</h3>
      <div className="flex flex-col gap-4">
        <input
          type="password"
          value={pat}
          onChange={(e) => setPat(e.target.value)}
          placeholder="Personal Access Token"
          className="p-2 border rounded bg-white dark:bg-gray-700 dark:text-white dark:border-gray-600"
        />
        <input
          type="text"
          value={repo}
          onChange={(e) => setRepo(e.target.value)}
          placeholder="owner/repository"
          className="p-2 border rounded bg-white dark:bg-gray-700 dark:text-white dark:border-gray-600"
        />
        <select
          value={timeWindow}
          onChange={(e) => setTimeWindow(e.target.value)}
          className="p-2 border rounded bg-white dark:bg-gray-700 dark:text-white dark:border-gray-600"
        >
          <option value="24h">Last 24 Hours</option>
          <option value="7d">Last 7 Days</option>
          <option value="30d">Last 30 Days</option>
        </select>
        <button
          onClick={handleFetchData}
          disabled={isLoading}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-400"
        >
          {isLoading ? 'Loading...' : 'Fetch Action Runs'}
        </button>
        
        <div className="flex items-center justify-between mt-2 p-2 bg-gray-50 dark:bg-gray-800 rounded">
          <span className="text-sm text-gray-600 dark:text-gray-300">
            Cached Events: <strong>{cachedCount}</strong>
          </span>
          <div className="flex gap-2">
            <button
              onClick={handleLoadCached}
              disabled={cachedCount === 0}
              className="px-3 py-1 text-sm bg-green-500 text-white rounded hover:bg-green-600 disabled:bg-gray-400"
            >
              Load Cache
            </button>
            <button
              onClick={handleExportCsv}
              disabled={cachedCount === 0}
              className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-400"
            >
              Export CSV
            </button>
            <button
              onClick={handleClearCache}
              disabled={cachedCount === 0}
              className="px-3 py-1 text-sm bg-red-500 text-white rounded hover:bg-red-600 disabled:bg-gray-400"
            >
              Clear
            </button>
          </div>
        </div>

        {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
      </div>
    </div>
  );
}
