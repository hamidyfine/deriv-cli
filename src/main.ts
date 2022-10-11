import commander from 'commander';
import commandName from './commands/command-name';
import { name, version } from '../package.json';

const program = new commander.Command();

commandName(program);

program.name(name);
program.version(version);

program.parse();
