/* -------------------------------------------------------------------------- */
/* ISSUE COMMAND                                                              */
/* -------------------------------------------------------------------------- */
import { prompt } from 'enquirer';
import open from 'open';
import { fetch_issue, update_issue, find_in_journals, find_in_custom_fields } from '../utils/issue';
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
            alert(`PR Link: ${pr_link}`, 'blue');
            alert('Opening PR link in the default browser...', 'blue');
            await open(pr_link);
        }
    }
    const res: any = await prompt(add_vote_confirm);
    if (res.add_vote) {
        await add_vote(options, issue);
    } else {
        alert('Oops, Please update the slack thread about your comments', 'red');
    }
};

export const issue = (program: any) => {
    program
        .command('issue')
        .description('Handle issue')
        .option('-i, --issue <issue>', 'Issue number')
        .option('-s, --start', 'Start working on issue')
        .option('-ad, --add-vote', 'Add your vote to the issue')
        .option('-pr, --review', 'Review PR of the issue')
        .action(async (options: any) => {
            const issue: TIssue = await fetch_issue(options.issue, 'include=children,attachments,relations,changesets,journals,watchers,allowed_statuses');

            if (!issue.data) {
                alert('There is an issue with fetch the issue from redmine. Please try again.', 'red');
                process.exit(1);
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
        });
};