import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import ImageUploader from '@components/ImageUploader'

describe('ImageUploader Component', () => {
  const mockOnImagesChange = vi.fn()
  
  const defaultProps = {
    onImagesChange: mockOnImagesChange,
    maxFiles: 10,
    maxFileSize: 10 * 1024 * 1024,
    disabled: false,
    loading: false
  }

  beforeEach(() => {
    mockOnImagesChange.mockClear()
  })

  it('renders upload interface correctly', () => {
    render(<ImageUploader {...defaultProps} />)
    
    expect(screen.getByText(/upload your images/i)).toBeInTheDocument()
    expect(screen.getByText(/drag and drop images here/i)).toBeInTheDocument()
    expect(screen.getByTestId('dropzone')).toBeInTheDocument()
  })

  it('shows correct file limits', () => {
    render(<ImageUploader {...defaultProps} />)
    
    expect(screen.getByText(/up to 10 more files/i)).toBeInTheDocument()
    expect(screen.getByText(/max 10mb each/i)).toBeInTheDocument()
  })

  it('handles file upload', async () => {
    const user = userEvent.setup()
    render(<ImageUploader {...defaultProps} />)
    
    const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' })
    const input = screen.getByTestId('file-input')
    
    await user.upload(input, file)
    
    await waitFor(() => {
      expect(mockOnImagesChange).toHaveBeenCalled()
    })
  })

  it('shows error for invalid file type', async () => {
    const user = userEvent.setup()
    render(<ImageUploader {...defaultProps} />)
    
    const file = new File(['test'], 'test.txt', { type: 'text/plain' })
    const input = screen.getByTestId('file-input')
    
    await user.upload(input, file)
    
    await waitFor(() => {
      expect(screen.getByText(/invalid file type/i)).toBeInTheDocument()
    })
  })

  it('shows error for file too large', async () => {
    const user = userEvent.setup()
    render(<ImageUploader {...defaultProps} maxFileSize={1024} />)
    
    const largeFile = new File(['x'.repeat(2048)], 'large.jpg', { type: 'image/jpeg' })
    const input = screen.getByTestId('file-input')
    
    await user.upload(input, largeFile)
    
    await waitFor(() => {
      expect(screen.getByText(/file too large/i)).toBeInTheDocument()
    })
  })

  it('prevents upload when disabled', () => {
    render(<ImageUploader {...defaultProps} disabled={true} />)
    
    const dropzone = screen.getByTestId('dropzone')
    expect(dropzone).toHaveClass('opacity-50', 'cursor-not-allowed')
  })

  it('shows loading state', () => {
    render(<ImageUploader {...defaultProps} loading={true} />)
    
    expect(screen.getByText(/uploading images/i)).toBeInTheDocument()
    expect(screen.getByRole('progressbar', { hidden: true })).toBeInTheDocument()
  })

  it('handles maximum files limit', async () => {
    const user = userEvent.setup()
    render(<ImageUploader {...defaultProps} maxFiles={2} />)
    
    const files = [
      new File(['1'], '1.jpg', { type: 'image/jpeg' }),
      new File(['2'], '2.jpg', { type: 'image/jpeg' }),
      new File(['3'], '3.jpg', { type: 'image/jpeg' })
    ]
    
    const input = screen.getByTestId('file-input')
    await user.upload(input, files)
    
    await waitFor(() => {
      expect(screen.getByText(/can only add \d+ more file/i)).toBeInTheDocument()
    })
  })

  it('removes images correctly', async () => {
    const user = userEvent.setup()
    const initialImages = [
      {
        id: '1',
        file: new File(['test'], 'test.jpg', { type: 'image/jpeg' }),
        name: 'test.jpg',
        size: 1024,
        preview: 'blob:test'
      }
    ]
    
    render(<ImageUploader {...defaultProps} initialImages={initialImages} />)
    
    const removeButton = screen.getByLabelText(/remove test\.jpg/i)
    await user.click(removeButton)
    
    expect(mockOnImagesChange).toHaveBeenCalledWith([])
  })
})