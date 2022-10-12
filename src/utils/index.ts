/* -------------------------------------------------------------------------- */
/* UTILS                                                                      */
/* -------------------------------------------------------------------------- */
import axios from 'axios';
import util from 'util';
import child_process from 'child_process';
import { read_config } from '../commands/config';

export const exec = util.promisify(child_process.exec);

export const api = async (url: string, method?: string, params?: unknown, header?: object) => {
    try {
        const res = await axios(url, {
            method : method || 'GET',
            params,
            headers: {
                'X-Redmine-API-Key': read_config('token'),
                'Content-Type'     : 'application/json',
                ...header,
            },
        });
        return res;
    } catch (error: any) {
        return {
            error: error.request.res.statusMessage,
        };
    }
};
