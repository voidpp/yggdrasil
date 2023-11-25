import { DropResult } from "react-beautiful-dnd";
import { useEffect, useRef } from "react";

export type PartialBy<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

export const sortDropItems = <T>(items: T[], dropResult: DropResult): T[] => {
  if (!dropResult.destination) return items;

  const [sourceItem] = items.splice(dropResult.source.index, 1);
  items.splice(dropResult.destination.index, 0, sourceItem);

  return items;
};

export const removeTypename = <T extends { __typename?: string }>(object: T): Omit<T, "__typename"> => {
  const cloned = { ...object };
  if (cloned.__typename) delete cloned.__typename;
  return cloned;
};

export enum DropTargetType {
  SECTION = "section",
  LINK = "link",
  LINK_GROUP = "link_group",
}

export function useInterval(callback: () => void, delay: number, enabled: boolean = true) {
  const savedCallback = useRef<() => void>();

  useEffect(() => {
    savedCallback.current = callback;
  });

  useEffect(() => {
    function tick() {
      if (enabled) savedCallback.current?.();
    }

    const id = setInterval(tick, delay);
    return () => clearInterval(id);
  }, [delay, enabled]);
}
