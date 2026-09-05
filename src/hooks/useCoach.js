import { useCallback, useEffect, useState } from 'react';
import { useAuth } from './useAuth';
import {
  getMyClients, getMyTrainers, redeemCoachInviteCode, revokeClientLink,
  getTrainerComments, addTrainerComment, deleteTrainerComment,
} from '../lib/db';

export function useMyClients() {
  const { user } = useAuth();
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);

  const refetch = useCallback(async () => {
    if (!user) { setClients([]); setLoading(false); return; }
    setLoading(true);
    try {
      setClients(await getMyClients(user.id));
    } catch (err) {
      console.error('Failed to load clients:', err);
      setClients([]);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => { refetch(); }, [refetch]);

  const redeemCode = useCallback(async (code) => {
    await redeemCoachInviteCode(code);
    await refetch();
  }, [refetch]);

  const revoke = useCallback(async (trainerClientRowId) => {
    await revokeClientLink(trainerClientRowId);
    await refetch();
  }, [refetch]);

  return { clients, loading, refetch, redeemCode, revoke };
}

export function useMyTrainers() {
  const { user } = useAuth();
  const [trainers, setTrainers] = useState([]);
  const [loading, setLoading] = useState(true);

  const refetch = useCallback(async () => {
    if (!user) { setTrainers([]); setLoading(false); return; }
    setLoading(true);
    try {
      setTrainers(await getMyTrainers(user.id));
    } catch (err) {
      console.error('Failed to load trainers:', err);
      setTrainers([]);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => { refetch(); }, [refetch]);

  const redeemCode = useCallback(async (code) => {
    await redeemCoachInviteCode(code);
    await refetch();
  }, [refetch]);

  const disconnect = useCallback(async (trainerClientRowId) => {
    await revokeClientLink(trainerClientRowId);
    await refetch();
  }, [refetch]);

  return { trainers, loading, refetch, redeemCode, disconnect };
}

export function useTrainerComments(clientId) {
  const { user } = useAuth();
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);

  const refetch = useCallback(async () => {
    if (!user || !clientId) { setComments([]); setLoading(false); return; }
    setLoading(true);
    try {
      setComments(await getTrainerComments(user.id, clientId));
    } catch (err) {
      console.error('Failed to load comments:', err);
      setComments([]);
    } finally {
      setLoading(false);
    }
  }, [user, clientId]);

  useEffect(() => { refetch(); }, [refetch]);

  const addComment = useCallback(async (body, commentDate = null) => {
    if (!user || !clientId) return;
    await addTrainerComment(user.id, clientId, body, commentDate);
    await refetch();
  }, [user, clientId, refetch]);

  const removeComment = useCallback(async (id) => {
    await deleteTrainerComment(id);
    await refetch();
  }, [refetch]);

  return { comments, loading, addComment, removeComment };
}
