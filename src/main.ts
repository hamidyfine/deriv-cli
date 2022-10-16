import commander from 'commander';
import { branch, config, issue } from './commands';
import { name, version } from '../package.json';

const program = new commander.Command();

config(program);
branch(program);
issue(program);

program.name(name);
program.version(version);

program.parse();
