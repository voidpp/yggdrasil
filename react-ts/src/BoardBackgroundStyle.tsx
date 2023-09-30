import { BoardBackground, BoardBackgroundType, useEarthPornImagesQuery } from "./graphql-types-and-hooks.tsx";
import { useMemo } from "react";
import { Box, Link, SxProps, Theme } from "@mui/material";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import { Helmet } from "react-helmet";

const styles = {
  backgroundTitle: {
    position: "fixed",
    left: 0,
    bottom: 0,
    px: 1,
    py: 0.5,
    backdropFilter: "blur(4px)",
    textShadow: "1px 1px 2px black",
    borderTopRightRadius: 4,
    backgroundColor: "rgba(0,0,0,0.4)",
    display: "flex",
    alignItems: "center",
    gap: 1,
  },
  imageLink: {
    lineHeight: 0,
    "&:hover": {
      color: (theme) => theme.palette.primary.dark,
    },
  },
} satisfies Record<string, SxProps<Theme>>;

export const BoardBackgroundEarthPornImage = () => {
  const { data: earthPornImagesData } = useEarthPornImagesQuery();

  const image = useMemo(() => {
    if (!earthPornImagesData?.earthPornImages) return null;

    const images = earthPornImagesData?.earthPornImages;
    const randomImageIndex = Math.floor(Math.random() * images.length);
    return images[randomImageIndex];
  }, [earthPornImagesData?.earthPornImages]);

  if (image === null) return null;

  return (
    <Box sx={styles.backgroundTitle}>
      {image.title}
      <Link href={image.url} target="_blank" sx={styles.imageLink}>
        <OpenInNewIcon fontSize="small" />
      </Link>
      <Helmet>
        <style>{`body { background-image: url('${image.url}'); }`}</style>
      </Helmet>
    </Box>
  );
};

export const BoardBackgroundColor = ({ color }: { color: string }) => {
  return (
    <Helmet>
      <style>{`body { background-color: ${color} }`}</style>
    </Helmet>
  );
};

export const BoardBackgroundImage = ({ url }: { url: string }) => {
  return (
    <Helmet>
      <style>{`body { background-image: url('${url}'); }`}</style>
    </Helmet>
  );
};

export const BoardBackgroundStyle = ({ settings }: { settings: BoardBackground }) => {
  switch (settings.type) {
    case BoardBackgroundType.Color:
      return <BoardBackgroundColor color={settings.value} />;

    case BoardBackgroundType.Earthporn:
      return <BoardBackgroundEarthPornImage />;

    case BoardBackgroundType.Image:
      return <BoardBackgroundImage url={settings.value} />;
  }
};
