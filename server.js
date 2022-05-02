import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import Connection from "./database/db.js";
import { getDocument, updateDocument } from "./controller/document-controller.js";

const PORT=process.env.PORT || 9000;
const URL=process.env.MONGODB_URI || `mongodb://advait:advait123@cluster0-shard-00-00.0d0nz.mongodb.net:27017,cluster0-shard-00-01.0d0nz.mongodb.net:27017,cluster0-shard-00-02.0d0nz.mongodb.net:27017/adocs?ssl=true&replicaSet=atlas-vx4irj-shard-0&authSource=admin&retryWrites=true&w=majority`;
Connection(URL);

const app=express();

if(process.env.NODE_ENV === 'production'){
  app.use(express.static('client/build'))
}

const httpServer=createServer(app);
httpServer.listen(PORT);

const io= new Server(httpServer);

io.on('connection',socket => {
  socket.on('get-document',async documentId => {
    const document=await getDocument(documentId);
    socket.join(documentId);
    socket.emit('load-document',document.data);

    socket.on('send-changes', delta => {
      socket.broadcast.to(documentId).emit('receive-changes',delta);
    });
    socket.on('save-document',async data => {
      await updateDocument(documentId,data);
    })
  })
  
});