const clients = new Map();

function addClient(projectId, res) {
  if (!clients.has(projectId)) clients.set(projectId, []);
  clients.get(projectId).push(res);
}

function removeClient(projectId, res) {
  const list = clients.get(projectId) || [];
  clients.set(projectId, list.filter(c => c !== res));
}

function broadcast(projectId, data) {
  const list = clients.get(projectId) || [];
  const payload = `data: ${JSON.stringify(data)}\n\n`;
  list.forEach(res => res.write(payload));
}

module.exports = { addClient, removeClient, broadcast };
