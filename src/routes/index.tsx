import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";

import { HomeMenu } from "@/components/storyline/HomeMenu";
import { Opening } from "@/components/storyline/Opening";
import { StoryIntro } from "@/components/storyline/StoryIntro";
import { TheCallGame } from "@/components/storyline/TheCallGame";
import type { SaveSlot } from "@/lib/game/saves";
import {
  incrementPlayCount,
  type NarrativeMode,
  type StoryModule,
} from "@/lib/storyline/stories";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "MY STORYLINE — Histoires interactives" },
      {
        name: "description",
        content:
          "MY STORYLINE — Plongez dans des histoires interactives en temps réel. Thriller, survie, drame. Vos choix changent tout.",
      },
      { property: "og:title", content: "MY STORYLINE — Histoires interactives" },
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
  | {
      kind: "playing";
      story: StoryModule;
      mode: NarrativeMode;
      save?: SaveSlot | null;
    };

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
        onResume={(save) => {
          setStage({
            kind: "playing",
            story: stage.story,
            mode: save.mode,
            save,
          });
        }}
      />
    );
  }

  if (stage.story.id === "thecall") {
    return (
      <TheCallGame
        mode={stage.mode}
        storyId={stage.story.id}
        initialSave={stage.save ?? null}
        onExit={() => setStage({ kind: "home" })}
        onBackToIntro={() => setStage({ kind: "intro", story: stage.story })}
      />
    );
  }

  return null;
}
