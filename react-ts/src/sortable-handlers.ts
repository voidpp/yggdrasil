import {
  Link,
  LinksBySectionDocument,
  LinksBySectionQuery,
  LinksBySectionQueryVariables,
  SectionsDocument,
  SectionsQuery,
  useSaveLinkMutation,
  useSaveLinksRankMutation,
  useSaveSectionsRankMutation,
} from "./graphql-types-and-hooks.tsx";
import { useApolloClient } from "@apollo/client";
import { DropResult } from "react-beautiful-dnd";
import { DropTargetType, removeTypename, sortDropItems } from "./tools.ts";
import { cleanLinkDataForSave, parseLinkListId } from "./links/link-tools.ts";

export const useSaveSectionsRanksHandler = () => {
  const [saveSectionRank] = useSaveSectionsRankMutation();
  const client = useApolloClient();

  return async (result: DropResult) => {
    if (!result.destination) return;

    const data = client.readQuery<SectionsQuery>({ query: SectionsDocument });
    const sections = data?.sections ?? [];
    if (sections.length === 0) return;

    const sectionsCopy = sortDropItems([...sections], result);

    client.writeQuery<SectionsQuery>({
      query: SectionsDocument,
      data: { sections: sectionsCopy },
    });
    await saveSectionRank({ variables: { idList: sectionsCopy.map((section) => section.id) } });
    await client.refetchQueries({ include: [SectionsDocument] });
  };
};

export const useLinksCache = () => {
  const client = useApolloClient();

  return {
    readLinksFromCache: (sectionId: number, groupId: Link["linkGroupId"] = null) => {
      const data = client.readQuery<LinksBySectionQuery, LinksBySectionQueryVariables>({
        query: LinksBySectionDocument,
        variables: { sectionId },
      });
      return [...(data?.links.filter((link) => link.linkGroupId == groupId) ?? [])];
    },
    writeLinksToCache: (links: Link[], sectionId: number) => {
      client.writeQuery<LinksBySectionQuery, LinksBySectionQueryVariables>({
        query: LinksBySectionDocument,
        data: { links },
        variables: { sectionId },
      });
    },
    refetchLinks: async () => {
      await client.refetchQueries({ include: [LinksBySectionDocument] });
    },
  };
};

export const useSaveLinksRanksHandler = () => {
  const [saveLinksRank] = useSaveLinksRankMutation();
  const [saveLink] = useSaveLinkMutation();
  const { readLinksFromCache, writeLinksToCache, refetchLinks } = useLinksCache();

  return async (result: DropResult) => {
    if (!result.destination) return;

    const { sectionId: sourceSectionId, groupId } = parseLinkListId(result.source.droppableId);
    const { sectionId: destinationSectionId } = parseLinkListId(result.destination.droppableId);

    if (sourceSectionId == destinationSectionId) {
      const links = sortDropItems(readLinksFromCache(sourceSectionId, groupId), result);
      const topLevelLinks = [];
      if (groupId) topLevelLinks.push(...readLinksFromCache(sourceSectionId));

      writeLinksToCache([...links, ...topLevelLinks], sourceSectionId);
      await saveLinksRank({ variables: { idList: links.map((link) => link.id) } });
    } else {
      const sourceLinks = readLinksFromCache(sourceSectionId);
      const destinationLinks = readLinksFromCache(destinationSectionId);

      const [sourceLink] = sourceLinks.splice(result.source.index, 1);
      destinationLinks.splice(result.destination.index, 0, sourceLink);

      const updatedSourceLink = { ...sourceLink, sectionId: destinationSectionId };
      cleanLinkDataForSave(updatedSourceLink);

      writeLinksToCache(sourceLinks, sourceSectionId);
      writeLinksToCache(destinationLinks, destinationSectionId);

      await saveLink({ variables: { link: removeTypename(updatedSourceLink) } });
      await saveLinksRank({ variables: { idList: destinationLinks.map((link) => link.id) } });
    }

    await refetchLinks();
  };
};

export const useDragEndHandler = () => {
  const saveSectionsRanks = useSaveSectionsRanksHandler();
  const saveLinksRanks = useSaveLinksRanksHandler();

  return (result: DropResult) => {
    const type: DropTargetType = result.type as DropTargetType;

    if (type === DropTargetType.SECTION) {
      saveSectionsRanks(result);
    } else if ([DropTargetType.LINK, DropTargetType.LINK_GROUP].includes(type)) {
      saveLinksRanks(result);
    }
  };
};
