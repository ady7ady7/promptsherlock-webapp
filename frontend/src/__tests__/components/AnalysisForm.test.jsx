import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import AnalysisForm from '@components/AnalysisForm'

// Mock ImageUploader component
vi.mock('@components/ImageUploader', () => ({
  default: ({ onImagesChange, disabled }) => (
    <div data-testid="image-uploader">
      <button 
        onClick={() => onImagesChange([{ id: '1', name: 'test.jpg' }])}
        disabled={disabled}
      >
        Add Test Image
      </button>
    </div>
  )
}))

describe('AnalysisForm Component', () => {
  const mockOnAnalysisComplete = vi.fn()
  
  const defaultProps = {
    apiUrl: 'http://localhost:5000',
    onAnalysisComplete: mockOnAnalysisComplete
  }

  beforeEach(() => {
    mockOnAnalysisComplete.mockClear()
  })

  it('renders form elements correctly', () => {
    render(<AnalysisForm {...defaultProps} />)
    
    expect(screen.getByTestId('image-uploader')).toBeInTheDocument()
    expect(screen.getByRole('textbox', { name: /custom analysis prompt/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /analyze.*images?/i })).toBeInTheDocument()
  })

  it('submit button is disabled when no images', () => {
    render(<AnalysisForm {...defaultProps} />)
    
    const submitButton = screen.getByRole('button', { name: /analyze.*images?/i })
    expect(submitButton).toBeDisabled()
  })

  it('enables submit button when images are added', async () => {
    const user = userEvent.setup()
    render(<AnalysisForm {...defaultProps} />)
    
    const addImageButton = screen.getByText('Add Test Image')
    await user.click(addImageButton)
    
    await waitFor(() => {
      const submitButton = screen.getByRole('button', { name: /analyze.*images?/i })
      expect(submitButton).not.toBeDisabled()
    })
  })

  it('validates prompt length', async () => {
    const user = userEvent.setup()
    render(<AnalysisForm {...defaultProps} />)
    
    const promptInput = screen.getByRole('textbox', { name: /custom analysis prompt/i })
    const longPrompt = 'x'.repeat(1001)
    
    await user.type(promptInput, longPrompt)
    
    await waitFor(() => {
      expect(screen.getByText(/prompt must be less than 1000 characters/i)).toBeInTheDocument()
    })
  })

  it('shows loading state during analysis', async () => {
    const user = userEvent.setup()
    render(<AnalysisForm {...defaultProps} />)
    
    // Add image
    const addImageButton = screen.getByText('Add Test Image')
    await user.click(addImageButton)
    
    // Submit form
    await waitFor(async () => {
      const submitButton = screen.getByRole('button', { name: /analyze.*images?/i })
      await user.click(submitButton)
    })
    
    expect(screen.getByText(/analyzing your images/i)).toBeInTheDocument()
    expect(screen.getByText(/this usually takes 30-60 seconds/i)).toBeInTheDocument()
  })

  it('displays analysis results', async () => {
    const user = userEvent.setup()
    render(<AnalysisForm {...defaultProps} />)
    
    // Add image and submit
    const addImageButton = screen.getByText('Add Test Image')
    await user.click(addImageButton)
    
    await waitFor(async () => {
      const submitButton = screen.getByRole('button', { name: /analyze.*images?/i })
      await user.click(submitButton)
    })
    
    await waitFor(() => {
      expect(screen.getByText(/analysis complete/i)).toBeInTheDocument()
      expect(screen.getByText(/test analysis for 1 image/i)).toBeInTheDocument()
    })
  })

  it('handles API errors gracefully', async () => {
    // Override MSW handler for error scenario
    const user = userEvent.setup()
    render(<AnalysisForm {...defaultProps} apiUrl="http://localhost:5000" />)
    
    // Add image and submit - this will trigger error handler
    const addImageButton = screen.getByText('Add Test Image')
    await user.click(addImageButton)
    
    // Mock a network error
    vi.mocked(fetch).mockRejectedValueOnce(new Error('Network error'))
    
    await waitFor(async () => {
      const submitButton = screen.getByRole('button', { name: /analyze.*images?/i })
      await user.click(submitButton)
    })
    
    await waitFor(() => {
      expect(screen.getByText(/analysis failed/i)).toBeInTheDocument()
    })
  })

  it('allows form reset after analysis', async () => {
    const user = userEvent.setup()
    render(<AnalysisForm {...defaultProps} />)
    
    // Complete analysis flow
    const addImageButton = screen.getByText('Add Test Image')
    await user.click(addImageButton)
    
    await waitFor(async () => {
      const submitButton = screen.getByRole('button', { name: /analyze.*images?/i })
      await user.click(submitButton)
    })
    
    await waitFor(() => {
      expect(screen.getByText(/analysis complete/i)).toBeInTheDocument()
    })
    
    // Click reset
    const resetButton = screen.getByText(/analyze new images/i)
    await user.click(resetButton)
    
    expect(screen.getByText(/upload your images/i)).toBeInTheDocument()
  })
})