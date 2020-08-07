import { Router } from 'express';

import { createProject, getProject, getProjects, updateProject, deleteProject } from '../services/project';
import log from '../helpers/log';
import { verifyAuth } from '../helpers/middleware';

const router = Router();

router.get('/', async (req, res) => {
  try {
    const projects = await getProjects();
    res.status(200);
    res.json(projects);
  } catch (e) {
    log(e);
    res.status(e.code);
    res.json(e.toJSON());
  }
})

router.post('/', async (req, res) => {
  const newProject = req.body;

  try {
    const project = await createProject(newProject);
    res.status(200);
    res.json(project);
  } catch (e) {
    log(e);
    res.status(e.code);
    res.json(e.toJSON());
  }
})

router.get('/:projectId', async (req, res) => {
  const projectId = req.params.projectId;

  try {
    const project = await getProject(projectId);
    res.status(200);
    res.json(project);
  } catch (e) {
    log(e);
    res.status(e.code);
    res.json(e.toJSON());
  }
})

router.put('/:projectId', async (req, res) => {
  const projectId = req.params.projectId;

  const partialProject = req.body;

  try {
    const project = await updateProject(projectId, partialProject);
    res.status(200);
    res.json(project);
  } catch (e) {
    log(e);
    res.status(e.code);
    res.json(e.toJSON());
  }
})

router.delete('/:projectId', async (req, res) => {
  const projectId = req.params.projectId;

  try {
    await deleteProject(projectId);
    res.status(200);
    res.json({ status: 'OK' });
  } catch (e) {
    log(e);
    res.status(e.code);
    res.json(e.toJSON());
  }
})

export default router;
