import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ErrorBoundary } from '@/components/ErrorBoundary';

// Component that throws an error
function ThrowError({ shouldThrow }: { shouldThrow: boolean }) {
  if (shouldThrow) {
    throw new Error('Test error message');
  }
  return <div>No error</div>;
}

describe('ErrorBoundary', () => {
  it('renders children when there is no error', () => {
    render(
      <ErrorBoundary>
        <div data-testid="child-component">Child content</div>
      </ErrorBoundary>
    );

    expect(screen.getByTestId('child-component')).toBeInTheDocument();
    expect(screen.getByText('Child content')).toBeInTheDocument();
  });

  it('renders error UI when child component throws', () => {
    // Suppress console.error for this test
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(screen.getByText(/Oops! Something went wrong/i)).toBeInTheDocument();
    expect(screen.getByTestId('button-try-again')).toBeInTheDocument();
    expect(screen.getByTestId('button-reload-page')).toBeInTheDocument();
    expect(screen.getByTestId('button-go-home')).toBeInTheDocument();

    consoleSpy.mockRestore();
  });

  it('shows error details in development mode', () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'development';
    
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(screen.getByText(/Test error message/i)).toBeInTheDocument();

    process.env.NODE_ENV = originalEnv;
    consoleSpy.mockRestore();
  });

  it('resets error state when Try Again is clicked', async () => {
    const user = userEvent.setup();
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const { rerender } = render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(screen.getByText(/Oops! Something went wrong/i)).toBeInTheDocument();

    await user.click(screen.getByTestId('button-try-again'));

    rerender(
      <ErrorBoundary>
        <ThrowError shouldThrow={false} />
      </ErrorBoundary>
    );

    expect(screen.getByText('No error')).toBeInTheDocument();

    consoleSpy.mockRestore();
  });

  it('reloads page when Reload Page is clicked', async () => {
    const user = userEvent.setup();
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const reloadSpy = vi.fn();
    
    Object.defineProperty(window, 'location', {
      value: { reload: reloadSpy },
      writable: true,
    });

    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    await user.click(screen.getByTestId('button-reload-page'));

    expect(reloadSpy).toHaveBeenCalled();

    consoleSpy.mockRestore();
  });

  it('navigates home when Go Home is clicked', async () => {
    const user = userEvent.setup();
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    
    Object.defineProperty(window, 'location', {
      value: { href: '' },
      writable: true,
    });

    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    await user.click(screen.getByTestId('button-go-home'));

    expect(window.location.href).toBe('/');

    consoleSpy.mockRestore();
  });

  it('stores error in localStorage', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const setItemSpy = vi.spyOn(Storage.prototype, 'setItem');

    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(setItemSpy).toHaveBeenCalledWith(
      'errorLogs',
      expect.stringContaining('Test error message')
    );

    consoleSpy.mockRestore();
    setItemSpy.mockRestore();
  });

  it('renders custom fallback when provided', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    
    const CustomFallback = <div data-testid="custom-fallback">Custom error UI</div>;

    render(
      <ErrorBoundary fallback={CustomFallback}>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(screen.getByTestId('custom-fallback')).toBeInTheDocument();
    expect(screen.getByText('Custom error UI')).toBeInTheDocument();
    expect(screen.queryByText(/Oops! Something went wrong/i)).not.toBeInTheDocument();

    consoleSpy.mockRestore();
  });

  it('shows multiple error warning after repeated errors', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const { rerender } = render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    // Simulate multiple errors by re-rendering
    for (let i = 0; i < 3; i++) {
      rerender(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );
    }

    expect(screen.getByText(/Multiple errors detected/i)).toBeInTheDocument();

    consoleSpy.mockRestore();
  });
});