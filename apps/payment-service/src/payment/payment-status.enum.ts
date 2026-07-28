// The payment lifecycle (state machine):
//   NOT_STARTED -> EXECUTING -> SUCCESS
//                            \-> FAILED
export enum PaymentOrderStatus {
  NOT_STARTED = 'NOT_STARTED',
  EXECUTING = 'EXECUTING',
  SUCCESS = 'SUCCESS',
  FAILED = 'FAILED',
}
