import { Router } from 'express';
import log from '../helpers/log';

import { multiplexUptimeTests } from '../services/tasks'

const router = Router()

router.post('/uptime', async (req, res, next) => {

  try {
    const reports = await multiplexUptimeTests();
    res.status(200);
    res.json(reports);
  } catch (e) {
    log(e);
    res.status(e.code);
    res.json(e.toJSON());
  }
})

export default router;