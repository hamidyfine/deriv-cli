/* eslint-disable no-unused-vars */
/* -------------------------------------------------------------------------- */
/* ISSUE COMMAND                                                              */
/* -------------------------------------------------------------------------- */
import { prompt } from 'enquirer';
import { fetch_issue, update_issue, find_in_journals } from '../utils/issue';
import { read_config } from './config';
import type { TIssue, TJournal } from '../types/issue.types';
import { alert } from '../utils';

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

export const issue = (program: any) => {
    program
        .command('issue')
        .description('Handle issue')
        .option('-i, --issue <issue>', 'Issue number')
        .option('-s, --start', 'Start working on issue')
        .action(async (options: any) => {
            const issue: TIssue = await fetch_issue(options.issue, 'include=children,attachments,relations,changesets,journals,watchers,allowed_statuses');

            // Start the Issue
            if (options.start) {
                await start_issue(options, issue);
            }
        });
};