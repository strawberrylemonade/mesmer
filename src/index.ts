import { config } from 'dotenv';
config();

import { setup } from 'applicationinsights';
setup().start();

import figlet from 'figlet';
import { cyan, white, bold } from 'chalk';

import express from 'express';
import { json } from 'body-parser';
import cors from 'cors';
import addWebsocket from 'express-ws';

const app = express();
addWebsocket(app);
app.use(json());
app.use(cors());

app.get('/', (req, res, next) => {})

import projectRouter from './routers/project-router';
app.use('/api/projects', projectRouter);

import environmentRouter from './routers/environment-router';
app.use('/api/projects/', environmentRouter);

import testRouter from './routers/test-router';
app.use('/api/projects/', testRouter);

import debugRouter from './routers/debug-router';
app.use('/api/projects/', debugRouter);

import reportRouter from './routers/report-router';
app.use('/api/projects/', reportRouter);

import proxyRouter from './routers/proxy-router';
app.use('/api/proxy/', proxyRouter);

import tasksRouter from './routers/tasks-router';
app.use('/api/tasks/', tasksRouter);

import slackRouter from './routers/slack-router';
app.use('/api/slack/', slackRouter);

console.log('[DEV] Express server starting...')
app.listen(process.env.PORT, () => {
  figlet('MESMER', (err, result) => {
    console.log(cyan(new Array(40).fill('=').join('')));
    console.log(cyan(result));
    console.log(cyan(new Array(40).fill('=').join('')));
    console.log(`[DEV] Express server started on port ${bold(white(process.env.PORT))}`)
  })
})