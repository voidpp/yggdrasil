export type LocalStorageValue<T> = {
  value: T;
  setValue: (value: T) => void;
};

export type LocalStorageSchema = {
  editMode: LocalStorageValue<boolean>;
};

function fetchItem(name: string, default_?: unknown) {
  const res = window.localStorage.getItem(name);
  return res === null ? default_ : JSON.parse(res);
}

const handler = {
  get: (target: Record<string, unknown>, name: string) => {
    return {
      get value() {
        return fetchItem(name, target[name]);
      },
      setValue: (value: unknown) => {
        if (fetchItem(name) == value) return;
        window.localStorage.setItem(name, JSON.stringify(value));
      },
    } as LocalStorageValue<unknown>;
  },
};

export const localStorage = new Proxy<LocalStorageSchema>({} as LocalStorageSchema, handler);
