var express = require("express")
var path = require("path")
const app = require('express')();
app.use(express.static(path.join(__dirname, 'build')));


app.get('/*', (req, res) => {
  res.sendFile(path.join(__dirname, 'build', 'index.html'));
});
const server = require('http').createServer(app);
const io= require('socket.io')(server,{
    cors:{
        origin:"*",
    }
});
const roomnames={}
const state={}
io.on('connection', socket =>{
    console.log("socket connected :",socket.id)
    socket.on('keydown', handleKeydown);
    socket.on("create-room",createroom);
    socket.on("join-room",joinroom);
    function createroom(){
        var roomname = Math. floor(1000 + Math. random() * 9000).toString(); console.log(roomname);
        roomnames[socket.id]= roomname
        socket.join(roomname)
        socket.emit('gameCode',roomname)
        state[roomname]=initGame()
        socket.number=1
        socket.emit("player",1)
        
    }
    function joinroom(roomname){
        const room = io.sockets.adapter.rooms[roomname]
        let allusers
        if(room){
            allusers=room.sockets
        }
        let numclients
        if(allusers){
            numclients=Object.keys(allusers).length
            if(numclients ===0){
                socket.emit("invalid-room");
                return;
            }else if(numclients>1){
                socket.emit("too-many-players");
                return;
            }

        }
        roomnames[socket.id]= roomname
        socket.join(roomname)
        socket.emit('gameCode',roomname)
        state[roomname]=initGame()
        socket.number=2
        socket.emit("player",1)
    }
    function handleKeydown(key){
        
        const roomName = roomnames[socket.id];
        console.log(key,roomName)
        if (!roomName) {
        return;
        }
        try {
        key = parseInt(key);
        } 
        catch(e) {
            console.error(e);
            return;
        }
        if(socket.number ==1){
            state[roomName][key]="X"
        }
        else{
            state[roomName][key]="O"
        }
        console.log(state[roomName])
        const winner = validateWinner(state[roomName]);
        if (!winner) {
            emitGameState(roomName, state[roomName])
          } else {
            emitGameOver(roomName, winner);
            state[roomName] = null;
          }
    }
    function emitGameState(room, gameState) {
        // Send this event to everyone in the room.
        console.log(room,gameState)
        io.sockets.in(room)
          .emit('gameState', JSON.stringify(gameState));
        if(socket.number===1){
            socket.broadcast.emit("player",2)
        }
        else{
            socket.broadcast.emit("player",1)
        }
        
      }
      
    function emitGameOver(room, winner) {
        io.sockets.in(room)
          .emit('gameOver', JSON.stringify({ winner }));
      }
    function initGame(){
        return ["","","","","","","","",""]
    }
    function validateWinner(board){
        let wincom=[
            [0,1,2],
            [3,4,5],
            [6,7,8],
            [0,3,6],
            [1,4,7],
            [2,5,8],
            [0,4,8],
            [2,4,6],
          ]
          for(let i=0;i<wincom.length;i++){
            let com= wincom[i]
            let p1=com[0]
            let p2=com[1]
            let p3=com[2]
            if(board[p1] !="" && board[p2] !="" && board[p3] !="" && board[p1]==board[p2] && board[p3]==board[p2] && board[p1]==board[p3] ){
              console.log("wins")
              return socket.number
            }
          }
          if(board[0] !="" && board[1] !="" && board[2] !="" && board[3] !="" && board[4] !="" && board[5] !="" && 
          board[6] !="" && board[7] !="" && board[8] !="" )
            {
                console.log("draw")
                return 0
            }
    }
})

server.listen(5000,()=>{
    console.log("server listening in port 5000 ...")
})