import {io} from '../../server.js';

const onWebrtcSignal = async (data) => {

     const participants = data?.ongoingCall?.participants;

    if (!participants) {
        console.error("Missing participants in ongoingCall:", data);
        return;
    }
    
    if(data.isCaller){
        if(data.ongoingCall.participants.receiver.socketId){
            io.to(data.ongoingCall.participants.receiver.socketId).emit('webrtcSignal', data)
        }
    }else{
        if(data.ongoingCall.participants.caller.socketId){
            io.to(data.ongoingCall.participants.caller.socketId).emit('webrtcSignal', data)
        }
    }
}

export default onWebrtcSignal;