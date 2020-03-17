import { getTestById, runTest } from './test';
import { getProjects, IProject } from './project';
import { getEnvironments } from './environment';

export const multiplexUptimeTests = async () => {
  const projects = await getProjects();
  return Promise.all(projects.map(async (project) => {
    const environments = await getEnvironments(project.id);
    return Promise.all(environments.map(async (environment) => {
      const activeTests = environment.tests ?? [];
      return await Promise.all(activeTests.map(async (testId) => {
        let test = await getTestById(testId);
        return await runTest(project.id, environment.environmentId, test);
      }))
    }))
  }))
}