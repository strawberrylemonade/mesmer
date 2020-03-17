import { Router } from 'express';
import log from '../helpers/log';

import { handleToken, sendReportNotificationToEnvironment } from '../services/slack-client';

const router = Router()

router.get('/authorization', async (req, res, next) => {

  try {
    const code = req.query?.code;
    const environmentId = req.query?.state;
    await handleToken(environmentId, code);

    res.status(200);
    res.setHeader('Content-Type', 'text/html');
    res.send(`
    <html>
    <body>
      <script>window.close()</script>
    </body>
    </html>`.trim())
    
  } catch (e) {
    log(e);
    res.status(e.code);
    res.json(e.toJSON());
  }
})

router.post('/notification', async (req, res, next) => {

  try {
    await sendReportNotificationToEnvironment('mesmer', 'development', 'Hello!', 'https://flights.example.com/book/r123456');
    res.send();
  } catch (e) {
    log(e);
    res.status(e.code);
    res.json(e.toJSON());
  }
})

export default router;