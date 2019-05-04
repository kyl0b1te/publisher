import { resolve } from 'path';

import { config } from 'dotenv';
import { Lambda } from 'aws-sdk';

import { Command } from './command';
import { CreateCommand } from "./create.command";
import { UpdateCommand } from "./update.command";

const env = config({ path: resolve('./.env') }).parsed;

const getCommand = (alias: string): Command | null => {
  switch (alias) {
    case 'create':
      return new CreateCommand();

    case 'update':
      return new UpdateCommand();

    default:
      return null;
  }
}

(async () => {

  const command = getCommand(process.argv[2]);
  if (!command) {
    console.error(`Invalid command: ${process.argv[2]}`);
    return process.exit(1);
  }

  try {
    command.setEnv(<Lambda.EnvironmentVariables>env);
    await command.run();
  } catch (error) {

    console.error(error);
    return process.exit(1);
  }
})()
