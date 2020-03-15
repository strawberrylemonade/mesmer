import { Router } from 'express';
import { getTokenForTalksuite, getOrganisations, getBots, getBot } from '../services/talksuite-client';
import { verifyAuth } from '../helpers/middleware';

const router = Router();

router.post('/talksuite/login', verifyAuth, async (req, res, next) => {
  const username = req.body?.username;
  const password = req.body?.password;

  const token = await getTokenForTalksuite(username, password);
  res.status(200);
  res.json(token);
})

router.get('/talksuite/organisations', verifyAuth, async (req, res, next) => {
  const token = req.header('Authentication');

  const organisations = await getOrganisations(token);
  res.status(200);
  res.json(organisations);
})

router.get('/talksuite/organisations/:organisationId/bots', verifyAuth, async (req, res, next) => {
  const organisationId = req.params.organisationId;
  const token = req.header('Authentication');

  const data = await getBots(token, organisationId);
  res.status(200);
  res.json(data);
})

router.get('/talksuite/organisations/:organisationId/bots/:botId', verifyAuth, async (req, res, next) => {
  const organisationId = req.params.organisationId;
  const botId = req.params.botId;
  const token = req.header('Authentication');

  const data = await getBot(token, organisationId, botId);
  res.status(200);
  res.json(data);
})

export default router;