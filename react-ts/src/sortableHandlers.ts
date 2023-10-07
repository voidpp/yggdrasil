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

const useLinksCache = () => {
  const client = useApolloClient();

  return {
    readLinksFromCache: (sectionId: number) => {
      const data = client.readQuery<LinksBySectionQuery, LinksBySectionQueryVariables>({
        query: LinksBySectionDocument,
        variables: { sectionId },
      });
      return [...(data?.links ?? [])];
    },
    writeLinksToCache: (links: Link[], sectionId: number) => {
      client.writeQuery<LinksBySectionQuery, LinksBySectionQueryVariables>({
        query: LinksBySectionDocument,
        data: { links },
        variables: { sectionId },
      });
    },
  };
};

export const useSaveLinksRanksHandler = () => {
  const [saveLinksRank] = useSaveLinksRankMutation();
  const [saveLink] = useSaveLinkMutation();
  const client = useApolloClient();
  const { readLinksFromCache, writeLinksToCache } = useLinksCache();

  return async (result: DropResult) => {
    if (!result.destination) return;

    const sourceSectionId = parseInt(result.source.droppableId.split("-")[1]);
    const destinationSectionId = parseInt(result.destination.droppableId.split("-")[1]);

    if (sourceSectionId == destinationSectionId) {
      const links = sortDropItems(readLinksFromCache(sourceSectionId), result);
      writeLinksToCache(links, sourceSectionId);
      await saveLinksRank({ variables: { idList: links.map((link) => link.id) } });
    } else {
      const sourceLinks = readLinksFromCache(sourceSectionId);
      const destinationLinks = readLinksFromCache(destinationSectionId);

      const [sourceLink] = sourceLinks.splice(result.source.index, 1);
      destinationLinks.splice(result.destination.index, 0, sourceLink);

      const updatedSourceLink = { ...sourceLink, sectionId: destinationSectionId };

      writeLinksToCache(sourceLinks, sourceSectionId);
      writeLinksToCache(destinationLinks, destinationSectionId);

      await saveLink({ variables: { link: removeTypename(updatedSourceLink) } });
      await saveLinksRank({ variables: { idList: destinationLinks.map((link) => link.id) } });
    }

    await client.refetchQueries({ include: [LinksBySectionDocument] });
  };
};

export const useDragEndHandler = () => {
  const saveSectionsRanks = useSaveSectionsRanksHandler();
  const saveLinksRanks = useSaveLinksRanksHandler();

  return (result: DropResult) => {
    const type: DropTargetType = result.type as DropTargetType;

    if (type === DropTargetType.SECTION) {
      saveSectionsRanks(result);
    } else if (type === DropTargetType.LINK) {
      saveLinksRanks(result);
    }
  };
};
