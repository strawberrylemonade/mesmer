import { Router } from 'express';

import { createEnvironment, getEnvironment, getEnvironments, updateEnvironment } from '../services/environment';
import { getEnvironmentStatus, getTestDetails } from '../services/test';
import { createEvent, getEventsByDebugSession } from '../services/event';
import { MissingParameterError } from '../helpers/errors';
import log from '../helpers/log';

const router = Router();

router.get('/:projectId/environments/', async (req, res) => {
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

router.post('/:projectId/environments/', async (req, res) => {
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

router.get('/:projectId/environments/:environmentId', async (req, res) => {
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

router.put('/:projectId/environments/:environmentId', async (req, res) => {
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

router.get('/:projectId/environments/:environmentId/status', async (req, res) => {
  const projectId = req.params.projectId;
  const environmentId = req.params.environmentId;

  try {
    const events = await getEnvironmentStatus(projectId, environmentId);
    res.status(200);
    res.json(events);
  } catch (e) {
    log(e);
    res.status(e.code);
    res.json(e.toJSON());
  }
})

router.get('/:projectId/environments/:environmentId/tests/:testId', async (req, res) => {
  const projectId = req.params.projectId;
  const environmentId = req.params.environmentId;
  const testId = req.params.testId;
  
  try {
    const test = await getTestDetails(projectId, environmentId, testId);
    res.status(200);
    res.json(test);
  } catch (e) {
    log(e);
    res.status(e.code);
    res.json(e.toJSON());
  }
})

router.get('/:projectId/environments/:environmentId/events', async (req, res) => {
  const projectId = req.params.projectId;
  const environmentId = req.params.environmentId;
  const debugId = req.query.debugId;

  try {
    if(!debugId) throw new MissingParameterError('debugId');
    const events = await getEventsByDebugSession(projectId, environmentId, debugId);

    res.status(200);
    res.json(events);
  } catch (e) {
    log(e);
    res.status(e.code)
    res.json(e.toJSON());
  }
})

router.post('/:projectId/environments/:environmentId/events', async (req, res) => {
  const projectId = req.params.projectId;
  const environmentId = req.params.environmentId;
  const event = req.body;

  try {
    let response = await createEvent(projectId, environmentId, event);
    res.status(201);
    res.json(response);
  } catch (e) {
    log(e);
    res.status(e.code)
    res.json(e.toJSON());
  }
})


export default router;
