
function getIO() {
  if (!global.io) {
    throw new Error("Socket.io not initialized!");
  }
  return global.io;
}

module.exports = { getIO };