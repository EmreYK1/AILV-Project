import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import ProtectedRoute from '../../components/ProtectedRoute';
import SlidesGeneratePage from '../../pages/SlidesGeneratePage';

// useAuth wird pro Test mit dem gewuenschten Login-Zustand verdrahtet.
const mockUseAuth = vi.fn();

vi.mock('../../context/AuthContext', () => ({
  useAuth: () => mockUseAuth(),
}));

describe('SlidesGeneratePage – Routing', () => {
  it('leitet nicht eingeloggte Nutzer von /slides/generate auf /login um', () => {
    mockUseAuth.mockReturnValue({
      token: null,
      isAuthenticated: false,
      login: vi.fn(),
      logout: vi.fn(),
    });

    render(
      <MemoryRouter initialEntries={['/slides/generate']}>
        <Routes>
          <Route
            path="/slides/generate"
            element={
              <ProtectedRoute>
                <SlidesGeneratePage />
              </ProtectedRoute>
            }
          />
          <Route path="/login" element={<div>Login Seite</div>} />
        </Routes>
      </MemoryRouter>,
    );

    // Nach der Weiterleitung wird die Login-Seite gerendert.
    expect(screen.getByText('Login Seite')).toBeInTheDocument();
    // Die geschuetzte Seite darf nicht angezeigt werden.
    expect(screen.queryByRole('heading', { name: 'Folien generieren' })).not.toBeInTheDocument();
  });

  it('zeigt die Seite mit Formular fuer eingeloggte Nutzer', () => {
    mockUseAuth.mockReturnValue({
      token: 'jwt-token',
      isAuthenticated: true,
      login: vi.fn(),
      logout: vi.fn(),
    });

    render(
      <MemoryRouter initialEntries={['/slides/generate']}>
        <Routes>
          <Route
            path="/slides/generate"
            element={
              <ProtectedRoute>
                <SlidesGeneratePage />
              </ProtectedRoute>
            }
          />
          <Route path="/login" element={<div>Login Seite</div>} />
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByRole('heading', { name: 'Folien generieren' })).toBeInTheDocument();
    // Das Thema-Feld ist ein zuverlaessiger Marker dafuer, dass das Formular gerendert wurde.
    expect(screen.getByLabelText(/Thema/)).toBeInTheDocument();
  });
});
