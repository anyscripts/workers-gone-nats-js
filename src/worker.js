const {connect, StringCodec} = require('nats');
const codec = StringCodec();

const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

(async () =>
{
    // Connect to NATS
    const nc = await connect({
        servers: ['nats://localhost:4222'],
        name: 'Worker'
    });

    console.log(nc.getServer());

    // Flag to indicate whether the worker is busy or available
    let workerBusy = false;

    console.log('Worker Instance connected to NATS');

    // Subscribe to "task.*" subject
    nc.subscribe('task.*', {
        queue: 'task',
        callback: async (err, msg) =>
        {
            if (err)
            {
                console.log(err);
                return;
            }

            if (workerBusy)
            {
                console.log('Worker is busy, cannot process new task');
                return;
            }

            console.log(process.pid, 'Received task on subject: ', msg.subject);
            workerBusy = true;

            // Publish message to "worker.busy" subject to indicate that the instance is now busy
            nc.publish('worker.busy', codec.encode(JSON.stringify({id: 'worker-1'})));

            // Process the task
            console.log('Processing task with payload: ', msg.data.toString());
            // ...
            await delay(1000);

            workerBusy = false;

            // Publish a message to "worker.available" subject to indicate that the instance is now available
            nc.publish('worker.available', codec.encode(JSON.stringify({id: 'worker-1'})));
        }
    });

    //Subscribe to "worker.available" subject
    nc.subscribe('worker.available', {
        queue: 'worker',
        callback: (err, _msg) =>
        {
            if (err)
            {
                console.log(err);
                return;
            }

            if (!workerBusy)
            {
                console.log('Worker is available, checking for tasks');
                // Retrieve a task from the task queue
                nc.request('task.queue', function(msg)
                {
                    if (!msg)
                    {
                        console.log('No tasks available in the queue');
                        return;
                    }

                    console.log('Retrieved task from the queue');
                    workerBusy = true;

                    // Publish message to "worker.busy" subject to indicate that the instance is now busy
                    nc.publish('worker.busy', JSON.stringify({id: 'worker-1'}));

                    // Process the task
                    console.log('Processing task with payload: ', msg.toString());
                    // ...

                    workerBusy = false;

                    // Publish message to "worker.available" subject to indicate that the instance is now available
                    nc.publish('worker.available', codec.encode(JSON.stringify({id: 'worker-1'})));
                });
            }
        }
    });
})();