/* -------------------------------------------------------------------------- */
/* SAMPLE COMMAND STRUCTURE                                                   */
/* -------------------------------------------------------------------------- */

const commandName = (program: any) => {
    program
        .command('commandName')
        .description('commandName description')
        .option('-o, --option', 'Option Description')
        .action(async (options: any) => {
            console.log(options);
        });
};

export default commandName;
