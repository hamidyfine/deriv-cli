import commander from 'commander';
import { branch, config, issue, commit } from './commands';
import { name, version } from '../package.json';

const program = new commander.Command();

config(program);
issue(program);
branch(program);
commit(program);

program.name(name);
program.version(version);

program.parse();
