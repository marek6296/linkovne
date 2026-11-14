import type { Block, SocialPlatform } from "@/lib/blocks";
import type { Design } from "@/lib/design";

// Fictional personas for the demo portraits; these are not customer profiles.
const PALETTE = { pink: "#ec4899", blue: "#6366f1", black: "#262626" };
type Color = keyof typeof PALETTE;
type Layout = "centered" | "compact" | "hero";
type Entry = [name: string, color: Color, layout: Layout, role: string, bio: string, links: [string, string, string], icon: string, socials: SocialPlatform[], treatment: number];
const ENTRIES: Entry[] = [
  ["Emma Reed", "pink", "centered", "STYLE JOURNAL", "A thoughtful wardrobe. A slower kind of weekend.", ["Shop my capsule wardrobe", "The weekly edit", "Brand enquiries"], "cart", ["instagram", "tiktok", "email"], 0],
  ["Noah Blake", "black", "hero", "PHOTOGRAPHER", "People, places and the moments in between.", ["View selected work", "Print shop", "Book a shoot"], "camera", ["instagram", "website", "email"], 1],
  ["Mia Laurent", "pink", "compact", "BEAUTY & SKIN", "Honest reviews. Everyday rituals. Less, but better.", ["My everyday essentials", "Watch the tutorials", "Work with Mia"], "sparkle", ["instagram", "youtube", "tiktok"], 2],
  ["Luca Hayes", "blue", "compact", "DESIGN STUDIO", "Independent designer building brands with character.", ["Explore my projects", "Download my portfolio", "Start a project"], "link", ["website", "linkedin", "email"], 3],
  ["Ava Chen", "blue", "centered", "ILLUSTRATION", "Playful pictures for thoughtful people.", ["Browse the print collection", "Sketchbook", "Commission a piece"], "star", ["instagram", "website", "email"], 4],
  ["Leo Martin", "black", "centered", "MUSIC & SOUND", "Songs for late nights and long journeys.", ["Listen to the new EP", "Live sessions", "Bookings & press"], "music", ["youtube", "instagram", "email"], 5],
  ["Isla Brooks", "blue", "hero", "POSTCARDS", "Small adventures. Places worth taking your time in.", ["Read the latest travel diary", "City guides", "Travel with me"], "camera", ["instagram", "youtube", "website"], 0],
  ["Oliver King", "black", "compact", "FOUNDER & BUILDER", "Turning useful ideas into products people love.", ["What I’m building", "Notes on business", "Let’s connect"], "link", ["linkedin", "x", "email"], 2],
  ["Chloe Parker", "pink", "hero", "THE CHLOE EDIT", "Outfits, little luxuries and a good coffee.", ["Shop this week’s looks", "My saved places", "Partnerships"], "heart", ["instagram", "tiktok", "email"], 4],
  ["Ethan Cole", "blue", "centered", "MOVEMENT COACH", "Build strength. Move well. Enjoy the process.", ["Find your training plan", "Free warm-up guide", "Personal coaching"], "download", ["youtube", "instagram", "email"], 3],
  ["Zoe Rivera", "pink", "centered", "THE HOME TABLE", "Seasonal recipes made for sharing.", ["Cook something good", "The recipe collection", "My kitchen favourites"], "heart", ["instagram", "youtube", "website"], 1],
  ["James West", "black", "hero", "FILM & MOTION", "Stories told through light, rhythm and movement.", ["Play my showreel", "Selected films", "Hire me for your next story"], "video", ["youtube", "instagram", "email"], 3],
  ["Nina Stone", "black", "compact", "ART DIRECTION", "Visual identities with a clear point of view.", ["Selected campaigns", "About the studio", "Discuss a brief"], "star", ["website", "instagram", "linkedin"], 0],
  ["Theo Quinn", "blue", "compact", "DIGITAL CRAFT", "Websites that feel as good as they work.", ["See what I’ve shipped", "Tools & resources", "Book an intro call"], "link", ["website", "x", "linkedin"], 5],
  ["Ella Scott", "pink", "centered", "PILATES & BALANCE", "A little movement. A little space for yourself.", ["Join an online class", "Weekly timetable", "Private sessions"], "calendar", ["instagram", "youtube", "email"], 4],
  ["Max Bennett", "black", "centered", "AFTER DARK", "DJ sets, new sounds and nights to remember.", ["Play the latest mix", "Upcoming dates", "Booking enquiries"], "music", ["instagram", "youtube", "email"], 2],
  ["Ruby Lane", "pink", "compact", "WORDS & STORIES", "Writing about culture, creativity and ordinary life.", ["Read the latest essay", "The reading list", "Editorial enquiries"], "link", ["website", "instagram", "email"], 5],
  ["Finn Woods", "blue", "hero", "OUTSIDE HOURS", "Trails, wild places and the long way home.", ["Explore the trail journal", "My gear list", "Adventure films"], "camera", ["youtube", "instagram", "website"], 1],
  ["Lily Hart", "pink", "compact", "MADE BY LILY", "Small-batch objects, made slowly and with care.", ["Shop the latest collection", "Inside the workshop", "Custom orders"], "cart", ["instagram", "website", "email"], 3],
  ["Alex Moore", "black", "compact", "STRATEGY & GROWTH", "Clear thinking for ambitious independent businesses.", ["Ways to work together", "Practical business notes", "Schedule a conversation"], "calendar", ["linkedin", "website", "email"], 4],
  ["Clara Evans", "blue", "centered", "CREATIVE LEARNING", "Making room for curiosity, one project at a time.", ["Explore the workshops", "Free creative prompts", "Join the next session"], "star", ["youtube", "instagram", "website"], 2],
  ["Sam Foster", "black", "hero", "PORTRAITS & PEOPLE", "Natural portraits. Real connection. Your story.", ["View the portrait series", "Session information", "Reserve your shoot"], "camera", ["instagram", "website", "email"], 5],
  ["Amelia Ross", "pink", "hero", "SPACES TO LIVE IN", "Warm interiors and details that make a home.", ["Explore recent spaces", "The sourcebook", "Interior consultations"], "heart", ["instagram", "website", "email"], 0],
  ["Oscar Miles", "blue", "compact", "THE CONVERSATION", "Good questions. Interesting people. Fresh perspectives.", ["Listen to the latest episode", "Browse the archive", "Suggest a guest"], "music", ["youtube", "x", "email"], 1],
  ["Sofia Lane", "pink", "centered", "SOFIA’S WORLD", "Personal style and places worth saving.", ["The summer wardrobe", "Postcards from the coast", "Collaborations & enquiries"], "sparkle", ["instagram", "tiktok", "email"], 2],
];

export type DemoProfile = {
  id: string; name: string; src: string; look: number;
  role: string; bio: string; design: Design; blocks: Block[];
};
export const DEMO_PROFILES: DemoProfile[] = ENTRIES.map(([name, color, layout, role, bio, links, icon, socials, treatment], i) => {
  const dark = color !== "pink";
  const grid = [1, 3, 4].includes(treatment);
  const design: Design = {
    bg: "solid", bgColor: PALETTE[color], textColor: dark ? "#ffffff" : "#191813",
    font: "sans", fontHeading: treatment === 0 || treatment === 5 ? "serif" : treatment === 4 ? "grotesk" : "sans",
    btnBg: "#ffffff", btnText: "#191813", btnStyle: "fill",
    btnShape: ["soft", "rounded", "pill", "square", "rounded", "soft"][treatment] as Design["btnShape"],
    btnShadow: treatment === 4 ? "hard" : treatment === 0 ? "subtle" : "none",
    btnBorder: "none", btnWeight: "medium", btnSpacing: "compact",
    avatarShape: layout === "centered" ? "circle" : "rounded", avatarSize: "md",
    avatarFrame: "none", profileLayout: layout,
  };
  const linkBlocks: Block[] = links.map((title, index) => ({
    id: `demo-${i}-link-${index}`, type: "link", position: index + 1, is_active: true,
    config: {
      title, url: "#", icon: index === 0 ? icon : undefined,
      width: grid && index > 0 ? "half" : "full",
      // One clear primary action, with quieter secondary links.
      ...(treatment === 2 && index > 0 ? { buttonStyle: "outline" as const, color: dark ? "#ffffff" : "#191813", textColor: dark ? "#ffffff" : "#191813", buttonBorder: "thin" as const } : {}),
    },
  }));
  const socialBlock: Block = { id: `demo-${i}-socials`, type: "socials", position: 0, is_active: true,
    config: { socialSize: "sm", socialShape: treatment === 3 ? "rounded" : "bare", socialStyle: "line", items: socials.map(platform => ({ platform, url: "#" })) } };
  return {
    id: i === 24 ? "sofia" : `person-${i}`, name,
    src: i === 24 ? "/sofia-lane.png" : `/demo-portraits/person-${i}.jpg`,
    look: color === "pink" ? 0 : color === "blue" ? 1 : 2,
    role, bio, design,
    blocks: (treatment === 1 || treatment === 5 ? [...linkBlocks, socialBlock] : [socialBlock, ...linkBlocks]).map((block, position) => ({ ...block, position })),
  };
});
