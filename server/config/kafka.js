const { Kafka } = require('kafkajs');

const kafka = new Kafka({
  clientId: 'garbage-system',
  brokers: [process.env.KAFKA_BROKER || 'localhost:9092']
});

const producer = kafka.producer();
const consumer = kafka.consumer({ groupId: 'complaint-group' });

const connect = async () => {
  await producer.connect();
  await consumer.connect();
  await consumer.subscribe({ topic: 'ai-analysis', fromBeginning: true });
};

const disconnect = async () => {
  await producer.disconnect();
  await consumer.disconnect();
};

module.exports = {
  producer,
  consumer,
  connect,
  disconnect
};