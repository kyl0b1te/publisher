import sinon, { SinonStub } from 'sinon';
import { AWSError } from 'aws-sdk';

export interface Mock {
  method: any,
  error: AWSError | Error | null,
  response: any,
  stub: SinonStub | null
};

const set = (object: any, mock: Mock): Mock => {

  mock.stub = sinon.stub(object, mock.method);
  if (mock.response !== null) {
    mock.stub.yields(mock.error, mock.response);
  }
  return mock;
}

export const newMock = (
  method: string,
  error: AWSError | Error | null,
  response: any = null
): Mock => {

  return { method, error, response, stub: null };
}

export const setMocks = (object: any, ...mocks: Mock[]): Mock[] => {

  return mocks.map((mock: Mock) => set(object, mock));
};


