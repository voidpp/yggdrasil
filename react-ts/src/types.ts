import { Link } from "./graphql-types-and-hooks.tsx";

export type LinkNode = {
  children: LinkNode[];
} & Link;
