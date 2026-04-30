import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getDeck, deleteDeck, updateDeck } from '../../services/slidesApi';
import type { DeckDetailResponse, SlideDraft } from '../../types/slides';

export function useDeckDetail(deckId: string | undefined) {
  const navigate = useNavigate();

  const [deck, setDeck] = useState<DeckDetailResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateSuccess, setUpdateSuccess] = useState(false);

  useEffect(() => {
    async function loadDeck() {
      if (!deckId) return;

      try {
        setIsLoading(true);
        setError(null);
        const fetchedDeck = await getDeck(deckId);
        setDeck(fetchedDeck);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Das Foliendeck konnte nicht geladen werden.');
      } finally {
        setIsLoading(false);
      }
    }

    loadDeck();
  }, [deckId]);

  const handleDeleteConfirm = async () => {
    if (!deckId) return;

    try {
      setIsDeleting(true);
      await deleteDeck(deckId);
      setIsDeleteDialogOpen(false);
      navigate('/slides/archive');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Das Foliendeck konnte nicht gelöscht werden.');
      setIsDeleteDialogOpen(false);
      setIsDeleting(false);
    }
  };

  const handleUpdateDeck = async (slides: SlideDraft[]) => {
    if (!deckId) return;

    try {
      setIsUpdating(true);
      setError(null);
      setUpdateSuccess(false);
      const updatedDeck = await updateDeck(deckId, slides);
      setDeck(updatedDeck);
      setUpdateSuccess(true);
      setTimeout(() => setUpdateSuccess(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Änderungen konnten nicht gespeichert werden.');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleBack = () => {
    navigate('/slides/archive');
  };

  return {
    deck,
    isLoading,
    error,
    isDeleteDialogOpen,
    isDeleting,
    isUpdating,
    updateSuccess,
    setIsDeleteDialogOpen,
    handleDeleteConfirm,
    handleUpdateDeck,
    handleBack,
  };
}
