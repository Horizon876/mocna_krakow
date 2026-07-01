import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import StoriesShowstopper from '../StoriesShowstopper';
import React from 'react';

const mockStories = [
  {
    slug: 'ania',
    name: 'Anna Kowalska',
    role: 'Barista',
    accent: '#ff0000',
    teaser: 'Krótki wstęp o Ani',
    quote: 'Najlepsza kawa to ta robiona z sercem.',
    body: 'Pełna historia Ani...'
  },
  {
    slug: 'jan',
    name: 'Jan Nowak',
    role: 'Kierownik',
    accent: '#00ff00',
    teaser: 'Zarządza zespołem',
    quote: 'Zespół jest najważniejszy.',
    body: 'Pełna historia Jana...'
  }
];

describe('StoriesShowstopper', () => {
  it('renderuje poprawnie listę historii', () => {
    render(<StoriesShowstopper stories={mockStories} />);
    
    // Sprawdzamy czy imiona pojawiają się na ekranie
    expect(screen.getByText('Anna Kowalska')).toBeInTheDocument();
    expect(screen.getByText('Jan Nowak')).toBeInTheDocument();
    
    // Sprawdzamy czy role pojawiają się na ekranie
    expect(screen.getByText('Barista')).toBeInTheDocument();
    expect(screen.getByText('Kierownik')).toBeInTheDocument();
  });

  it('otwiera modal po kliknięciu w kartę', async () => {
    render(<StoriesShowstopper stories={mockStories} />);
    
    // Klikamy w kartę Ani
    const card = screen.getByText('Anna Kowalska').closest('button');
    if (!card) throw new Error('Card button not found');
    
    fireEvent.click(card);
    
    // Oczekujemy, że pojawi się pełna treść w modalu
    await waitFor(() => {
      expect(screen.getByText('Pełna historia Ani...')).toBeInTheDocument();
      expect(screen.getByText('„Najlepsza kawa to ta robiona z sercem.”')).toBeInTheDocument();
    });
  });

  it('zamyka modal po kliknięciu przycisku zamknij', async () => {
    render(<StoriesShowstopper stories={mockStories} />);
    
    // Otwórz modal
    fireEvent.click(screen.getByText('Anna Kowalska').closest('button')!);
    
    // Znajdź i kliknij przycisk "Zamknij" (X)
    const closeBtn = await screen.findByRole('button', { name: 'Zamknij' });
    fireEvent.click(closeBtn);
    
    // Oczekujemy, że zawartość modalu zniknie
    await waitFor(() => {
      expect(screen.queryByText('Pełna historia Ani...')).not.toBeInTheDocument();
    });
  });
});
