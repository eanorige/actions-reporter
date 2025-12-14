import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import ActionDownloader from './ActionDownloader'
import * as storage from '@/lib/storage'

// Mock storage
jest.mock('@/lib/storage', () => ({
  getStoredActions: jest.fn(),
  storeActions: jest.fn(),
  clearStoredActions: jest.fn(),
}))

// Mock Papa Parse
jest.mock('papaparse', () => ({
  unparse: jest.fn(),
}))

describe('ActionDownloader', () => {
  const mockOnDataLoaded = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders inputs correctly', () => {
    ;(storage.getStoredActions as jest.Mock).mockReturnValue([])
    render(<ActionDownloader onDataLoaded={mockOnDataLoaded} />)

    expect(screen.getByPlaceholderText(/Personal Access Token/)).toBeInTheDocument()
    expect(screen.getByPlaceholderText(/owner\/repository/)).toBeInTheDocument()
  })

  it('loads cached data', () => {
    const mockData = [{ name: 'Test', status: 'success' }]
    ;(storage.getStoredActions as jest.Mock).mockReturnValue(mockData)

    render(<ActionDownloader onDataLoaded={mockOnDataLoaded} />)

    const loadButton = screen.getByText(/Load Cache/)
    fireEvent.click(loadButton)

    expect(mockOnDataLoaded).toHaveBeenCalledWith(mockData)
  })

  it('clears cache', () => {
    ;(storage.getStoredActions as jest.Mock).mockReturnValue([{ name: 'Test' }])
    render(<ActionDownloader onDataLoaded={mockOnDataLoaded} />)

    const clearButton = screen.getByText(/Clear/)
    fireEvent.click(clearButton)

    expect(storage.clearStoredActions).toHaveBeenCalled()
    expect(mockOnDataLoaded).toHaveBeenCalledWith([])
  })
})
