import { DropResult } from "react-beautiful-dnd";

export const sortDropItems = <T>(items: T[], dropResult: DropResult): T[] => {
  if (!dropResult.destination) return items;

  const itemsCopy = [...items];

  const [sourceItem] = itemsCopy.splice(dropResult.source.index, 1);
  itemsCopy.splice(dropResult.destination.index, 0, sourceItem);

  return itemsCopy;
};
