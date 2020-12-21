import ElectronStore from 'electron-store';
import { getVarName } from '../common/util';

export const toggleStatusWithAuto = ['auto', 'enabled', 'disabled'] as const;
type ToggleStatusWithAuto = typeof toggleStatusWithAuto[number];


interface ConfigSchema {
    listenPort: number;
    bindAddress: string;
    duration: number;
    deltaDuration: number;
    useMultiWindow: ToggleStatusWithAuto;
}

class Config {
    private store: ElectronStore<ConfigSchema>;
    private defaultValues: ConfigSchema = {
        listenPort: 2525,
        bindAddress: '::',
        duration: 5000,
        deltaDuration: 1000,
        useMultiWindow: 'auto'
    };

    constructor() {
        this.store = new ElectronStore<ConfigSchema>({ defaults: this.defaultValues });
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

    resetDuration() {
        this.store.set(getVarName(() => this.defaultValues.duration), this.defaultValues.duration);
    }

    get deltaDuration(): number {
        return this.store.get(getVarName(() => this.defaultValues.deltaDuration));
    }

    set deltaDuration(value: number) {
        this.store.set(getVarName(() => this.defaultValues.deltaDuration), value);
    }

    get useMultiWindow(): ToggleStatusWithAuto {
        return this.store.get(getVarName(() => this.defaultValues.useMultiWindow));
    }

    set useMultiWindow(value: ToggleStatusWithAuto) {
        this.store.set(getVarName(() => this.defaultValues.useMultiWindow), value);
    }
}

export const config = new Config();
