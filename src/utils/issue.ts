/* -------------------------------------------------------------------------- */
/* ISSUE UTILS                                                                */
/* -------------------------------------------------------------------------- */
import { api, api_url, alert } from './index';
import { read_config } from '../commands';
import type { TJournal, TCustomField, TIssue, TStatus } from '../types/issue.types';

export const fetch_issue = async (id: string, query?: string) => {
    const issue: TIssue = await api(`${api_url}/issues/${id}.json${query ? `?${query}` : ''}`);
    if (!issue?.data) {
        alert('There is an issue with fetch the issue from redmine. Please try again.', 'red');
        process.exit(1);
    }
    return issue;
};

export const update_issue = async (id: string, query: object) => {
    return await api(`${api_url}/issues/${id}.json`, 'PUT', { ...query });
};

export const issue_statuses = async () => {
    const statuses: TStatus = await api(`${api_url}/issue_statuses.json`);
    return statuses.data.issue_statuses;
};

export const issue_status_id = async (name: string) => {
    const statuses = await issue_statuses();
    let id: number | null = null;
    statuses.forEach((status: any) => {
        if (status.name.toLowerCase() === name.toLowerCase()) {
            id = status.id;
        }
    });
    return id;
};

export const user_issues = async (user_id: string, status: 'open'|'close'|'*') => {
    let query = `?assigned_to_id=${user_id || read_config('id')}`;
    query += `&status_id=${status || '*'}`;
    return await api(`${api_url}/issues.json${query}`);
};

export const find_in_journals = (journals: TJournal[], slug: string) => {
    let slug_value: string | null = null;
    Object.keys(journals).forEach((key: TJournal) => {
        Object.keys(journals[key].details).forEach((k) => {
            if (journals[key].details[k].name === slug) {
                slug_value = journals[key].details[k].new_value;
            }
        });
    });
    return slug_value;
};

export const find_in_custom_fields = (fields: TCustomField[], slug: string) => {
    let slug_value: TCustomField = null;
    Object.keys(fields).forEach((key: TJournal) => {
        if (fields[key].name.toLowerCase() === slug.toLowerCase()) {
            slug_value = fields[key];
        }
    });
    return slug_value;
};

export const clean_issue_subject = (subject: string) => {
    if (!subject) {
        alert('Please provide the subject', 'red');
        process.exit(1);
    }

    return subject.substring(subject.indexOf('/') + 1).replace(/-/gi, ' ').replace(/Developer_name/gi, '').replace(/Task/gi, '').trim();
};
