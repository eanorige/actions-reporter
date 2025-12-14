import Papa from 'papaparse'

export interface ActionData {
  [key: string]: string | number | undefined
  id?: number
  name: string
  status: string
  branch: string
  timestamp: string
  duration?: number // in seconds
}

export const parseLog = (file: File): Promise<ActionData[]> => {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      dynamicTyping: true,
      complete: (results) => {
        resolve(results.data as ActionData[])
      },
      error: (error) => {
        reject(error)
      },
    })
  })
}
