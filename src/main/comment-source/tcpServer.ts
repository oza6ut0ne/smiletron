import net from "net";
import { ICommentSender } from "../ipc";


export function startTcpServer(commentSender: ICommentSender, listenPort: number, bindAddress: string) {
    if (listenPort < 0) {
        return;
    }

    net.createServer(conn => {
        const buffers: Buffer[] = [];
        conn.on('data', data => {
            buffers.push(data);
            conn.end();
        });
        conn.on('end', () => {
            const buf = Buffer.concat(buffers);
            commentSender.sendCommentToRenderer(buf.toString());
        });
    }).listen(listenPort, bindAddress);
}
