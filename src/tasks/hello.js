const {StringCodec} = require('nats');
const codec = StringCodec();

/**
 * Handling of the hello task
 *
 * @param nc {NatsConnection} NATS connection
 * @param msg {Message} Message received from NATS
 */
module.exports = (nc, msg) =>
{
    console.log(msg.data.toString());

    nc.publish('debug', codec.encode('Hello from worker'));
};