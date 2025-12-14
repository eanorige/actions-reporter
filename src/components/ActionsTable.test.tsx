import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import ActionsTable from './ActionsTable'
import { ActionData } from '@/lib/logParser'

// Mock Recharts to avoid rendering issues in JSDOM
jest.mock('recharts', () => {
  const OriginalModule = jest.requireActual('recharts')
  return {
    ...OriginalModule,
    ResponsiveContainer: ({ children }: { children: React.ReactNode }) => (
      <div className="recharts-responsive-container">{children}</div>
    ),
    BarChart: ({ children }: { children: React.ReactNode }) => (
      <div className="recharts-bar-chart">{children}</div>
    ),
    Bar: () => <div className="recharts-bar" />,
    XAxis: () => <div className="recharts-x-axis" />,
    YAxis: () => <div className="recharts-y-axis" />,
    Tooltip: () => <div className="recharts-tooltip" />,
    Cell: () => <div className="recharts-cell" />,
  }
})

const mockData: ActionData[] = [
  {
    name: 'Test Action 1',
    status: 'success',
    timestamp: '2023-01-01T10:00:00Z',
    duration: 100,
    branch: 'main',
  },
  {
    name: 'Test Action 1',
    status: 'failure',
    timestamp: '2023-01-02T10:00:00Z',
    duration: 50,
    branch: 'main',
  },
  {
    name: 'Test Action 2',
    status: 'success',
    timestamp: '2023-01-01T12:00:00Z',
    duration: 200,
    branch: 'develop',
  },
]

describe('ActionsTable', () => {
  it('renders action groups correctly', () => {
    render(<ActionsTable data={mockData} />)

    expect(screen.getByText('Test Action 1')).toBeInTheDocument()
    expect(screen.getByText('Test Action 2')).toBeInTheDocument()
  })

  it('expands action row on click', () => {
    render(<ActionsTable data={mockData} />)

    const expandButtons = screen.getAllByTitle('Expand')
    fireEvent.click(expandButtons[0])

    // Check if stats are displayed
    expect(screen.getByText('Success Rate:')).toBeInTheDocument()
    expect(screen.getByText('50.0%')).toBeInTheDocument() // 1 success out of 2
  })

  it('displays n/a for missing pass/fail stats', () => {
    const singleStatusData: ActionData[] = [
      {
        name: 'Success Only',
        status: 'success',
        timestamp: '2023-01-01T10:00:00Z',
        duration: 100,
        branch: 'main',
      },
    ]

    render(<ActionsTable data={singleStatusData} />)

    const expandButton = screen.getByTitle('Expand')
    fireEvent.click(expandButton)

    expect(screen.getByText('Avg Fail Runtime:')).toBeInTheDocument()
    expect(screen.getByText('n/a')).toBeInTheDocument()
  })
})
