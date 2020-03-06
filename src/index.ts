import { config } from 'dotenv';
config();

import { setup } from 'applicationinsights';
setup().start();

import figlet from 'figlet';
import { cyan, white, bold } from 'chalk';

import express from 'express';
import { json } from 'body-parser';
const app = express();
app.use(json());

app.get('/', (req, res, next) => {})

import projectRouter from './routers/project-router';
app.use('/api/projects', projectRouter);

import environmentRouter from './routers/environment-router';
app.use('/api/projects/', environmentRouter);

console.log('[DEV] Express server starting...')
app.listen(process.env.PORT, () => {
  figlet('MESMER', (err, result) => {
    console.log(cyan(new Array(40).fill('=').join('')));
    console.log(cyan(result));
    console.log(cyan(new Array(40).fill('=').join('')));
    console.log(`[DEV] Express server started on port ${bold(white(process.env.PORT))}`)
  })
})