import { Link, LinkInput } from "../graphql-types-and-hooks.tsx";
import { createContext, useContext } from "react";
import { LinkNode } from "../types.ts";

export type LinkListDroppableId = {
  sectionId: number;
  groupId: number | null;
};

export const parseLinkListId = (id: string) => JSON.parse(id) as LinkListDroppableId;

export const createLinkListId = (params: LinkListDroppableId) => JSON.stringify(params);

export const cleanLinkDataForSave = (link: LinkInput) => {
  if (link.favicon == "") link.favicon = null;
  if (link.url == "") link.url = null;
};

type LinksSectionContextValue = {
  linkList: Link[];
  linkTree: LinkNode[];
  refetchLinks: () => Promise<unknown>;
};

export const LinksSectionContext = createContext<LinksSectionContextValue>({
  linkList: [],
  linkTree: [],
  refetchLinks: async () => {},
});

export const useLinksSectionContext = () => useContext(LinksSectionContext);
