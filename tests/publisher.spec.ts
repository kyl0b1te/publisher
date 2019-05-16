import fs from 'fs';
import { expect } from 'chai';
import aws, { AWSError } from 'aws-sdk';

import { Mock, setMocks } from './aws.mocks';
import { Publisher } from '../src/publisher';

describe('Publisher', () => {

  const s3KeyParameters: aws.S3.GetObjectRequest = { Key: '', Bucket: '' };
  const s3Client = new aws.S3();

  let mocks: Mock[] = [];
  const mock = (...list: Mock[]) => {
    mocks = setMocks(s3Client, ...list);
  }

  let publisher: Publisher;
  beforeEach(() => {

    publisher = new Publisher(s3KeyParameters, s3Client);
    mocks.map((mock: Mock) => {
      if (mock.stub) {
        mock.stub.restore();
      }
    });
    mocks = [];
  });

  it('should set private properties', () => {

    expect(publisher['s3KeyParams']).to.equal(s3KeyParameters);
    expect(publisher['s3Client']).to.equal(s3Client);
  });

  describe('#load()', () => {

    it('should throw an error', () => {

      mock({ method: 'getObject', error: new Error('err'), response: null });
      publisher['load']()
        .then((res) => expect(res).to.equal(null))
        .catch((err) => expect(err.message).to.equal('err'))
    });

    it('should return a data.Body property', async () => {

      const response: aws.S3.GetObjectOutput = { Body: 'object-body' };
      mock({ method: 'getObject', error: null, response });
      expect(await publisher['load']()).to.equal(response.Body);
    });
  });

  describe('#save()', () => {

    it('should throw an error', () => {

      publisher['save']('', '')
        .then((res) => expect(res).to.equal(null))
        .catch((err) => expect(err).to.not.null);
    });

    it('should save content in a file', async () => {

      const data = JSON.stringify({ test: 'a' });
      const path = await publisher['save']('/tmp/test.json', data);

      const buff = fs.readFileSync(path);
      expect(buff.toString()).to.be.equal(data);
    });
  });

  describe('#execute()', () => {

    it('should throw an error', () => {

      publisher['execute']('invalid command')
        .then((res) => expect(res).to.equal(false))
        .catch((err) => expect(err).to.not.null);
    });

    it('should succeed for valid command', () => {

      publisher['execute']('ls')
        .then((res: boolean) => expect(res).to.be.true);
    })
  });
});
