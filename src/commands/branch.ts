/* -------------------------------------------------------------------------- */
/* BRANCH COMMAND                                                             */
/* -------------------------------------------------------------------------- */
import { exec, alert } from '../utils';
import { read_config } from './config';
import { snakeCase } from 'change-case';
import { fetch_issue, clean_issue_subject } from '../utils/issue';

export const branch = (program: any) => {
    program
        .command('branch')
        .description('Create new branch')
        .option('-c, --create', 'Create new branch')
        .option('-i, --issue <issue>', 'Issue number')
        .action(async (options: any) => {
            // Create Branch
            if (options.create) {
                if (!options.issue) {
                    alert('Please provide -i option with issue number', 'red');
                    process.exit(1);
                }
                const issue: any = await fetch_issue(options.issue);
                if (issue?.error) {
                    alert(issue.error, 'red');
                    process.exit(1);
                } else {
                    const filter_title = clean_issue_subject(issue.data.issue.subject);
                    const issue_data = {
                        number: issue.data.issue.id,
                        title : snakeCase(filter_title),
                        name  : read_config('login'),
                    };
                    const { stdout, stderr } = await exec(
                        `git checkout -b ${issue_data.name}/${issue_data.number}/${issue_data.title}`,
                    );
                    console.log(stdout);
                    console.log(stderr);
                }
            }
        });
};
