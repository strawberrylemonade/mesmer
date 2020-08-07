import { Router } from 'express';
import { v4 } from 'uuid';
import log from '../helpers/log';
import { createDebugSession, getDebugSessionByCode, getDebugSession } from '../services/debug';
import WebSocket = require('ws');
import { createEvent, IEvent } from '../services/event';
import { verifyAuth } from '../helpers/middleware';


const router = Router();

interface CacheRegistration {
  id: string,
  connection: WebSocket
}

const SocketCache: {[key: string]: CacheRegistration[]} = {} 

router.post('/:projectId/environments/:environmentId/debug', async (req, res) => {
  const projectId = req.params.projectId;
  const environmentId = req.params.environmentId;
  
  try {
    const session = await createDebugSession(projectId, environmentId);
    res.status(201);
    res.json(session);
  } catch (e) {
    log(e);
    res.status(e.code);
    res.json(e.toJSON());
  }
})

router.get('/:projectId/environments/:environmentId/debug', async (req, res) => {
  const projectId = req.params.projectId;
  const environmentId = req.params.environmentId;
  const code = req.query.code;

  try {
    const session = await getDebugSessionByCode(projectId, environmentId, code);
    res.status(200);
    res.json(session);
  } catch (e) {
    log(e);
    res.status(e.code);
    res.json(e.toJSON());
  }
})

router.get('/:projectId/environments/:environmentId/debug/:debugId', async (req, res) => {
  const projectId = req.params.projectId;
  const environmentId = req.params.environmentId;
  const debugId = req.params.debugId;

  try {
    const session = await getDebugSession(projectId, environmentId, debugId);
    res.status(200);
    res.json(session);
  } catch (e) {
    log(e);
    res.status(e.code);
    res.json(e.toJSON());
  }
})

router.ws('/:projectId/environments/:environmentId/debug/:debugId', async (ws, req) => {
  const debugId = req.params.debugId;
  const id = addToCache(debugId, ws);
  ws.on('close', () => {
    removeFromCache(debugId, id)
  });
})

router.post('/:projectId/environments/:environmentId/events', async (req, res) => {
  const projectId = req.params.projectId;
  const environmentId = req.params.environmentId;
  const event = req.body;

  res.status(200);
  res.json({ ok: true })

  try {
    await createEvent(projectId, environmentId, event);
    if (event.debugSession) broadcastEvent(event);
  } catch (e) {
    log(e);  }
})

const addToCache = (debugId: string, connection: WebSocket) => {
  const clientsForSession = SocketCache[debugId] ?? [];
  const id = v4();
  clientsForSession.push(
    { id, connection }
  )
  SocketCache[debugId] = clientsForSession;
  return id;
}

const removeFromCache = (debugId: string, id: string) => {
  const clientsForSession = SocketCache[debugId] ?? [];
  SocketCache[debugId] = clientsForSession.filter(connection => id !== connection.id)
}

const broadcastEvent = (event: IEvent) => {
  const clientsForSession = SocketCache[event.debugSession] ?? [];
  clientsForSession.forEach((registration: CacheRegistration) => {
    registration.connection.send(JSON.stringify(event));
  })
}


export default router;