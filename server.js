import express from 'express';
import { resolve } from 'path';
import { createServer } from 'http';
import { Server } from 'socket.io';
import startService, { startGlobalService } from './modules/backend/services.js';

const app = express();
app.use(express.static(resolve(resolve(), 'public')));
app.use(express.static(resolve(resolve(), 'styles')));
app.use(express.static(resolve(resolve(), 'modules/frontend')));
const httpServer = createServer(app);
const io = new Server(httpServer);

startGlobalService(io);
io.on('connection', (socket) => startService(socket, io));

httpServer.listen(8080);
