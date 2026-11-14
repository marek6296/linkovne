import type { Block } from "./blocks";

/** The editor list and live preview use the same section-aware ordering. */
export function reorderBlocks(
  blocks: Block[],
  activeId: string,
  overId: string,
): Block[] {
  const from = blocks.findIndex((block) => block.id === activeId);
  const to = blocks.findIndex((block) => block.id === overId);
  if (from < 0 || to < 0 || from === to) return blocks;
  const isSection = (block: Block) =>
    block.type === "headline" && block.config.isSection === true;
  if (!isSection(blocks[from])) {
    const next = [...blocks];
    next.splice(to, 0, next.splice(from, 1)[0]);
    return next;
  }
  let end = from + 1;
  while (end < blocks.length && !isSection(blocks[end])) end++;
  if (to >= from && to < end) return blocks;
  // Drop above/below the target group, never between its title and content.
  let boundary = to;
  if (to > from) {
    boundary++;
    while (boundary < blocks.length && !isSection(blocks[boundary])) boundary++;
  } else {
    while (boundary > 0 && !isSection(blocks[boundary])) boundary--;
  }
  const group = blocks.slice(from, end);
  const rest = [...blocks.slice(0, from), ...blocks.slice(end)];
  const insertAt = boundary > from ? boundary - group.length : boundary;
  return [...rest.slice(0, insertAt), ...group, ...rest.slice(insertAt)];
}
