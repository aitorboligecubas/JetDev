export const TASK_STATES = Object.freeze({
  QUEUED: 'queued',
  GENERATING: 'generating',
  BUILDING: 'building',
  DEPLOYING: 'deploying',
  PUSHING: 'pushing',
  DEPLOYED: 'deployed',
  ACCEPTED: 'accepted',
  ERROR: 'error',
});

export const TASK_STATE_LIST = Object.freeze(Object.values(TASK_STATES));

export const TERMINAL_STATES = Object.freeze([
  TASK_STATES.DEPLOYED,
  TASK_STATES.ACCEPTED,
  TASK_STATES.ERROR,
]);

export function isValidState(state) {
  return TASK_STATE_LIST.includes(state);
}

export function isTerminalState(state) {
  return TERMINAL_STATES.includes(state);
}

export default TASK_STATES;
