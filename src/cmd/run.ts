import { resolve } from 'path';
import { config } from 'dotenv';

import { Command } from './command';
import { CreateCommand } from "./create.command";
import { Lambda } from 'aws-sdk';

const env = config({ path: resolve('./.env') }).parsed;

const getCommand = (alias: string): Command | null => {
  switch (alias) {
    case 'create':
      return new CreateCommand();

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
