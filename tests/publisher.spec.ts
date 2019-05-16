import fs from 'fs';
import { expect } from 'chai';
import aws from 'aws-sdk';

import { Mock, newMock, setMocks } from './mocks';
import { Publisher } from '../src/publisher';

describe('Publisher', () => {

  const s3KeyParameters: aws.S3.GetObjectRequest = { Key: '', Bucket: '' };
  const s3Client = new aws.S3();

  let publisher: Publisher;

  let mocks: Mock[] = [];
  const addMocks = (object: any, ...mocksList: Mock[]) => {

    mocks = setMocks(object, ...mocksList);
  };

  beforeEach(() => {

    publisher = new Publisher(s3KeyParameters, s3Client);
  });

  afterEach(() => {

    mocks.map((mock: Mock) => mock.stub && mock.stub.restore());
    mocks = [];
  });

  it('should set private properties', () => {

    expect(publisher['s3KeyParams']).to.equal(s3KeyParameters);
    expect(publisher['s3Client']).to.equal(s3Client);
  });

  describe('#load()', () => {

    it('should throw an error', () => {

      addMocks(s3Client, newMock('getObject', new Error('err'), undefined));
      publisher['load']()
        .then((res) => expect(res).to.equal(null))
        .catch((err) => expect(err.message).to.equal('err'))
    });

    it('should return a data.Body property', async () => {

      const response: aws.S3.GetObjectOutput = { Body: 'object-body' };
      addMocks(s3Client, newMock('getObject', null, response));
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

  describe('#execute method consumers', () => {

    beforeEach(() => {

      addMocks(publisher, newMock('execute', null));
      mocks[0].stub && mocks[0].stub.resolves(true);
    });

    describe('#unpack', () => {

      it('should execute valid commands', () => {

        if (!mocks[0].stub) throw new Error('Stub issue detected');

        const file = '/fake/path/file.zip';
        const dist = '/dist/path';

        publisher['unpack'](file, dist)
          .then((res: boolean) => expect(res).to.be.true);

        mocks[0].stub.calledOnceWith(`unzip -o -q ${file} -d ${dist}`);
        mocks[0].stub.calledOnceWith(`rm ${file}`);
      });
    });

    describe('#makeStaticFrom', () => {

      it('should execute valid command', () => {

        if (!mocks[0].stub) throw new Error('Stub issue detected');

        const source = '/fake/src/path';
        const website = 'www.example.com';
        const theme = 'test';

        publisher.makeStaticFrom(source, website, theme)
          .then((res: boolean) => expect(res).to.be.true);

        mocks[0].stub.calledOnceWith(`hugo -s -${source} -b ${website} -t ${theme}`);
      });
    });

    describe('#deployFrom', () => {

      it('should execute valid command', () => {

        if (!mocks[0].stub) throw new Error('Stub issue detected');

        const source = '/fake/src/path';

        publisher.deployFrom(source)
          .then((res: boolean) => expect(res).to.be.true);

        mocks[0].stub.calledOnceWith('bsync -config=env -aws-auth=false');
        mocks[0].stub.calledOnceWith(`rm -rf ${source}`);
      });
    });
  });
});
