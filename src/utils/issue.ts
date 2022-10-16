/* -------------------------------------------------------------------------- */
/* ISSUE UTILS                                                                */
/* -------------------------------------------------------------------------- */
import { api, api_url } from './index';
import type { TJournal } from '../types/issue.types';

export const fetch_issue = async (id: string, query?: string) => {
    return await api(`${api_url}/issues/${id}.json${query ? `?${query}` : ''}`);
};

export const update_issue = async (id: string, query: object) => {
    return await api(`${api_url}/issues/${id}.json`, 'PUT', { ...query });
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
