import net from "net";
import { ICommentSender } from "../ipc";


export function startTcpServer(commentSender: ICommentSender, listenPort: number) {
    net.createServer(conn => {
        conn.on('data', data => {
            commentSender.sendCommentToRenderer(data.toString());
            conn.end();
        });
    }).listen(listenPort);
}
