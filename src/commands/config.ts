/* -------------------------------------------------------------------------- */
/* CREATE NEW BRANCH                                                          */
/* -------------------------------------------------------------------------- */
import axios from 'axios';
import { homedir } from 'os';
import { prompt } from 'enquirer';
import { File } from 'fs-pro';
import { alert } from '../utils';

interface TResponse {
    token: string;
}

const token = {
    type   : 'password',
    name   : 'token',
    message: 'Enter your redmine token:',
};

export const config_path = () => {
    const home_path = homedir();
    const filename = '.jarvis.config.json';
    return {
        home     : home_path,
        filename : filename,
        full_path: `${home_path}/${filename}`,
    };
};

export const read_config = (key: string) => {
    const file = new File(config_path().home, config_path().filename);
    const config_content = JSON.parse(file.read() as any);
    return config_content[key];
};

export const config = (program: any) => {
    program
        .command('config')
        .description('Config the Jarvis')
        .action(async () => {
            const res: TResponse = await prompt(token);
            const file = new File(config_path().home, config_path().filename);

            const my_account = await axios('https://redmine.deriv.cloud/my/account.json', {
                method : 'get',
                headers: {
                    'X-Redmine-API-Key': res.token,
                    'Content-Type'     : 'application/json',
                },
            });

            const content = {
                ...res,
                id       : my_account.data.user.id,
                login    : my_account.data.user.login,
                firstname: my_account.data.user.firstname,
                lastname : my_account.data.user.lastname,
                mail     : my_account.data.user.mail,
            };
            file.write(JSON.stringify(content));
            alert('Jarvis configured successfully.', 'green');
        });
};
