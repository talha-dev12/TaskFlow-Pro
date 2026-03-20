// tests/components.test.tsx
// React Testing Library – component tests for meaningful user interactions (60%+, 70%+)

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';

// ── Mock react-router-dom ──────────────────────────────────────────────────────
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => jest.fn(),
  useLocation: () => ({ state: null, pathname: '/login' }),
  Link: ({
    children,
    to,
    ...rest
  }: {
    children: React.ReactNode;
    to: string;
    [key: string]: unknown;
  }) => (
    <a href={to} {...rest}>
      {children}
    </a>
  ),
}));

// ── Mock AuthContext ───────────────────────────────────────────────────────────
const mockLogin    = jest.fn();
const mockRegister = jest.fn();
const mockLogout   = jest.fn();

jest.mock('../src/context/AuthContext', () => ({
  useAuth: () => ({
    user: { id: 1, name: 'Test User', email: 'test@example.com', role: 'USER' },
    isAuthenticated: true,
    isLoading: false,
    login:    mockLogin,
    register: mockRegister,
    logout:   mockLogout,
  }),
  AuthProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

// ── Import components under test ───────────────────────────────────────────────
import { Button }     from '../src/components/ui/Button';
import { Input }      from '../src/components/ui/Input';
import { Badge }      from '../src/components/ui/Badge';
import { Spinner }    from '../src/components/ui/Spinner';
import { Modal }      from '../src/components/ui/Modal';
import { ProjectForm } from '../src/components/ProjectForm';
import { TaskForm }   from '../src/components/TaskForm';
import { Navbar }     from '../src/components/Navbar';

// ─────────────────────────────────────────────────────────────────────────────
// Button tests
// ─────────────────────────────────────────────────────────────────────────────
describe('Button component', () => {
  it('renders children correctly', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByRole('button', { name: /click me/i })).toBeInTheDocument();
  });

  it('shows loading state with Loading text', () => {
    render(<Button isLoading>Submit</Button>);
    const btn = screen.getByRole('button');
    expect(btn).toBeDisabled();
    expect(btn).toHaveAttribute('aria-busy', 'true');
    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });

  it('calls onClick when clicked', async () => {
    const onClick = jest.fn();
    render(<Button onClick={onClick}>Click</Button>);
    await userEvent.click(screen.getByRole('button'));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('does not call onClick when disabled', async () => {
    const onClick = jest.fn();
    render(<Button onClick={onClick} disabled>Click</Button>);
    await userEvent.click(screen.getByRole('button'));
    expect(onClick).not.toHaveBeenCalled();
  });

  it('applies danger variant class', () => {
    render(<Button variant="danger">Delete</Button>);
    expect(screen.getByRole('button')).toHaveClass('bg-red-600');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Input tests
// ─────────────────────────────────────────────────────────────────────────────
describe('Input component', () => {
  it('renders label and input', () => {
    render(<Input label="Email" />);
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
  });

  it('displays error message with role=alert', () => {
    render(<Input label="Email" error="Email is required." />);
    const alert = screen.getByRole('alert');
    expect(alert).toHaveTextContent('Email is required.');
  });

  it('marks input as aria-invalid when error is present', () => {
    render(<Input label="Email" error="Required" />);
    expect(screen.getByLabelText(/email/i)).toHaveAttribute('aria-invalid', 'true');
  });

  it('does not show error when error prop is absent', () => {
    render(<Input label="Email" />);
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('accepts user input', async () => {
    render(<Input label="Name" />);
    const input = screen.getByLabelText(/name/i);
    await userEvent.type(input, 'Jane');
    expect(input).toHaveValue('Jane');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Badge tests
// ─────────────────────────────────────────────────────────────────────────────
describe('Badge component', () => {
  it('renders text content', () => {
    render(<Badge>In Progress</Badge>);
    expect(screen.getByText('In Progress')).toBeInTheDocument();
  });

  it('applies success variant styles', () => {
    const { container } = render(<Badge variant="success">Done</Badge>);
    expect(container.firstChild).toHaveClass('bg-green-50');
  });

  it('applies danger variant styles', () => {
    const { container } = render(<Badge variant="danger">High</Badge>);
    expect(container.firstChild).toHaveClass('bg-red-50');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Spinner tests
// ─────────────────────────────────────────────────────────────────────────────
describe('Spinner component', () => {
  it('renders with accessible label', () => {
    render(<Spinner />);
    expect(screen.getByRole('status')).toBeInTheDocument();
    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });

  it('accepts custom label', () => {
    render(<Spinner label="Fetching data…" />);
    expect(screen.getByText(/fetching data/i)).toBeInTheDocument();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Modal tests
// ─────────────────────────────────────────────────────────────────────────────
describe('Modal component', () => {
  it('does not render when isOpen=false', () => {
    render(
      <Modal isOpen={false} onClose={jest.fn()} title="Test Modal">
        <p>Content</p>
      </Modal>
    );
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('renders when isOpen=true', () => {
    render(
      <Modal isOpen={true} onClose={jest.fn()} title="Test Modal">
        <p>Content</p>
      </Modal>
    );
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('Test Modal')).toBeInTheDocument();
    expect(screen.getByText('Content')).toBeInTheDocument();
  });

  it('calls onClose when close button is clicked', async () => {
    const onClose = jest.fn();
    render(
      <Modal isOpen={true} onClose={onClose} title="Test">
        <p>Body</p>
      </Modal>
    );
    await userEvent.click(screen.getByLabelText(/close modal/i));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('calls onClose when Escape key is pressed', () => {
    const onClose = jest.fn();
    render(
      <Modal isOpen={true} onClose={onClose} title="Test">
        <p>Body</p>
      </Modal>
    );
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onClose).toHaveBeenCalled();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// ProjectForm tests
// ─────────────────────────────────────────────────────────────────────────────
describe('ProjectForm component', () => {
  it('renders title and description fields', () => {
    render(<ProjectForm onSubmit={jest.fn()} onCancel={jest.fn()} isLoading={false} />);
    expect(screen.getByLabelText(/project title/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/description/i)).toBeInTheDocument();
  });

  it('shows validation error when submitted empty', async () => {
    render(<ProjectForm onSubmit={jest.fn()} onCancel={jest.fn()} isLoading={false} />);
    await userEvent.click(screen.getByRole('button', { name: /create project/i }));
    expect(await screen.findByText(/title is required/i)).toBeInTheDocument();
  });

  it('calls onSubmit with correct data when form is valid', async () => {
    const onSubmit = jest.fn().mockResolvedValue(undefined);
    render(<ProjectForm onSubmit={onSubmit} onCancel={jest.fn()} isLoading={false} />);
    await userEvent.type(screen.getByLabelText(/project title/i), 'My New Project');
    await userEvent.click(screen.getByRole('button', { name: /create project/i }));
    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({ title: 'My New Project' })
      );
    });
  });

  it('calls onCancel when cancel button is clicked', async () => {
    const onCancel = jest.fn();
    render(<ProjectForm onSubmit={jest.fn()} onCancel={onCancel} isLoading={false} />);
    await userEvent.click(screen.getByRole('button', { name: /cancel/i }));
    expect(onCancel).toHaveBeenCalled();
  });

  it('shows "Save Changes" when editing an existing project', () => {
    const project = { id: 1, title: 'Existing', description: 'Desc', ownerId: 1, createdAt: '', updatedAt: '' };
    render(<ProjectForm initialData={project} onSubmit={jest.fn()} onCancel={jest.fn()} isLoading={false} />);
    expect(screen.getByRole('button', { name: /save changes/i })).toBeInTheDocument();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// TaskForm tests
// ─────────────────────────────────────────────────────────────────────────────
describe('TaskForm component', () => {
  it('renders all task form fields', () => {
    render(<TaskForm onSubmit={jest.fn()} onCancel={jest.fn()} isLoading={false} />);
    expect(screen.getByLabelText(/task title/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/priority/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/status/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/due date/i)).toBeInTheDocument();
  });

  it('shows validation error when title is missing', async () => {
    render(<TaskForm onSubmit={jest.fn()} onCancel={jest.fn()} isLoading={false} />);
    await userEvent.click(screen.getByRole('button', { name: /create task/i }));
    expect(await screen.findByText(/title is required/i)).toBeInTheDocument();
  });

  it('submits with correct data', async () => {
    const onSubmit = jest.fn().mockResolvedValue(undefined);
    render(<TaskForm onSubmit={onSubmit} onCancel={jest.fn()} isLoading={false} />);
    await userEvent.type(screen.getByLabelText(/task title/i), 'Fix the bug');
    await userEvent.click(screen.getByRole('button', { name: /create task/i }));
    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({ title: 'Fix the bug' }));
    });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Navbar tests
// ─────────────────────────────────────────────────────────────────────────────
describe('Navbar component', () => {
  it('renders the brand name', () => {
    render(<Navbar />);
    expect(screen.getByLabelText(/taskflow pro home/i)).toBeInTheDocument();
  });

  it('shows user name', () => {
    render(<Navbar />);
    expect(screen.getByText('Test User')).toBeInTheDocument();
  });

  it('calls logout when logout button is clicked', async () => {
    render(<Navbar />);
    await userEvent.click(screen.getByLabelText(/log out/i));
    expect(mockLogout).toHaveBeenCalled();
  });
});
