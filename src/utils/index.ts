/* -------------------------------------------------------------------------- */
/* UTILS                                                                      */
/* -------------------------------------------------------------------------- */
import axios from 'axios';
import util from 'util';
import chalk, { Color, Modifiers } from 'chalk';
import child_process from 'child_process';
import { read_config } from '../commands/config';

export const api_url = 'https://redmine.deriv.cloud';

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

export const alert = (msg: string, color?: typeof Color, weight?: typeof Modifiers) => {
    if (weight) {
        console.log(chalk[weight][color || 'white'](msg));
    } else {
        console.log(chalk[color || 'white'](msg));
    }
};
