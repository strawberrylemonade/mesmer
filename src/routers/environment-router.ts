import { Router } from 'express';

import { createEnvironment, getEnvironment, getEnvironments, updateEnvironment, deleteEnvironment } from '../services/environment';
import { runTest } from '../services/test';
import { createEvent, getEventsByDebugSession } from '../services/event';
import { MissingParameterError } from '../helpers/errors';
import { verifyAuth } from '../helpers/middleware';
import log from '../helpers/log';
import { getEnvironmentStatus } from '../services/report';

const router = Router();

router.get('/:projectId/environments/', verifyAuth, async (req, res) => {
  const projectId = req.params.projectId;

  try {
    const environments = await getEnvironments(projectId);
    res.status(200);
    res.json(environments);
  } catch (e) {
    log(e);
    res.status(e.code);
    res.json(e.toJSON());
  }
})

router.post('/:projectId/environments/', verifyAuth, async (req, res) => {
  const projectId = req.params.projectId;
  
  const partialEnvironment = req.body;

  try {
    const environment = await createEnvironment(projectId, partialEnvironment);
    res.status(201);
    res.json(environment);
  } catch (e) {
    log(e);
    res.status(e.code);
    res.json(e.toJSON());
  }
})

router.get('/:projectId/environments/:environmentId', verifyAuth, async (req, res) => {
  const projectId = req.params.projectId;
  const environmentId = req.params.environmentId;

  try {
    const environment = await getEnvironment(projectId, environmentId);
    res.status(200);
    res.json(environment);
  } catch (e) {
    log(e);
    res.status(e.code);
    res.json(e.toJSON());
  }
})

router.get('/:projectId/environments/:environmentId', verifyAuth, async (req, res) => {
  const projectId = req.params.projectId;
  const environmentId = req.params.environmentId;

  try {
    await deleteEnvironment(projectId, environmentId);
    res.status(200);
    res.json({ status: 'OK' });
  } catch (e) {
    log(e);
    res.status(e.code);
    res.json(e.toJSON());
  }
})

router.put('/:projectId/environments/:environmentId', verifyAuth, async (req, res) => {
  const projectId = req.params.projectId;
  const environmentId = req.params.environmentId;

  const partialEnvironment = req.body;

  try {
    const environment = await updateEnvironment(projectId, environmentId, partialEnvironment);
    res.status(200);
    res.json(environment);
  } catch (e) {
    log(e);
    res.status(e.code);
    res.json(e.toJSON());
  }
})

router.get('/:projectId/environments/:environmentId/status', verifyAuth, async (req, res) => {
  const projectId = req.params.projectId;
  const environmentId = req.params.environmentId;

  try {
    const status = await getEnvironmentStatus(projectId, environmentId);
    res.status(200);
    res.json(status);
  } catch (e) {
    log(e);
    res.status(e.code);
    res.json(e.toJSON());
  }
})

router.post('/:projectId/environments/:environmentId/tests', verifyAuth, async (req, res) => {
  const projectId = req.params.projectId;
  const environmentId = req.params.environmentId;
  
  try {
    const report = await runTest(projectId, environmentId, req.body);
    res.status(200);
    res.json(report);
  } catch (e) {
    log(e);
    res.status(e.code);
    res.json(e.toJSON());
  }
})


export default router;
