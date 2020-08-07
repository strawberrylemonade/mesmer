import { Router } from 'express';
import log from '../helpers/log';
import { getReport, getRecentReports, getRecentReport } from '../services/report';
import { verifyAuth } from '../helpers/middleware';

const router = Router()

router.get('/:projectId/environments/:environmentId/reports/recents', async (req, res, next) => {
  const projectId = req.params.projectId;
  const environmentId = req.params.environmentId;

  try {
    const reports = await getRecentReports(projectId, environmentId);
    res.status(200);
    res.json(reports);
  } catch (e) {
    log(e);
    res.status(e.code);
    res.json(e.toJSON());
  }
})

router.get('/:projectId/environments/:environmentId/reports/recent', async (req, res, next) => {
  const projectId = req.params.projectId;
  const environmentId = req.params.environmentId;

  try {
    const report = await getRecentReport(projectId, environmentId);
    res.status(200);
    res.json(report);
  } catch (e) {
    log(e);
    res.status(e.code);
    res.json(e.toJSON());
  }
})

router.get('/:projectId/environments/:environmentId/reports/:reportId', async (req, res, next) => {
  const projectId = req.params.projectId;
  const environmentId = req.params.environmentId;
  const reportId = req.params.reportId;

  try {
    const report = await getReport(projectId, environmentId, reportId);
    res.status(200);
    res.json(report);
  } catch (e) {
    log(e);
    res.status(e.code);
    res.json(e.toJSON());
  }
})

export default router;