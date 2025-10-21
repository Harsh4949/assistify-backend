const Queue = [];

function addTask(task) {
  Queue.push(task);
  processNext();
}

let processing = false;

async function processNext() {
  if (processing || Queue.length === 0) return;
  processing = true;

  const task = Queue.shift();
  try {
    await task();
  } catch (e) {
    console.error('Worker task failed:', e);
  }

  processing = false;
  if (Queue.length > 0) {
    setImmediate(processNext);
  }
}

module.exports = {
  addTask
};
