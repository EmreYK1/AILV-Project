import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, it, expect, vi } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import ProtectedRoute from '../../components/ProtectedRoute';
import SlidesGeneratePage from '../../pages/SlidesGeneratePage';
import type { SlidesGenerateResponse } from '../../types/slides';

// useAuth wird pro Test mit dem gewuenschten Login-Zustand verdrahtet.
const mockUseAuth = vi.fn();
const mockGenerateSlides = vi.hoisted(() => vi.fn());

vi.mock('../../context/AuthContext', () => ({
  useAuth: () => mockUseAuth(),
}));

vi.mock('../../services/slidesApi', () => ({
  generateSlides: mockGenerateSlides,
}));

const firstResponse: SlidesGenerateResponse = {
  status: 'completed',
  request_id: 'request-1',
  slides: [
    {
      position: 1,
      slide_type: 'title',
      title: 'Erste Vorschau',
      bullets: ['Erster Punkt'],
    },
  ],
};

const secondResponse: SlidesGenerateResponse = {
  status: 'completed',
  request_id: 'request-2',
  slides: [
    {
      position: 1,
      slide_type: 'title',
      title: 'Neue Vorschau',
      bullets: ['Neuer Punkt'],
    },
  ],
};

function renderSlidesGeneratePage(): void {
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
}

function fillRequiredFields(): void {
  fireEvent.change(screen.getByLabelText(/Thema/), {
    target: { value: 'Neuronale Netze' },
  });
  fireEvent.change(screen.getByLabelText(/Anzahl Folien/), {
    target: { value: '5' },
  });
}

describe('SlidesGeneratePage – Routing', () => {
  beforeEach(() => {
    mockUseAuth.mockReset();
    mockGenerateSlides.mockReset();
  });

  it('leitet nicht eingeloggte Nutzer von /slides/generate auf /login um', () => {
    mockUseAuth.mockReturnValue({
      token: null,
      isAuthenticated: false,
      login: vi.fn(),
      logout: vi.fn(),
    });

    renderSlidesGeneratePage();

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

    renderSlidesGeneratePage();

    expect(screen.getByRole('heading', { name: 'Folien generieren' })).toBeInTheDocument();
    // Das Thema-Feld ist ein zuverlaessiger Marker dafuer, dass das Formular gerendert wurde.
    expect(screen.getByLabelText(/Thema/)).toBeInTheDocument();
  });

  it('zeigt nach erfolgreichem Submit die Vorschau und blendet das Formular aus', async () => {
    mockUseAuth.mockReturnValue({
      token: 'jwt-token',
      isAuthenticated: true,
      login: vi.fn(),
      logout: vi.fn(),
    });
    mockGenerateSlides.mockResolvedValueOnce(firstResponse);

    renderSlidesGeneratePage();
    fillRequiredFields();
    fireEvent.click(screen.getByRole('button', { name: 'Folien generieren' }));

    expect(await screen.findByRole('heading', { name: 'Erste Vorschau' })).toBeInTheDocument();
    expect(screen.queryByLabelText(/Thema/)).not.toBeInTheDocument();
  });

  it('generiert mit denselben Eingaben neu und zeigt waehrenddessen den Ladezustand', async () => {
    let resolveSecondResponse: (response: SlidesGenerateResponse) => void = () => {};
    const pendingSecondResponse = new Promise<SlidesGenerateResponse>((resolve) => {
      resolveSecondResponse = resolve;
    });

    mockUseAuth.mockReturnValue({
      token: 'jwt-token',
      isAuthenticated: true,
      login: vi.fn(),
      logout: vi.fn(),
    });
    mockGenerateSlides
      .mockResolvedValueOnce(firstResponse)
      .mockReturnValueOnce(pendingSecondResponse);

    renderSlidesGeneratePage();
    fillRequiredFields();
    fireEvent.click(screen.getByRole('button', { name: 'Folien generieren' }));
    expect(await screen.findByRole('heading', { name: 'Erste Vorschau' })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Neu generieren' }));

    expect(screen.getByRole('button', { name: /Neu generieren/ })).toBeDisabled();
    expect(mockGenerateSlides).toHaveBeenLastCalledWith({
      topic: 'Neuronale Netze',
      slideCount: 5,
      language: 'de',
    });

    resolveSecondResponse(secondResponse);

    expect(await screen.findByRole('heading', { name: 'Neue Vorschau' })).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Neu generieren' })).not.toBeDisabled();
    });
  });

  it('zeigt mit "Eingaben ändern" das Formular mit den alten Werten', async () => {
    mockUseAuth.mockReturnValue({
      token: 'jwt-token',
      isAuthenticated: true,
      login: vi.fn(),
      logout: vi.fn(),
    });
    mockGenerateSlides.mockResolvedValueOnce(firstResponse);

    renderSlidesGeneratePage();
    fillRequiredFields();
    fireEvent.click(screen.getByRole('button', { name: 'Folien generieren' }));
    expect(await screen.findByRole('heading', { name: 'Erste Vorschau' })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Eingaben ändern' }));

    expect(screen.getByLabelText(/Thema/)).toHaveValue('Neuronale Netze');
    expect(screen.getByLabelText(/Anzahl Folien/)).toHaveValue('5');
    expect(screen.queryByRole('heading', { name: 'Erste Vorschau' })).not.toBeInTheDocument();
  });
});
