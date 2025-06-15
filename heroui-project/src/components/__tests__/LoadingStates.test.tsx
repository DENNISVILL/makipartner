import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '../../utils/testUtils';
import {
  LoadingSpinner,
  PageLoader,
  CardSkeleton,
  TableSkeleton,
  EmptyState,
  ErrorState,
  AsyncWrapper,
  ProgressLoader,
  useLoadingState
} from '../LoadingStates';

describe('LoadingStates Components', () => {
  describe('LoadingSpinner', () => {
    it('renders with default props', () => {
      render(<LoadingSpinner />);
      const spinner = screen.getByRole('status');
      expect(spinner).toBeInTheDocument();
      expect(spinner).toHaveAttribute('aria-label', 'Cargando...');
    });

    it('renders with custom size and color', () => {
      render(<LoadingSpinner size="lg" color="primary" />);
      const spinner = screen.getByRole('status');
      expect(spinner).toBeInTheDocument();
    });

    it('renders with custom label', () => {
      const customLabel = 'Procesando datos...';
      render(<LoadingSpinner label={customLabel} />);
      const spinner = screen.getByRole('status');
      expect(spinner).toHaveAttribute('aria-label', customLabel);
    });
  });

  describe('PageLoader', () => {
    it('renders page loader with message', () => {
      const message = 'Cargando página...';
      render(<PageLoader message={message} />);
      
      expect(screen.getByText(message)).toBeInTheDocument();
      expect(screen.getByRole('status')).toBeInTheDocument();
    });

    it('renders without message', () => {
      render(<PageLoader />);
      expect(screen.getByRole('status')).toBeInTheDocument();
    });
  });

  describe('EmptyState', () => {
    it('renders empty state with title and description', () => {
      const title = 'No hay datos';
      const description = 'No se encontraron elementos';
      
      render(<EmptyState title={title} description={description} />);
      
      expect(screen.getByText(title)).toBeInTheDocument();
      expect(screen.getByText(description)).toBeInTheDocument();
    });

    it('renders with action button', async () => {
      const user = userEvent.setup();
      const mockAction = jest.fn();
      const actionText = 'Crear nuevo';
      
      render(
        <EmptyState
          title="Sin elementos"
          description="Lista vacía"
          action={mockAction}
          actionText={actionText}
        />
      );
      
      const button = screen.getByRole('button', { name: actionText });
      expect(button).toBeInTheDocument();
      
      await user.click(button);
      expect(mockAction).toHaveBeenCalledTimes(1);
    });
  });

  describe('ErrorState', () => {
    it('renders error state with message', () => {
      const error = 'Error de conexión';
      render(<ErrorState error={error} />);
      
      expect(screen.getByText(/error de conexión/i)).toBeInTheDocument();
    });

    it('renders with retry button', async () => {
      const user = userEvent.setup();
      const mockRetry = jest.fn();
      
      render(<ErrorState error="Error" onRetry={mockRetry} />);
      
      const retryButton = screen.getByRole('button', { name: /reintentar/i });
      expect(retryButton).toBeInTheDocument();
      
      await user.click(retryButton);
      expect(mockRetry).toHaveBeenCalledTimes(1);
    });
  });

  describe('AsyncWrapper', () => {
    it('shows loading state', () => {
      render(
        <AsyncWrapper loading={true} error={null}>
          <div>Content</div>
        </AsyncWrapper>
      );
      
      expect(screen.getByRole('status')).toBeInTheDocument();
      expect(screen.queryByText('Content')).not.toBeInTheDocument();
    });

    it('shows error state', () => {
      const error = 'Test error';
      render(
        <AsyncWrapper loading={false} error={error}>
          <div>Content</div>
        </AsyncWrapper>
      );
      
      expect(screen.getByText(/test error/i)).toBeInTheDocument();
      expect(screen.queryByText('Content')).not.toBeInTheDocument();
    });

    it('shows content when not loading and no error', () => {
      render(
        <AsyncWrapper loading={false} error={null}>
          <div>Content</div>
        </AsyncWrapper>
      );
      
      expect(screen.getByText('Content')).toBeInTheDocument();
      expect(screen.queryByRole('status')).not.toBeInTheDocument();
    });
  });

  describe('ProgressLoader', () => {
    it('renders with progress value', () => {
      render(<ProgressLoader progress={50} label="Subiendo archivo..." />);
      
      expect(screen.getByText('Subiendo archivo...')).toBeInTheDocument();
      expect(screen.getByText('50%')).toBeInTheDocument();
    });

    it('renders indeterminate progress', () => {
      render(<ProgressLoader label="Procesando..." />);
      
      expect(screen.getByText('Procesando...')).toBeInTheDocument();
      expect(screen.queryByText('%')).not.toBeInTheDocument();
    });
  });
});

// Test del hook useLoadingState
const TestComponent: React.FC = () => {
  const { isLoading, startLoading, stopLoading, withLoading } = useLoadingState();

  const handleAsyncAction = () => {
    withLoading(async () => {
      await new Promise(resolve => setTimeout(resolve, 100));
    });
  };

  return (
    <div>
      <div data-testid="loading-state">{isLoading ? 'loading' : 'idle'}</div>
      <button onClick={startLoading}>Start Loading</button>
      <button onClick={stopLoading}>Stop Loading</button>
      <button onClick={handleAsyncAction}>Async Action</button>
    </div>
  );
};

describe('useLoadingState Hook', () => {
  it('manages loading state correctly', async () => {
    const user = userEvent.setup();
    render(<TestComponent />);
    
    const loadingState = screen.getByTestId('loading-state');
    const startButton = screen.getByRole('button', { name: 'Start Loading' });
    const stopButton = screen.getByRole('button', { name: 'Stop Loading' });
    
    // Estado inicial
    expect(loadingState).toHaveTextContent('idle');
    
    // Iniciar carga
    await user.click(startButton);
    expect(loadingState).toHaveTextContent('loading');
    
    // Detener carga
    await user.click(stopButton);
    expect(loadingState).toHaveTextContent('idle');
  });

  it('handles async operations with withLoading', async () => {
    const user = userEvent.setup();
    render(<TestComponent />);
    
    const loadingState = screen.getByTestId('loading-state');
    const asyncButton = screen.getByRole('button', { name: 'Async Action' });
    
    // Estado inicial
    expect(loadingState).toHaveTextContent('idle');
    
    // Ejecutar acción async
    await user.click(asyncButton);
    
    // Debería mostrar loading temporalmente
    expect(loadingState).toHaveTextContent('loading');
    
    // Esperar a que termine la operación async
    await waitFor(() => {
      expect(loadingState).toHaveTextContent('idle');
    }, { timeout: 200 });
  });
});