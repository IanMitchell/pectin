'use strict';

const fs = require('fs');
const path = require('path');
const log = require('npmlog');
const yargs = require('yargs/yargs');
const { findConfigs } = require('@pectin/api');
const invokeRollup = require('./invoke-rollup');

log.heading = 'pectin';

async function handler(argv) {
    const { version } = JSON.parse(
        fs.readFileSync(path.resolve(__dirname, '../package.json'), 'utf8')
    );

    log.notice('cli', `v${version}`);

    if (argv.watch) {
        // always runs, no matter what
        log.info('watching', 'packages');
        invokeRollup(argv);
    } else if ((await findConfigs(argv)).length === 0) {
        // nothing to do, avoid rollup error
        log.info('skipping', 'packages unchanged since last build');
    } else {
        // (possibly) incremental build
        log.info('building', 'packages');
        invokeRollup(argv);
    }
}

module.exports = function CLI(argv, cwd) {
    return yargs(argv, cwd)
        .usage(
            '$0',
            // @ts-ignore (typescript can't handle ...string concatenation?!?)
            'Execute incremental rollup builds on all monorepo packages.\n' +
                'Any additional (unknown) arguments are passed to the rollup CLI.',
            () => {},
            handler
        )
        .parserConfiguration({
            'unknown-options-as-args': true,
        })
        .options({
            w: {
                alias: 'watch',
                description: 'Rebuild packages on change',
                type: 'boolean',
            },
            cwd: {
                description: 'Current working directory',
                defaultDescription: 'process.cwd()',
                default: () => process.cwd(),
            },
            concurrency: {
                description: 'Number of concurrent filesystem tasks',
                defaultDescription: '# of CPUs',
                type: 'number',
            },
        })
        .alias('h', 'help')
        .alias('v', 'version');
};
