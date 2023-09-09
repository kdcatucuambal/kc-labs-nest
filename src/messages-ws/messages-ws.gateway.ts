import { OnGatewayConnection, OnGatewayDisconnect, SubscribeMessage, WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { MessagesWsService } from './messages-ws.service';
import { Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { NewMessageDto } from './dtos/new-message.dto';
import { JwtService } from '@nestjs/jwt';
import { JwtPayload } from 'src/auth/interfaces';

@WebSocketGateway({
  cors: true,
  namespace: '/messages', //namespace is the path to connect to this gateway
})
export class MessagesWsGateway implements OnGatewayConnection, OnGatewayDisconnect {

  private readonly logger = new Logger(MessagesWsGateway.name);
  @WebSocketServer() wss: Server;

  constructor(
    private readonly messagesWsService: MessagesWsService,
    private readonly jwtService: JwtService
  ) { }

  async handleConnection(client: Socket, ...args: any[]) {

    const token = client.handshake.headers.authentication as string;
    let payload: JwtPayload;
    await this.messagesWsService.registerClient(client, payload.id);
    try {
      payload = this.jwtService.verify(token);
    } catch (error) {
      client.disconnect();
      return;
    }

    console.log('client connected' + payload);

    this.logger.log(`Client connected: ${client.id}`);

    this.logger.log(`Total connected clients: ${this.messagesWsService.getConnectedClients()}`);
    this.wss.emit('clients-updated', this.messagesWsService.getConnectedClientsIds()); //send message to all connected clients
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
    this.messagesWsService.removeClient(client.id);
    this.logger.log(`Total connected clients: ${this.messagesWsService.getConnectedClients()}`);
    this.wss.emit('clients-updated', this.messagesWsService.getConnectedClientsIds()); //send message to all connected clients
  }

  @SubscribeMessage('message-from-client')
  onHandleMessage(client: Socket, payload: NewMessageDto): void {
    this.logger.log(`Message from client: ${payload.message}`);
    //client.emit('message-from-server', payload); //send message to the client that sent the message
    //client.broadcast.emit('message-from-server', payload); //send message to all connected clients except the client that sent the message

    const fullName = this.messagesWsService.getUserFullName(client.id);

    this.wss.emit('message-from-server', {
      fullName,
      message: payload.message
    }); //send message to all connected clients
  }

}
