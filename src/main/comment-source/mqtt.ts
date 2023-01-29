import { connect } from "mqtt";
import { config } from "../config";
import { ICommentSender } from "../ipc";

export function startMqtt(commentSender: ICommentSender) {
    const options = config.mqttOptions;

    if (!config.useMqtt || options.host === null) {
        return;
    }

    // @ts-ignore
    const client = connect(options);
    client.subscribe(options.topics, { qos: options.qos });
    client.on('message', (_topic, payload) => {
        if (!config.muteMqtt) {
            commentSender.sendCommentToRenderer(payload.toString());
        }
    })
}