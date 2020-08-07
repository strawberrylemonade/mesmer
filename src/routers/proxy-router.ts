import { Router } from 'express';
import { getTokenForTalksuite, getOrganisations, getBots, getBot, importDialogues } from '../services/talksuite-client';
import { verifyAuth } from '../helpers/middleware';

const router = Router();

router.post('/talksuite/login', async (req, res, next) => {
  const username = req.body?.username;
  const password = req.body?.password;

  const token = await getTokenForTalksuite(username, password);
  res.status(200);
  res.json(token);
})

router.get('/talksuite/organisations', async (req, res, next) => {
  const token = req.header('Authentication');

  const organisations = await getOrganisations(token);
  res.status(200);
  res.json(organisations);
})

router.get('/talksuite/organisations/:organisationId/bots', async (req, res, next) => {
  const organisationId = req.params.organisationId;
  const token = req.header('Authentication');

  const data = await getBots(token, organisationId);
  res.status(200);
  res.json(data);
})

router.get('/talksuite/organisations/:organisationId/bots/:botId', async (req, res, next) => {
  const organisationId = req.params.organisationId;
  const botId = req.params.botId;
  const token = req.header('Authentication');

  const [data] = await getBot(token, organisationId, botId);
  res.status(200);
  res.json(data);
})

router.post('/talksuite/organisations/:organisationId/import', async (req, res, next) => {
  const organisationId = req.params.organisationId;
  const version = req.query.version;
  const token = req.header('Authentication');

  await importDialogues(token, organisationId, version);
  res.status(200);
  res.json({ status: 'OK' });
}) 

export default router;