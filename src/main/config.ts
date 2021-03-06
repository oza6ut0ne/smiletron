import ElectronStore from 'electron-store';
import { getVarName } from '../common/util';

export const toggleStatusWithAuto = ['auto', 'enabled', 'disabled'] as const;
type ToggleStatusWithAuto = typeof toggleStatusWithAuto[number];


interface ConfigSchema {
    readonly listenPort: number;
    readonly bindAddress: string;
    readonly duration: number;
    readonly deltaDuration: number;
    readonly newlineEnabled: boolean;
    readonly iconEnabled: boolean;
    readonly inlineImgEnabled: boolean;
    readonly imgEnabled: boolean;
    readonly videoEnabled: boolean;
    readonly useMultiWindow: ToggleStatusWithAuto;
    readonly globalRestoreAccelerator: string;
}

class Config {
    private store: ElectronStore<ConfigSchema>;
    private defaultValues: ConfigSchema = {
        listenPort: 2525,
        bindAddress: '::',
        duration: 5000,
        deltaDuration: 1000,
        newlineEnabled: true,
        iconEnabled: true,
        inlineImgEnabled: true,
        imgEnabled: true,
        videoEnabled: true,
        useMultiWindow: 'auto',
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

    set listenPort(value: number) {
        this.store.set(getVarName(() => this.defaultValues.listenPort), value);
    }

    get bindAddress(): string {
        return this.store.get(getVarName(() => this.defaultValues.bindAddress));
    }

    set bindAddress(value: string) {
        this.store.set(getVarName(() => this.defaultValues.bindAddress), value);
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

    get useMultiWindow(): ToggleStatusWithAuto {
        return this.store.get(getVarName(() => this.defaultValues.useMultiWindow));
    }

    set useMultiWindow(value: ToggleStatusWithAuto) {
        this.store.set(getVarName(() => this.defaultValues.useMultiWindow), value);
    }

    get globalRestoreAccelerator(): string {
        return this.store.get(getVarName(() => this.defaultValues.globalRestoreAccelerator));
    }

    set globalRestoreAccelerator(value: string) {
        this.store.set(getVarName(() => this.defaultValues.globalRestoreAccelerator), value);
    }
}

export const config = new Config();
