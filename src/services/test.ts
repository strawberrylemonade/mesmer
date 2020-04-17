import db from  './database-client';
import { Model, DataTypes } from 'sequelize';
import { v4 } from 'uuid';

import { DirectLine, Message } from 'botframework-directlinejs';
import { getEnvironment } from './environment';
import { NotFoundError, NoMatchError, CustomError, DatabaseError, MissingParameterError } from '../helpers/errors';
import { syncOptions } from '../helpers/options';
import { resolveDiscovery, createConversation, sendMessage, waitForResponseById, waitForResponseByExpect, setUpDebugSession, Expect } from '../helpers/directline';
import log from '../helpers/log';
import { getProject } from './project';
import { TestReport, StepReport } from './report';

export interface ITest {
  // Parent information
  project: string

  // Metadata
  id: string
  testId: string
  name: string
  maxDuration: number
  targetDuration: number
  steps: Array<(ISendAndWaitStep | ISendAndWaitForStep | IWaitAndExpectStep)>
}

class Test extends Model {}

Test.init({
  id: {
    type: DataTypes.STRING,
    allowNull: false,
    primaryKey: true
  },
  testId: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  project: {
    type: DataTypes.STRING,
    allowNull: false
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  maxDuration: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  targetDuration: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  steps: {
    type: DataTypes.JSON,
    allowNull: false
  }
}, {
  sequelize: db,
  modelName: 'test'
})

Test.sync(syncOptions)
  .then(() => {
    console.log('[DEV] Successful table sync for "Test"');
  })
  .catch((err: Error) => {
    log(err);
    console.log('[DEV] Failed table sync for "Test"');
    process.exit(1);
  });

export const getTest = async (projectId: string, testId: string) => {
  try {
    const test = await Test.findOne({ where: { project: projectId, testId: testId }})
    if(!test) throw new NotFoundError('This test does not exist.');
    return test.toJSON() as ITest;
  } catch (e) {
    log(e);
    // If it is a handled error (i.e. Not Found) just rethrow
    if(e instanceof CustomError) throw e;
    // Else throw a custom database error
  }

}

export const getTestById = async (id: string) => {
  try {
    const test = await Test.findOne({ where: { id }})
    if(!test) throw new NotFoundError('This test does not exist.');
    return test.toJSON() as ITest;
  } catch (e) {
    log(e);
    // If it is a handled error (i.e. Not Found) just rethrow
    if(e instanceof CustomError) throw e;
    // Else throw a custom database error
  }

}

export const getTests = async (projectId: string) => {
  try {
    const tests = await Test.findAll({ where: { project: projectId }})
    return tests.map(res => res.toJSON());
  } catch (e) {
    log(e);
    throw new DatabaseError('Could not get tests.')
  }
}

export const createTest = async (projectId: string, test: Partial<ITest>) => {
  if (!projectId) throw new MissingParameterError('projectId');
  if (!test.name) throw new MissingParameterError('name');
  if (!test.testId) throw new MissingParameterError('testId');
  if (!test.maxDuration) throw new MissingParameterError('maxDuration');
  if (!test.targetDuration) throw new MissingParameterError('targetDuration');
  if (!test.steps) throw new MissingParameterError('steps');

  // Confirm that project exists
  await getProject(projectId); // Throws a NotFoundError
  test.project = projectId;
  test.id = v4();

  try {
    const response = await Test.create(test);
    return response.toJSON();
  } catch (e) {
    log(e);
    throw new DatabaseError('Could not save this new environment.')
  }
}

export const updateTest = async (projectId: string, testId: string, candidateTest: Partial<ITest>) => {
  try {
    const project = await Test.findOne({ where: { project: projectId, testId: testId } })
    await project.update(candidateTest, { fields: ['name', 'maxDuration', 'targetDuration', 'steps'] })
    return project.toJSON();
  } catch (e) {
    log(e);
    throw new DatabaseError('Could not update this project.')
  }
}

export const runTest = async (projectId: string, environmentId: string, test: ITest) => {
  const { connection } = await getEnvironment(projectId, environmentId);
  if (!connection) throw new NotFoundError('This environment does not have any connection details associating it with a bot.');

  const discovery = await resolveDiscovery(connection);
  const conversation = await createConversation(discovery);
  const debugSession = await setUpDebugSession(conversation, projectId, environmentId); 

  const report = new TestReport(projectId, environmentId, test, debugSession.id);
  report.start()

  for (const step of test.steps) {
    const stepReport = new StepReport(step.name);
    stepReport.start();

    try {
      switch (step.type) {
        case 'send&Wait':
          await sendAndWait(conversation, step);
          break;
        case 'send&WaitFor':
          await sendAndWaitFor(conversation, step);
          break;
        case 'wait&Expect':
          await waitAndExpect(conversation, step);
          break;
      }

      stepReport.stop();
    } catch (e) {
      stepReport.stop(e);
    }
    report.addStep(stepReport);
  }

  report.stop()
  return await report.create();
}

interface ISendAndWaitStep {
  name: string
  type: "send&Wait"
  message: string
}

const sendAndWait = async (conversation: DirectLine, step: ISendAndWaitStep) =>  {
  const id = await sendMessage(conversation, step.message);
  await waitForResponseById(conversation, id);        
}

interface ISendAndWaitForStep {
  name: string
  type: "send&WaitFor"
  message: string
  expect: string | Expect
}

const sendAndWaitFor = async (conversation: DirectLine, step: ISendAndWaitForStep) =>  {
  const id = await sendMessage(conversation, step.message);
  const response = await waitForResponseById(conversation, id) as Message;   
  if (response.text !== step.expect) throw new NoMatchError('Response did not come back as expected.');
}

interface IWaitAndExpectStep {
  name: string
  type: "wait&Expect"
  expect: string | Expect
}

const waitAndExpect = async (conversation: DirectLine, step: IWaitAndExpectStep) =>  {
  await waitForResponseByExpect(conversation, step.expect) as Message;   
}