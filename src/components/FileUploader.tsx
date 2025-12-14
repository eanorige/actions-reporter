'use client';

import { useState } from 'react';
import { parseLog, ActionData } from '@/lib/logParser';

export default function FileUploader({
  onDataLoaded,
}: {
  onDataLoaded: (data: ActionData[]) => void;
}) {
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      try {
        const data = await parseLog(file);
        onDataLoaded(data);
        setError(null);
      } catch (err) {
        setError('Error parsing file');
        console.error(err);
      }
    }
  };

  return (
    <div className="p-4">
      <input
        type="file"
        accept=".csv"
        onChange={handleFileChange}
        className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-violet-50 file:text-violet-700 hover:file:bg-violet-100"
      />
      {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
    </div>
  );
}
