import { BatExtractWorkflow, LocalStepCommandRunner } from '../src/runCompleteWorkflow.js';

class FakeRunner extends LocalStepCommandRunner {
  private calls = 0;
  override run(command: string): void {
    this.calls++;
    if (this.calls === 2) {
      throw new Error('forced failure');
    }
  }
}

describe('BatExtractWorkflow partial failure handling', () => {
  it('continues after a step failure without exiting process (failFast=false)', async () => {
    const runner = new FakeRunner();
    const workflow = new BatExtractWorkflow(runner, { config: { workflow: { failFast: false, continueOnPartialErrors: true, verbose: false } as any } });
    await workflow.runCompleteWorkflow();
    // On ne vérifie pas l'intégralité du rapport ici (impl interne),
    // test se concentre sur absence d'exception bloquante.
  });
});
