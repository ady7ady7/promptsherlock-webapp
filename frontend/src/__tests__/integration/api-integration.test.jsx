import { describe, it, expect, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import App from '@/App'

describe('API Integration Tests', () => {
  it('completes full upload and analysis flow', async () => {
    const user = userEvent.setup()
    render(<App />)
    
    // Wait for app to load
    await waitFor(() => {
      expect(screen.getByText(/imageanalyzer/i)).toBeInTheDocument()
    })
    
    // Test file upload
    const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' })
    const input = screen.getByTestId('file-input')
    await user.upload(input, file)
    
    // Add custom prompt
    const promptInput = screen.getByRole('textbox', { name: /custom analysis prompt/i })
    await user.type(promptInput, 'Test analysis prompt')
    
    // Submit analysis
    const submitButton = screen.getByRole('button', { name: /analyze.*images?/i })
    await user.click(submitButton)
    
    // Verify loading state
    expect(screen.getByText(/analyzing your images/i)).toBeInTheDocument()
    
    // Wait for results
    await waitFor(() => {
      expect(screen.getByText(/analysis complete/i)).toBeInTheDocument()
      expect(screen.getByText(/test analysis for 1 image/i)).toBeInTheDocument()
    }, { timeout: 5000 })
  })

  it('handles multiple file upload', async () => {
    const user = userEvent.setup()
    render(<App />)
    
    const files = [
      new File(['1'], '1.jpg', { type: 'image/jpeg' }),
      new File(['2'], '2.jpg', { type: 'image/jpeg' }),
      new File(['3'], '3.jpg', { type: 'image/jpeg' })
    ]
    
    const input = screen.getByTestId('file-input')
    await user.upload(input, files)
    
    await waitFor(() => {
      expect(screen.getByText(/selected images \(3\/10\)/i)).toBeInTheDocument()
    })
    
    const submitButton = screen.getByRole('button', { name: /analyze 3 images/i })
    await user.click(submitButton)
    
    await waitFor(() => {
      expect(screen.getByText(/test analysis for 3 image/i)).toBeInTheDocument()
    }, { timeout: 5000 })
  })

  it('handles network errors gracefully', async () => {
    // Mock network failure
    const originalFetch = global.fetch
    global.fetch = vi.fn().mockRejectedValue(new Error('Network error'))
    
    const user = userEvent.setup()
    render(<App />)
    
    const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' })
    const input = screen.getByTestId('file-input')
    await user.upload(input, file)
    
    const submitButton = screen.getByRole('button', { name: /analyze.*images?/i })
    await user.click(submitButton)
    
    await waitFor(() => {
      expect(screen.getByText(/network error/i)).toBeInTheDocument()
    })
    
    // Restore fetch
    global.fetch = originalFetch
  })

  it('respects file size limits', async () => {
    const user = userEvent.setup()
    render(<App />)
    
    // Create file larger than 10MB
    const largeFile = new File(['x'.repeat(11 * 1024 * 1024)], 'large.jpg', { 
      type: 'image/jpeg' 
    })
    
    const input = screen.getByTestId('file-input')
    await user.upload(input, largeFile)
    
    await waitFor(() => {
      expect(screen.getByText(/file too large/i)).toBeInTheDocument()
    })
  })

  it('respects file count limits', async () => {
    const user = userEvent.setup()
    render(<App />)
    
    // Create 11 files (over the limit of 10)
    const files = Array.from({ length: 11 }, (_, i) => 
      new File([`${i}`], `${i}.jpg`, { type: 'image/jpeg' })
    )
    
    const input = screen.getByTestId('file-input')
    await user.upload(input, files)
    
    await waitFor(() => {
      expect(screen.getByText(/maximum.*files/i)).toBeInTheDocument()
    })
  })
})