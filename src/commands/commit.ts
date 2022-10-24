/* -------------------------------------------------------------------------- */
/* COMMIT COMMAND                                                             */
/* -------------------------------------------------------------------------- */
import { prompt } from 'enquirer';
import { exec, alert } from '../utils';
import { read_config } from './config';
import { TIssue } from '../types/issue.types';
import { capitalCase } from 'change-case';
import { fetch_issue, clean_issue_subject } from '../utils/issue';

export const commit = (program: any) => {
    program
        .command('commit')
        .description('Commit changes based on the CommitLint Rules')
        .option('-i, --issue <issue>', 'Issue number')
        .option('-m, --message <message>', 'Commit message')
        .option('-e, --allow-empty', 'Allow empty commit')
        .option('-a, --add-all', 'Stage all files')
        .action(async (options: any) => {
            let issue: TIssue;
            if (options.issue) {
                issue = await fetch_issue(options.issue);
            }
            
            const filter_title = issue ? clean_issue_subject(issue.data.issue.subject) : null;

            const res: any = await prompt({
                type   : 'select',
                name   : 'type',
                message: 'What is the type of the Commit',
                choices: read_config('commit_types').map((n: string, index: string) => ({
                    name   : n,
                    message: `- ${capitalCase(n)}`,
                })),
            });
            const msg = options.message ? options.message : filter_title;

            if (!msg) {
                alert('Please provide a message or pass the issue number to use the issue subject as commit message', 'red');
                process.exit(1);
            }

            // TODO: Make type require when PR is merged.
            const command = `git commit -m "${res.type ? `${res.type}: ` : ''}${msg.toLowerCase()}" ${options.addAll ? '--all' : ''} ${options.allowEmpty ? '--allow-empty' : ''}`;
            const { stdout, stderr } = await exec(command);
            console.log(stdout);
            console.log(stderr);
        });
};
