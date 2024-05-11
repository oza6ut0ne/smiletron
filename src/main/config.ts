import ElectronStore from 'electron-store';
import { getVarName } from '../common/util';

export const toggleStatusWithAuto = ['auto', 'enabled', 'disabled'] as const;
type ToggleStatusWithAuto = typeof toggleStatusWithAuto[number];


interface ConfigSchema {
    readonly listenPort: number;
    readonly bindAddress: string;
    readonly useTcp: boolean;
    readonly useMqtt: boolean;
    readonly muteTcp: boolean;
    readonly muteMqtt: boolean;
    readonly mqttOptions: MqttConfigSchema;
    readonly duration: number;
    readonly deltaDuration: number;
    readonly visibleOnAllWorkspaces: boolean;
    readonly useMultiWindow: ToggleStatusWithAuto;
    readonly newlineEnabled: boolean;
    readonly iconEnabled: boolean;
    readonly inlineImgEnabled: boolean;
    readonly imgEnabled: boolean;
    readonly videoEnabled: boolean;
    readonly roundIconEnabled: boolean;
    readonly frameRateLimitEnabled: boolean;
    readonly hardwareAccelerationEnabled: boolean;
    readonly globalRestoreAccelerator: string;
}

interface MqttConfigSchema {
    readonly hostname: string | null;
    readonly port: number | null;
    readonly protocol: string | null;
    readonly protocolVersion: 5 | 4 | 3;
    readonly topics: string | Array<string>;
    readonly qos: 0 | 1 | 2;
    readonly clientId: string | null;
    readonly username: string | null;
    readonly password: string | null;
    readonly rejectUnauthorized: boolean;
    readonly wsOptions: MqttWsOptionsConfigSchema;
}

interface MqttWsOptionsConfigSchema {
    readonly headers: { [key: string]: string }
}

class Config {
    private store: ElectronStore<ConfigSchema>;
    private defaultValues: ConfigSchema = {
        listenPort: 2525,
        bindAddress: '::',
        useTcp: true,
        useMqtt: false,
        muteTcp: false,
        muteMqtt: false,
        mqttOptions: {
            hostname: null,
            port: null,
            protocol: 'mqtt',
            protocolVersion: 5,
            topics: ['#'],
            qos: 0,
            clientId: null,
            username: null,
            password: null,
            rejectUnauthorized: true,
            wsOptions: {
                headers: {}
            }
        },
        duration: 5000,
        deltaDuration: 1000,
        visibleOnAllWorkspaces: true,
        useMultiWindow: 'auto',
        newlineEnabled: true,
        iconEnabled: true,
        inlineImgEnabled: true,
        imgEnabled: true,
        videoEnabled: true,
        roundIconEnabled: false,
        frameRateLimitEnabled: true,
        hardwareAccelerationEnabled: false,
        globalRestoreAccelerator: 'CmdOrCtrl+Shift+Space'
    };

    constructor() {
        this.store = new ElectronStore<ConfigSchema>({ defaults: this.defaultValues });
    }

    clear() {
        this.store.clear();
    }

    get listenPort(): number {
        return this.store.get(getVarName(() => this.defaultValues.listenPort));
    }

    get bindAddress(): string {
        return this.store.get(getVarName(() => this.defaultValues.bindAddress));
    }

    get useTcp(): boolean {
        return this.store.get(getVarName(() => this.defaultValues.useTcp));
    }

    get useMqtt(): boolean {
        return this.store.get(getVarName(() => this.defaultValues.useMqtt));
    }

    get muteTcp(): boolean {
        return this.store.get(getVarName(() => this.defaultValues.muteTcp));
    }

    set muteTcp(value: boolean) {
        this.store.set(getVarName(() => this.defaultValues.muteTcp), value);
    }

    get muteMqtt(): boolean {
        return this.store.get(getVarName(() => this.defaultValues.muteMqtt));
    }

    set muteMqtt(value: boolean) {
        this.store.set(getVarName(() => this.defaultValues.muteMqtt), value);
    }

    get mqttOptions(): MqttConfigSchema {
        return this.store.get(getVarName(() => this.defaultValues.mqttOptions));
    }

    get duration(): number {
        return this.store.get(getVarName(() => this.defaultValues.duration));
    }

    set duration(value: number) {
        this.store.set(getVarName(() => this.defaultValues.duration), value);
    }

    getDefaultDuration() {
        return this.defaultValues.duration;
    }

    resetDuration() {
        this.store.set(getVarName(() => this.defaultValues.duration), this.defaultValues.duration);
    }

    get deltaDuration(): number {
        return this.store.get(getVarName(() => this.defaultValues.deltaDuration));
    }

    set deltaDuration(value: number) {
        this.store.set(getVarName(() => this.defaultValues.deltaDuration), value);
    }

    get visibleOnAllWorkspaces(): boolean {
        return this.store.get(getVarName(() => this.defaultValues.visibleOnAllWorkspaces));
    }

    set visibleOnAllWorkspaces(value: boolean) {
        this.store.set(getVarName(() => this.defaultValues.visibleOnAllWorkspaces), value);
    }

    get useMultiWindow(): ToggleStatusWithAuto {
        return this.store.get(getVarName(() => this.defaultValues.useMultiWindow));
    }

    set useMultiWindow(value: ToggleStatusWithAuto) {
        this.store.set(getVarName(() => this.defaultValues.useMultiWindow), value);
    }

    get newlineEnabled(): boolean {
        return this.store.get(getVarName(() => this.defaultValues.newlineEnabled));
    }

    set newlineEnabled(value: boolean) {
        this.store.set(getVarName(() => this.defaultValues.newlineEnabled), value);
    }

    get iconEnabled(): boolean {
        return this.store.get(getVarName(() => this.defaultValues.iconEnabled));
    }

    set iconEnabled(value: boolean) {
        this.store.set(getVarName(() => this.defaultValues.iconEnabled), value);
    }

    get inlineImgEnabled(): boolean {
        return this.store.get(getVarName(() => this.defaultValues.inlineImgEnabled));
    }

    set inlineImgEnabled(value: boolean) {
        this.store.set(getVarName(() => this.defaultValues.inlineImgEnabled), value);
    }

    get imgEnabled(): boolean {
        return this.store.get(getVarName(() => this.defaultValues.imgEnabled));
    }

    set imgEnabled(value: boolean) {
        this.store.set(getVarName(() => this.defaultValues.imgEnabled), value);
    }

    get videoEnabled(): boolean {
        return this.store.get(getVarName(() => this.defaultValues.videoEnabled));
    }

    set videoEnabled(value: boolean) {
        this.store.set(getVarName(() => this.defaultValues.videoEnabled), value);
    }

    get roundIconEnabled(): boolean {
        return this.store.get(getVarName(() => this.defaultValues.roundIconEnabled));
    }

    set roundIconEnabled(value: boolean) {
        this.store.set(getVarName(() => this.defaultValues.roundIconEnabled), value);
    }

    get frameRateLimitEnabled(): boolean {
        return this.store.get(getVarName(() => this.defaultValues.frameRateLimitEnabled));
    }

    set frameRateLimitEnabled(value: boolean) {
        this.store.set(getVarName(() => this.defaultValues.frameRateLimitEnabled), value);
    }

    get hardwareAccelerationEnabled(): boolean {
        return this.store.get(getVarName(() => this.defaultValues.hardwareAccelerationEnabled));
    }

    set hardwareAccelerationEnabled(value: boolean) {
        this.store.set(getVarName(() => this.defaultValues.hardwareAccelerationEnabled), value);
    }

    get globalRestoreAccelerator(): string {
        return this.store.get(getVarName(() => this.defaultValues.globalRestoreAccelerator));
    }
}

export const config = new Config();
