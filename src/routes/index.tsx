import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";

import { HomeMenu } from "@/components/storyline/HomeMenu";
import { Opening } from "@/components/storyline/Opening";
import { StoryIntro } from "@/components/storyline/StoryIntro";
import { TheCallGame } from "@/components/storyline/TheCallGame";
import {
  incrementPlayCount,
  type NarrativeMode,
  type StoryModule,
} from "@/lib/storyline/stories";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "STORYLINE — Plateforme de jeux narratifs interactifs" },
      {
        name: "description",
        content:
          "STORYLINE — Plongez dans des histoires interactives en temps réel. Thriller, survie, drame. Vos choix changent tout.",
      },
      { property: "og:title", content: "STORYLINE — Jeux narratifs interactifs" },
      {
        property: "og:description",
        content: "Une plateforme d'histoires immersives. Première histoire : THE CALL.",
      },
    ],
  }),
  component: StorylineApp,
});

type Stage =
  | { kind: "opening" }
  | { kind: "home" }
  | { kind: "intro"; story: StoryModule }
  | { kind: "playing"; story: StoryModule; mode: NarrativeMode };

function StorylineApp() {
  const [stage, setStage] = useState<Stage>({ kind: "opening" });

  if (stage.kind === "opening") {
    return <Opening onDone={() => setStage({ kind: "home" })} />;
  }

  if (stage.kind === "home") {
    return <HomeMenu onSelect={(story) => setStage({ kind: "intro", story })} />;
  }

  if (stage.kind === "intro") {
    return (
      <StoryIntro
        story={stage.story}
        onBack={() => setStage({ kind: "home" })}
        onStart={(mode) => {
          if (stage.story.status !== "active") return;
          incrementPlayCount(stage.story.id);
          setStage({ kind: "playing", story: stage.story, mode });
        }}
      />
    );
  }

  if (stage.story.id === "thecall") {
    return (
      <TheCallGame
        mode={stage.mode}
        onExit={() => setStage({ kind: "home" })}
      />
    );
  }

  return null;
}
