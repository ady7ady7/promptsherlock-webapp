import '@testing-library/jest-dom'
import { beforeAll, afterEach, afterAll } from 'vitest'
import { cleanup } from '@testing-library/react'
import { server } from './mocks/server'

// Mock framer-motion to avoid animation issues in tests
vi.mock('framer-motion', () => ({
  motion: {
    div: 'div',
    button: 'button',
    form: 'form',
    img: 'img',
    h1: 'h1',
    h2: 'h2',
    h3: 'h3',
    p: 'p',
    span: 'span'
  },
  AnimatePresence: ({ children }) => children
}))

// Mock react-router-dom
vi.mock('react-router-dom', () => ({
  Link: ({ children, to, ...props }) => 
    <a href={to} {...props}>{children}</a>,
  useLocation: () => ({ pathname: '/' }),
  BrowserRouter: ({ children }) => children,
  Routes: ({ children }) => children,
  Route: ({ element }) => element
}))

// Mock react-dropzone
vi.mock('react-dropzone', () => ({
  useDropzone: () => ({
    getRootProps: () => ({
      'data-testid': 'dropzone'
    }),
    getInputProps: () => ({
      'data-testid': 'file-input'
    }),
    isDragActive: false,
    isDragAccept: false,
    isDragReject: false,
    open: vi.fn()
  })
}))

// Setup MSW server
beforeAll(() => server.listen())
afterEach(() => {
  cleanup()
  server.resetHandlers()
})
afterAll(() => server.close())

// Global test utilities
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn()
}))

global.IntersectionObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  disconnect: vi.fn()
}))

// Mock window.scrollTo
Object.defineProperty(window, 'scrollTo', {
  value: vi.fn(),
  writable: true
})