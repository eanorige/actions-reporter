"use client";

import { useState } from "react";
import Image from "next/image";
import FileUploader from "@/components/FileUploader";
import ActionDownloader from "@/components/ActionDownloader";
import ActionsTable from "@/components/ActionsTable";
import { ActionData } from "@/lib/logParser";

export default function Home() {
  const [data, setData] = useState<ActionData[]>([]);

  const handleDataLoaded = (loadedData: ActionData[]) => {
    setData(loadedData);
  };

  return (
    <main className="flex min-h-screen flex-col items-center p-4 sm:p-8 md:p-12 lg:p-24">
      <div className="w-full max-w-4xl">
        <h1 className="text-3xl sm:text-4xl font-bold mb-8 text-center">
          GitHub Actions Reporter
        </h1>
        <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg p-4 sm:p-6 md:p-8">
          <FileUploader onDataLoaded={handleDataLoaded} />
          <ActionDownloader onDataLoaded={handleDataLoaded} />
        </div>
        {data.length > 0 && (
          <div className="mt-8">
            <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg p-4 sm:p-6 md:p-8">
              <ActionsTable data={data} />
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
