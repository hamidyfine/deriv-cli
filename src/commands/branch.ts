/* -------------------------------------------------------------------------- */
/* CREATE NEW BRANCH                                                          */
/* -------------------------------------------------------------------------- */
import { api, exec } from '../utils';
import { read_config } from './config';
import { snakeCase } from 'change-case';
import chalk from 'chalk';

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
                    console.log(chalk.red('Please provide -i option with issue number'));
                    process.exit(1);
                }
                const issue: any = await api(`https://redmine.deriv.cloud/issues/${options.issue}.json`);
                if (issue?.error) {
                    console.log(chalk.red(issue.error));
                    process.exit(1);
                } else {
                    const filter_title = issue.data.issue.subject.replace(/Developer_name/gi, '').replace(/Task/gi, '');
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
