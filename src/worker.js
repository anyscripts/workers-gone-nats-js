const {hostname} = require('os');
const logger = require('pino')({
    name: `Worker [${hostname()}]`
});
const {
    connect,
    StringCodec
} = require('nats');
const {
    join,
    resolve
} = require('path');
const {existsSync} = require('fs');
const codec = StringCodec();

const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

const defaultResponse = {
    pid: process.pid,
    hostname: hostname()
};

(async () =>
{
    const nc = await connect({
        servers: ['nats://localhost:4222'],
        name: `Worker-[${hostname()}]`
    });

    logger.info(nc.getServer());

    let workerBusy = false;

    logger.info('Worker Instance connected to NATS');

    // Subscribe to "task.*" subject
    nc.subscribe('task.>', {
        queue: 'task',
        callback: async (err, msg) =>
        {
            if (err)
            {
                logger.error(err);
                return;
            }

            if (workerBusy)
            {
                logger.info('Worker is busy, cannot process new task');
                return;
            }

            logger.info(process.pid, 'Received task on subject: ', msg.subject);
            workerBusy = true;

            if (msg.subject.startsWith('task.'))
            {
                const [, ...arrPath] = msg.subject.split('.');
                const pathToHandler = resolve(join(__dirname, 'tasks', ...arrPath));
                //
                // Check if the handler exists
                //
                if (existsSync(`${pathToHandler}.js`))
                {
                    // Publish message to "worker.busy" subject to indicate that the instance is now busy
                    nc.publish('worker.busy', codec.encode(JSON.stringify({...defaultResponse})));

                    // Process the task
                    logger.info('Processing task with payload');
                    // ...
                    await delay(10000);

                    const handler = require(`${pathToHandler}`);
                    try
                    {
                        await handler(nc, msg);
                    }
                    catch (e)
                    {
                        logger.error(e);
                    }
                }
            }

            workerBusy = false;

            // Publish a message to "worker.available" subject to indicate that the instance is now available
            nc.publish('worker.available', codec.encode(JSON.stringify({...defaultResponse})));
        }
    });
})();