import ElectronStore from 'electron-store';
import { getVarName } from '../common/util';

export const toggleStatusWithAuto = ['auto', 'enabled', 'disabled'] as const;
type ToggleStatusWithAuto = typeof toggleStatusWithAuto[number];


interface ConfigSchema {
    useMultiWindow: ToggleStatusWithAuto;
}

class Config {
    private store: ElectronStore<ConfigSchema>;
    private defaultValues: ConfigSchema = {
        useMultiWindow: 'auto'
    };

    constructor() {
        this.store = new ElectronStore<ConfigSchema>({ defaults: this.defaultValues });
    }

    get useMultiWindow(): ToggleStatusWithAuto {
        return this.store.get(getVarName(() => this.defaultValues.useMultiWindow));
    }

    set useMultiWindow(value: ToggleStatusWithAuto) {
        this.store.set(getVarName(() => this.defaultValues.useMultiWindow), value);
    }
}

export const config = new Config();
