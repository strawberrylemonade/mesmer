import { Router } from 'express';

import { runTest, createTest, getTest, getTests, updateTest } from '../services/test';
import { MissingParameterError } from '../helpers/errors';
import log from '../helpers/log';
import { verifyAuth } from '../helpers/middleware';


const router = Router();

router.post('/:projectId/tests', verifyAuth, async (req, res) => {
  const projectId = req.params.projectId;
  
  try {
    const test = await createTest(projectId, req.body);
    res.status(200);
    res.json(test);
  } catch (e) {
    log(e);
    res.status(e.code);
    res.json(e.toJSON());
  }
})

router.put('/:projectId/tests/:testId', verifyAuth, async (req, res) => {
  const projectId = req.params.projectId;
  const testId = req.params.testId;
  
  try {
    const test = await updateTest(projectId, testId, req.body);
    res.status(200);
    res.json(test);
  } catch (e) {
    log(e);
    res.status(e.code);
    res.json(e.toJSON());
  }
})

router.post('/:projectId/environments/:environmentId/tests/:testId/run', verifyAuth, async (req, res) => {
  const projectId = req.params.projectId;
  const environmentId = req.params.environmentId;
  const testId = req.params.testId;
  
  try {
    const test = await getTest(projectId, testId);
    const report = await runTest(projectId, environmentId, test);
    res.status(200);
    res.json(report);
  } catch (e) {
    log(e);
    res.status(e.code);
    res.json(e.toJSON());
  }
})

router.post('/:projectId/tests/run', verifyAuth, async (req, res) => {
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

router.get('/:projectId/tests', verifyAuth, async (req, res) => {
  const projectId = req.params.projectId;
  
  try {
    const tests = await getTests(projectId);
    res.status(200);
    res.json(tests);
  } catch (e) {
    log(e);
    res.status(e.code);
    res.json(e.toJSON());
  }
})

router.get('/:projectId/tests/:testId', verifyAuth, async (req, res) => {
  const projectId = req.params.projectId;
  const testId = req.params.testId;
  
  try {
    const test = await getTest(projectId, testId);
    res.status(200);
    res.json(test);
  } catch (e) {
    log(e);
    res.status(e.code);
    res.json(e.toJSON());
  }
})


export default router;
