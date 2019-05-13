import sinon, { SinonStub } from 'sinon';
import aws, { AWSError } from 'aws-sdk';

export interface Mock {
  method: any,
  error: AWSError | Error | null,
  response: any,
  stub?: SinonStub
};

const set = (object: any, mock: Mock): Mock => {

  mock.stub = sinon.stub(object, mock.method);
  mock.stub.yields(mock.error, mock.response);
  return mock;
}

export const setMocks = (object: any, ...mocks: Mock[]): Mock[] => {

  return mocks.map((mock: Mock) => set(object, mock));
};


