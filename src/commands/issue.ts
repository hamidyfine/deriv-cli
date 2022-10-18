/* -------------------------------------------------------------------------- */
/* ISSUE COMMAND                                                              */
/* -------------------------------------------------------------------------- */
import { prompt } from 'enquirer';
import open from 'open';
import Table from 'cli-table3';
import { fetch_issue, update_issue, find_in_journals, find_in_custom_fields, user_issues } from '../utils/issue';
import { read_config } from './config';
import type { TIssue } from '../types/issue.types';
import { alert } from '../utils';

// Prompts
const estimated_hours = {
    type   : 'numeral',
    name   : 'estimated_hours',
    message: 'Please enter your estimated hours:',
};

const point = {
    type   : 'numeral',
    name   : 'story_point',
    message: 'Please enter the story point of the card:',
};

const sprint = {
    type   : 'numeral',
    name   : 'sprint_id',
    message: 'Sprint is not set, Please enter sprint id:',
};

const add_vote_confirm = {
    type   : 'confirm',
    name   : 'add_vote',
    message: 'Do you approve the PR?',
};

// Actions
const my_issues = async () => {
    const issues: TIssue = await user_issues(read_config('id'), 'open');
    let table = new Table({
        head     : ['Number', 'Project', 'Tracker', 'Subject', 'Status', 'S. Hours', '# Votes'],
        colWidths: [8, 15, 8, 70, 15, 12, 12],
        style    : {
            compact: false,
        },
    });
    await issues.data.issues.forEach(async (issue: TIssue) => {
        const votes = await find_in_custom_fields(issue.custom_fields, 'Votes');
        table.push(
            [issue.id, issue.project.name, issue.tracker.name, issue.subject, issue.status.name, issue.total_spent_hours, votes.value.length],
        );
    });
    // @ts-ignore
    const sort_table = table.sort((a,b) => (a[4] > b[4]) ? 1 : ((b[4] > a[4]) ? -1 : 0));
    console.log();
    console.log(sort_table.toString());
};

const start_issue = async (options: any, issue: TIssue) => {
    const story_sprint = await find_in_journals(issue.data.issue.journals, 'agile_sprint');
    const story_point = await find_in_journals(issue.data.issue.journals, 'story_points');

    alert(`Change status from ${issue.data.issue.status.name} to In Progress...`, 'blue');
    await update_issue(options.issue, { issue: { status_id: 2 } });
    alert('Done', 'green');

    alert(`Change assignee to ${read_config('firstname')} ${read_config('lastname')}...`, 'blue');
    await update_issue(options.issue, { issue: { assigned_to_id: read_config('id') } });
    alert('Done', 'green');

    alert(`Add your username (${read_config('firstname')}) to subject...`, 'blue');
    const filter_title = issue.data.issue.subject.substring(issue.data.issue.subject.indexOf('/') + 1).trim();
    await update_issue(options.issue, { issue: { subject: `${read_config('login')} / ${filter_title}` } });
    alert('Done', 'green');

    if (!story_sprint) {
        const res: any = await prompt(sprint);
        alert('Adding sprint to issue', 'blue');
        await update_issue(options.issue, { issue: { agile_data_attributes: { agile_sprint_id: res.sprint_id } } });
        alert('Done', 'green');
    }

    if (!story_point) {
        const res: any = await prompt(point);
        alert('Adding story point to issue', 'blue');
        await update_issue(options.issue, { issue: { agile_data_attributes: { story_points: res.story_point } } });
        alert('Done', 'green');
    }

    if (!issue.data.issue.estimated_hours) {
        const res: any = await prompt(estimated_hours);
        alert('Adding estimated hours to issue', 'blue');
        await update_issue(options.issue, { issue: { estimated_hours: res.estimated_hours } });
        alert('Done', 'green');
    }

    alert(`Link of the issue: https://redmine.deriv.cloud/issues/${issue.data.issue.id}`);
};

const add_vote = async (options: any, issue: TIssue) => {
    const votes_field = await find_in_custom_fields(issue.data.issue.custom_fields, 'votes');
    // TODO: uncomment this when there is a way to add value to multiple objects.
    // const values = [...votes_field.value, read_config('id').toString()];
    // const new_votes_object = {
    //     custom_fields: [
    //         {
    //             id      : votes_field.id,
    //             value   : values,
    //             multiple: votes_field.multiple,
    //             name    : votes_field.name,
    //         },
    //     ],
    // };
    alert('Adding your vote to the issue', 'blue');
    if (votes_field.value.length) {
        alert('Sorry, Others have voted before you, so Redmine can let me to add yours. Please add your vote manually', 'red');
        alert(`Link of the issue: https://redmine.deriv.cloud/issues/${issue.data.issue.id}`);
    } else {
        await update_issue(options.issue, { issue: { custom_field_values: { [votes_field.id]: read_config('id').toString() } } });
    }
    alert('Done', 'green');
};

const review_pr = async (options: any, issue: TIssue) => {
    const desc = issue.data.issue.description;
    const pr_link = desc.substring(desc.indexOf('https://github.com/binary-com/deriv-app/pull/'), desc.indexOf(']'));
    console.log('🚀 ~ file: issue.ts ~ line 127 ~ pr_link', pr_link);

    const review = async () => {
        alert(`PR Link: ${pr_link}`, 'blue');
        alert('Opening PR link in the default browser...', 'blue');
        await open(pr_link);
    };

    if (!pr_link) {
        alert('The PR link is not added to the card description.', 'red');
        alert(`Card link: https://redmine.deriv.cloud/issues/${issue.data.issue.id}`);
        process.exit(1);
    }
    if (issue.data.issue.status.id !== 8) {
        alert('This card is not in needs review status', 'yellow');
        const res: any = await prompt({
            type   : 'confirm',
            name   : 'confirm_status',
            message: 'Do you want to review the card?',
        });
        if (res.confirm_status && pr_link) {
            await review();
        }
    } else {
        await review();
    }
    const res: any = await prompt(add_vote_confirm);
    if (res.add_vote) {
        await add_vote(options, issue);
    } else {
        alert('Oops, Please update the slack thread about your comments', 'red');
    }
};

const check_for_qa = async () => {
    const ready_issues: TIssue[] = [];
    const issues: TIssue = await user_issues(read_config('id'), 'open');
    let table = new Table({
        head: ['Number', 'Subject', 'Status', 'Number of Votes'],
    });

    await issues.data.issues.forEach(async (issue: TIssue) => {
        const votes = await find_in_custom_fields(issue.custom_fields, 'Votes');
        if (issue.status.name.toLowerCase() === 'needs review') {
            table.push(
                [issue.id, issue.subject, issue.status.name, votes.value.length],
            );

            if (votes.value.length > 2) {
                ready_issues.push(issue);
            }
        }
    });

    alert('List of issues in needs review status:');
    console.log();
    console.log(table.toString());

    if (ready_issues.length) {
        for (const issue in ready_issues) {
            if (ready_issues[issue].id) {
                const confirm_move_to_qa: any = await prompt({
                    type   : 'confirm',
                    name   : 'move',
                    initial: true,
                    message: `Do you to move card number ${ready_issues[issue].id} to QA?`,
                });

                if (confirm_move_to_qa.move) {
                    alert(`Change status from ${ready_issues[issue].status.name} to QA...`, 'blue');
                    await update_issue(ready_issues[issue].id, { issue: { status_id: 4 } });
                    alert('Done', 'green');
                } else {
                    alert(`Card status stays in ${ready_issues[issue].status.name}`, 'blue');
                }
            }
        }
    } else {
        console.log();
        alert('You have no cards ready for QA', 'red', 'bold');
        console.log();
    }
};

export const issue = (program: any) => {
    program
        .command('issue')
        .description('Handle issue')
        .option('-i, --issue <issue>', 'Issue number')
        .option('-mi, --my-issues', 'Check the status of my issues')
        .option('-s, --start', 'Start working on issue')
        .option('-ad, --add-vote', 'Add your vote to the issue')
        .option('-cqa, --check-for-qa', 'Check if cards are reviewed and ready to move to the QA')
        .option('-pr, --review', 'Review PR of the issue')
        .action(async (options: any) => {
            let issue: TIssue;
            if (options.issue) {
                issue = await fetch_issue(options.issue, 'include=children,attachments,relations,changesets,journals,watchers,allowed_statuses');
            }

            if ((options.start || options.review || options.addVote) && !options.issue) {
                alert('Please provide a issue number by passing -i argument to Jarvis', 'red');
                process.exit(1);
            }

            // List my issues
            if (options.myIssues) {
                await my_issues();
            }

            // Start the Issue
            if (options.start) {
                await start_issue(options, issue);
            }

            // Open the PR of the issue
            if (options.review) {
                await review_pr(options, issue);
            }

            // Add vote to the issue
            if (options.addVote) {
                await add_vote(options, issue);
            }

            // Check if cards are reviewed and ready to move to the QA
            if (options.checkForQa) {
                await check_for_qa();
            }
        });
};