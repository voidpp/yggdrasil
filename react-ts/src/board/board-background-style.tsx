import { BoardBackground, BoardBackgroundType } from "../graphql-types-and-hooks.tsx";
import { Helmet } from "react-helmet";
import { BoardBackgroundEarthPornImage } from "./board-background-earth-porn-image.tsx";

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
