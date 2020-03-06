interface ITestConfiguration {
  steps: ITestStep[]
}

interface ITestStep {

}

export const getEnvironmentStatus = async (projectId: string, environmentId: string) => {

}

export const getTestDetails = async (projectId: string, environmentId: string, testId: string) => {

}

export const runTest = async (projectId: string, environmentId: string, configuration: ITestConfiguration) => {

}