/**
 * dialogueData.ts
 * Exact script implementation of Klint and Cyril's courtship confession.
 * Contains full branching for Choice 1 (Yes -> Choice A, B, C)
 * and Choice 2 (I'm not ready -> Choice A, B, C) matching user script verbatim.
 */

import { RelationshipStage, MemoryJournal } from "./RelationshipSystem";

export type CharacterEmotion =
  | "neutral"
  | "smiling"
  | "blushing"
  | "thinking"
  | "surprised"
  | "happy";

export interface DialogueOption {
  text: string;
  nextNodeId: string;
  affectionDelta?: number;
  trustDelta?: number;
  rememberKey?: "favoriteDrink" | "hobby" | "favoriteSeason" | "dream" | "favoriteSpot";
  rememberValue?: string;
  condition?: (affection: number, trust: number, memory: MemoryJournal) => boolean;
}

export interface DialogueNode {
  id: string;
  speaker: string;
  emotion: CharacterEmotion;
  text: string | ((memory: MemoryJournal, stage: RelationshipStage) => string);
  options?: DialogueOption[];
  onEnter?: () => void;
  triggerActivityId?: string;
  isEnd?: boolean;
}

export const DIALOGUE_NODES: Record<string, DialogueNode> = {
  // ================================================================
  // PREAMBLE: THE CONFESSION
  // ================================================================
  intro_root: {
    id: "intro_root",
    speaker: "Klint",
    emotion: "thinking",
    text: "Hey, Cyril. Can I tell you something?",
    options: [
      {
        text: `✦ "Of course, Klint. What's on your mind?"`,
        nextNodeId: "preamble_2",
      },
    ],
  },

  preamble_2: {
    id: "preamble_2",
    speaker: "Klint",
    emotion: "blushing",
    text: "I've been wanting to tell you this for a while, but I didn't know how to say it.",
    options: [
      {
        text: `✦ "You can tell me anything. I'm listening."`,
        nextNodeId: "preamble_3",
      },
    ],
  },

  preamble_3: {
    id: "preamble_3",
    speaker: "Klint",
    emotion: "blushing",
    text: "The truth is, I like you, Cyril. And I don't want to keep these feelings to myself anymore. I want to get to know you better, not just as a friend. So, I wanted to ask you... would you let me court you?",
    options: [
      {
        text: `✦ (Looks surprised and stays quiet for a moment) "Wow, Klint. I wasn't expecting that. Can I be honest with you?"`,
        nextNodeId: "preamble_4",
      },
    ],
  },

  preamble_4: {
    id: "preamble_4",
    speaker: "Klint",
    emotion: "smiling",
    text: "Of course. Whatever your answer is, I'll respect it.",
    options: [
      {
        text: `✦ Choice 1: Cyril says yes`,
        nextNodeId: "branch_yes_menu",
        affectionDelta: 10,
        trustDelta: 5,
      },
      {
        text: `✦ Choice 2: Cyril says, "I'm not ready."`,
        nextNodeId: "branch_not_ready_menu",
        affectionDelta: 2,
        trustDelta: 8,
      },
    ],
  },

  // ================================================================
  // CHOICE 1: CYRIL SAYS YES
  // ================================================================
  branch_yes_menu: {
    id: "branch_yes_menu",
    speaker: "Klint",
    emotion: "happy",
    text: "I'm really glad you're open to this, Cyril. What's on your mind?",
    options: [
      {
        text: `✦ Choice A: "Yes, Klint. I'd like to give you a chance. But I hope we can take things slowly and get to know each other better."`,
        nextNodeId: "yes_a_1",
        affectionDelta: 12,
        trustDelta: 10,
      },
      {
        text: `✦ Choice B: "Honestly, I'm a little surprised. But you've caught my attention, and I'd like to see where this goes."`,
        nextNodeId: "yes_b_1",
        affectionDelta: 12,
        trustDelta: 8,
      },
      {
        text: `✦ Choice C: "You know what? Yes. I'd like to get to know you more, too. Let's give this a chance."`,
        nextNodeId: "yes_c_1",
        affectionDelta: 15,
        trustDelta: 10,
      },
    ],
  },

  // --- IF CYRIL CHOOSES A ---
  yes_a_1: {
    id: "yes_a_1",
    speaker: "Klint",
    emotion: "happy",
    text: "Really? You have no idea how happy that makes me. I promise I won't rush you. I just want to show you how sincere I am about my feelings.",
    options: [
      {
        text: `✦ "Thank you, Klint. I appreciate that. I want us to be comfortable with each other."`,
        nextNodeId: "yes_a_2",
      },
    ],
  },

  yes_a_2: {
    id: "yes_a_2",
    speaker: "Klint",
    emotion: "smiling",
    text: "That's all I'm asking for. Can I walk you home sometime?",
    options: [
      {
        text: `✦ (Smiles) "Maybe. Let's start with a walk around the park first."`,
        nextNodeId: "yes_a_3",
      },
    ],
  },

  yes_a_3: {
    id: "yes_a_3",
    speaker: "Klint",
    emotion: "happy",
    text: "I'd love that. Spending time with you is already something I look forward to.",
    isEnd: true,
    options: [
      {
        text: `✦ [Finish] Let's take a walk around the park. 🌸`,
        nextNodeId: "end",
      },
    ],
  },

  // --- IF CYRIL CHOOSES B ---
  yes_b_1: {
    id: "yes_b_1",
    speaker: "Klint",
    emotion: "happy",
    text: "That's more than enough for me. I don't expect you to have everything figured out right now. I just want the opportunity to show you who I am.",
    options: [
      {
        text: `✦ "Then I guess you'll have to prove that you're as sincere as you say you are."`,
        nextNodeId: "yes_b_2",
      },
    ],
  },

  yes_b_2: {
    id: "yes_b_2",
    speaker: "Klint",
    emotion: "smiling",
    text: "Challenge accepted. So, would you like to grab something at the café with me?",
    options: [
      {
        text: `✦ (Laughs softly) "Sure. But you're not getting away with choosing the cheapest drink on the menu!"`,
        nextNodeId: "yes_b_3",
      },
    ],
  },

  yes_b_3: {
    id: "yes_b_3",
    speaker: "Klint",
    emotion: "happy",
    text: "Hey, I was going to let you choose first!",
    isEnd: true,
    options: [
      {
        text: `✦ [Finish] Deal! Let's head to the café. ☕`,
        nextNodeId: "end",
      },
    ],
  },

  // --- IF CYRIL CHOOSES C ---
  yes_c_1: {
    id: "yes_c_1",
    speaker: "Klint",
    emotion: "surprised",
    text: "Wait, really? I was preparing myself for every possible answer, and I almost forgot how to breathe.",
    options: [
      {
        text: `✦ (Laughs) "You're cute when you're nervous, you know that?"`,
        nextNodeId: "yes_c_2",
      },
    ],
  },

  yes_c_2: {
    id: "yes_c_2",
    speaker: "Klint",
    emotion: "blushing",
    text: "Don't say things like that. You're going to make me fall even harder.",
    options: [
      {
        text: `✦ "Then maybe I should be careful what I say around you."`,
        nextNodeId: "yes_c_3",
      },
    ],
  },

  yes_c_3: {
    id: "yes_c_3",
    speaker: "Klint",
    emotion: "smiling",
    text: "Too late. So, when can I see you again?",
    options: [
      {
        text: `✦ "How about tomorrow? There's something I'd like to show you near the lake."`,
        nextNodeId: "yes_c_4",
      },
    ],
  },

  yes_c_4: {
    id: "yes_c_4",
    speaker: "Klint",
    emotion: "happy",
    text: "I can't wait. Seeing you tomorrow by the lake will be the best part of my day.",
    isEnd: true,
    options: [
      {
        text: `✦ [Finish] See you tomorrow by the lake! 🌿`,
        nextNodeId: "end",
      },
    ],
  },

  // ================================================================
  // CHOICE 2: CYRIL SAYS, "I'M NOT READY."
  // ================================================================
  branch_not_ready_menu: {
    id: "branch_not_ready_menu",
    speaker: "Klint",
    emotion: "smiling",
    text: "I appreciate you being honest with me, Cyril. What's on your mind?",
    options: [
      {
        text: `✦ Choice A: "Klint, I'm really touched that you told me how you feel. But honestly, I'm not ready for courtship right now. I hope you understand."`,
        nextNodeId: "no_a_1",
        affectionDelta: 5,
        trustDelta: 10,
      },
      {
        text: `✦ Choice B: "I appreciate your feelings, Klint, but I'm still figuring out what I want. I don't want to give you an answer I'm not sure about."`,
        nextNodeId: "no_b_1",
        affectionDelta: 5,
        trustDelta: 10,
      },
      {
        text: `✦ Choice C: "You're important to me, Klint, but I only see you as a friend right now. I'm sorry if that hurts."`,
        nextNodeId: "no_c_1",
        affectionDelta: 3,
        trustDelta: 10,
      },
    ],
  },

  // --- IF CYRIL CHOOSES A ---
  no_a_1: {
    id: "no_a_1",
    speaker: "Klint",
    emotion: "smiling",
    text: "I understand, Cyril. Thank you for being honest with me.",
    options: [
      {
        text: `✦ "I don't want to give you false hope or make promises I'm not ready to keep."`,
        nextNodeId: "no_a_2",
      },
    ],
  },

  no_a_2: {
    id: "no_a_2",
    speaker: "Klint",
    emotion: "smiling",
    text: "And I don't want you to feel pressured. I told you how I feel because I wanted to be honest with you, not because I expect you to feel the same way.",
    options: [
      {
        text: `✦ "Thank you for understanding. I hope this doesn't make things awkward between us."`,
        nextNodeId: "no_a_3",
      },
    ],
  },

  no_a_3: {
    id: "no_a_3",
    speaker: "Klint",
    emotion: "smiling",
    text: "It might take me a little time to get over my nervousness, but I still value you as a person. We can keep getting to know each other, if you're comfortable with that.",
    options: [
      {
        text: `✦ "I'd like that. Thank you, Klint."`,
        nextNodeId: "no_a_4",
      },
    ],
  },

  no_a_4: {
    id: "no_a_4",
    speaker: "Klint",
    emotion: "smiling",
    text: "Anytime, Cyril. Enjoy your walk in the park today.",
    isEnd: true,
    options: [
      {
        text: `✦ [Finish] Thanks, Klint. Have a nice walk.`,
        nextNodeId: "end",
      },
    ],
  },

  // --- IF CYRIL CHOOSES B ---
  no_b_1: {
    id: "no_b_1",
    speaker: "Klint",
    emotion: "smiling",
    text: "That's okay. I know feelings aren't something you can decide overnight.",
    options: [
      {
        text: `✦ "I'm afraid of making the wrong decision and hurting you later."`,
        nextNodeId: "no_b_2",
      },
    ],
  },

  no_b_2: {
    id: "no_b_2",
    speaker: "Klint",
    emotion: "smiling",
    text: "I'd rather have an honest answer than one you don't really mean. Take your time. You don't owe me a decision just because I confessed.",
    options: [
      {
        text: `✦ "You make it sound so easy to be honest with you."`,
        nextNodeId: "no_b_3",
      },
    ],
  },

  no_b_3: {
    id: "no_b_3",
    speaker: "Klint",
    emotion: "smiling",
    text: "Maybe because I want you to feel safe telling me the truth, even when it's not what I hoped to hear.",
    options: [
      {
        text: `✦ "Thank you, Klint. I think I need time, but I don't want to stop getting to know you."`,
        nextNodeId: "no_b_4",
      },
    ],
  },

  no_b_4: {
    id: "no_b_4",
    speaker: "Klint",
    emotion: "smiling",
    text: "Then let's take it one day at a time.",
    isEnd: true,
    options: [
      {
        text: `✦ [Finish] One day at a time.`,
        nextNodeId: "end",
      },
    ],
  },

  // --- IF CYRIL CHOOSES C ---
  no_c_1: {
    id: "no_c_1",
    speaker: "Klint",
    emotion: "thinking",
    text: "(Looks disappointed for a moment but manages a gentle smile) Thank you for telling me honestly, Cyril.",
    options: [
      {
        text: `✦ "I'm sorry, Klint. I never wanted to hurt you."`,
        nextNodeId: "no_c_2",
      },
    ],
  },

  no_c_2: {
    id: "no_c_2",
    speaker: "Klint",
    emotion: "smiling",
    text: "You don't have to apologize for how you feel. I can't ask you to return feelings you don't have.",
    options: [
      {
        text: `✦ "Are you sure we'll still be okay after this?"`,
        nextNodeId: "no_c_3",
      },
    ],
  },

  no_c_3: {
    id: "no_c_3",
    speaker: "Klint",
    emotion: "smiling",
    text: "I might need a little time to sort out my feelings, but I don't regret being honest with you.",
    options: [
      {
        text: `✦ "I really appreciate that. I hope you find someone who makes you as happy as you deserve to be."`,
        nextNodeId: "no_c_4",
      },
    ],
  },

  no_c_4: {
    id: "no_c_4",
    speaker: "Klint",
    emotion: "smiling",
    text: "Thank you, Cyril. For now, I'm just glad we can be honest with each other.",
    isEnd: true,
    options: [
      {
        text: `✦ [Finish] Take care, Klint.`,
        nextNodeId: "end",
      },
    ],
  },

  // ================================================================
  // NEXT SCENE: SPENDING TIME TOGETHER & DATE ACTIVITIES
  // ================================================================
  hub_main: {
    id: "hub_main",
    speaker: "Klint",
    emotion: "smiling",
    text: (_memory, stage) => {
      if (stage === "Romantic Interest" || stage === "Close Connection") {
        return "Hey Cyril! Always great to see you. What's on your mind?";
      }
      return "Hey Cyril! How are you enjoying the park?";
    },
    options: [
      {
        text: "✦ Want to grab a drink at Café Sakura? ☕",
        nextNodeId: "cafe_date_quick",
        condition: (aff) => aff >= 20,
      },
      {
        text: "✦ Want to walk along the lake boardwalk? 🌿",
        nextNodeId: "lake_date_quick",
        condition: (aff) => aff >= 40,
      },
      {
        text: "✦ Want to sit on the hilltop bench? 📖",
        nextNodeId: "bench_date_quick",
        condition: (aff) => aff >= 60,
      },
      {
        text: "✦ Meet me at the pier gazebo at sunset... 🌅",
        nextNodeId: "pier_date_quick",
        condition: (aff) => aff >= 80,
      },
      {
        text: "✦ Just wanted to say hi!",
        nextNodeId: "hi_quick",
        affectionDelta: 2,
      },
      {
        text: "✦ See you in a bit, Klint.",
        nextNodeId: "farewell_quick",
      },
    ],
  },

  // CAFÉ DATE
  cafe_date_quick: {
    id: "cafe_date_quick",
    speaker: "Klint",
    emotion: "happy",
    text: "Sure! Let's head over to the terrace for some coffee.",
    triggerActivityId: "cafe_date",
    options: [
      {
        text: "✦ [Café Terrace] Cheers! ☕",
        nextNodeId: "cafe_finish",
        affectionDelta: 8,
        trustDelta: 8,
      },
    ],
  },

  cafe_finish: {
    id: "cafe_finish",
    speaker: "Klint",
    emotion: "smiling",
    text: "That was really nice. Thanks for having coffee with me, Cyril!",
    isEnd: true,
    options: [
      {
        text: "✦ [Finish] Let's keep exploring! 🌸",
        nextNodeId: "end",
      },
    ],
  },

  // LAKE DATE
  lake_date_quick: {
    id: "lake_date_quick",
    speaker: "Klint",
    emotion: "smiling",
    text: "Sounds peaceful. The boardwalk by the water is really nice right now.",
    triggerActivityId: "lakeside_walk",
    options: [
      {
        text: "✦ [Mirror Lake] The water looks so clear. 🌿",
        nextNodeId: "lake_finish",
        affectionDelta: 8,
        trustDelta: 8,
      },
    ],
  },

  lake_finish: {
    id: "lake_finish",
    speaker: "Klint",
    emotion: "smiling",
    text: "It really is. Taking a stroll with you always clears my mind, Cyril.",
    isEnd: true,
    options: [
      {
        text: "✦ [Finish] Me too! Talk soon.",
        nextNodeId: "end",
      },
    ],
  },

  // HILLTOP BENCH DATE
  bench_date_quick: {
    id: "bench_date_quick",
    speaker: "Klint",
    emotion: "smiling",
    text: "The hilltop bench? Sure, it's nice and quiet up there.",
    triggerActivityId: "bench_heart_to_heart",
    options: [
      {
        text: "✦ [Hilltop View] You can see the whole park from here. 🌸",
        nextNodeId: "bench_finish",
        affectionDelta: 10,
        trustDelta: 10,
      },
    ],
  },

  bench_finish: {
    id: "bench_finish",
    speaker: "Klint",
    emotion: "blushing",
    text: "I'm really glad we came up here together, Cyril. This is special to me.",
    isEnd: true,
    options: [
      {
        text: "✦ [Finish] To me too, Klint.",
        nextNodeId: "end",
      },
    ],
  },

  // SUNSET PIER CONFESSION
  pier_date_quick: {
    id: "pier_date_quick",
    speaker: "Klint",
    emotion: "blushing",
    text: "The pier gazebo at sunset? Yes... there's something I've been waiting to ask you, Cyril.",
    triggerActivityId: "pier_sunset_confession",
    options: [
      {
        text: "✦ [Sunset Pier] What is it, Klint? 🌅",
        nextNodeId: "pier_confession",
        affectionDelta: 12,
        trustDelta: 12,
      },
    ],
  },

  pier_confession: {
    id: "pier_confession",
    speaker: "Klint",
    emotion: "happy",
    text: "Cyril, spending time with you has been the best part of every day. Will you be my girlfriend?",
    options: [
      {
        text: "✦ Yes, Klint! (Embrace him 💕)",
        nextNodeId: "pier_finish",
        affectionDelta: 15,
        trustDelta: 15,
      },
    ],
  },

  pier_finish: {
    id: "pier_finish",
    speaker: "Klint",
    emotion: "happy",
    text: "(Klint smiles brightly and hugs Cyril warmly) Thank you, Cyril! I promise to make you happy every day.",
    isEnd: true,
    options: [
      {
        text: "✦ [Romance Achieved] 🌸💖",
        nextNodeId: "end",
      },
    ],
  },

  // QUICK GREETINGS & FAREWELL
  hi_quick: {
    id: "hi_quick",
    speaker: "Klint",
    emotion: "smiling",
    text: "Always happy to see you, Cyril! Have fun exploring the park.",
    isEnd: true,
    options: [
      {
        text: "✦ [Finish] Thanks, Klint!",
        nextNodeId: "end",
      },
    ],
  },

  farewell_quick: {
    id: "farewell_quick",
    speaker: "Klint",
    emotion: "smiling",
    text: "Take care, Cyril! Catch you later.",
    isEnd: true,
    options: [
      {
        text: "✦ [Finish] See ya!",
        nextNodeId: "end",
      },
    ],
  },
};
