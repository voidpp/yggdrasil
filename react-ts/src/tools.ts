import { DropResult } from "react-beautiful-dnd";

export const sortDropItems = <T>(items: T[], dropResult: DropResult): T[] => {
  if (!dropResult.destination) return items;

  const itemsCopy = [...items];

  const [sourceItem] = itemsCopy.splice(dropResult.source.index, 1);
  itemsCopy.splice(dropResult.destination.index, 0, sourceItem);

  return itemsCopy;
};

export const removeTypename = <T extends { __typename?: string }>(object: T): Omit<T, "__typename"> => {
  const cloned = { ...object };
  if (cloned.__typename) delete cloned.__typename;
  return cloned;
};
