import type { Gate, NodeKind, Work } from "./schema";

type Kind = NodeKind | "puzzles";

// Gate logic. A node listed in any gate's `unlocks` is locked until at least one of those gates opens.
// A gate opens when every puzzle in `when.solved` is solved.
export function openGates(work: Work, solved: Set<string>): Gate[] {
  return work.gates.filter((g) => g.when.solved.every((p) => solved.has(p)));
}

export function access(work: Work, solved: Set<string>) {
  const open = new Set(openGates(work, solved).map((g) => g.id));
  const lockers = (kind: Kind | "search", nodeId: string) => work.gates.filter((g) => g.unlocks[kind].includes(nodeId));

  const isUnlocked = (kind: Kind, nodeId: string) => {
    const gs = lockers(kind, nodeId);
    return gs.length === 0 || gs.some((g) => open.has(g.id));
  };

  const isSearchable = (kind: NodeKind, node: { id: string; search: string }) => {
    if (!isUnlocked(kind, node.id) || node.search === "hidden") return false;
    if (node.search === "visible") return true;
    return lockers("search", node.id).some((g) => open.has(g.id));
  };

  const ended = work.ending.requires.every((p) => solved.has(p));
  return { isUnlocked, isSearchable, ended, openGateIds: open };
}

// Everything reachable if the player solves every puzzle they can reach. Used by the validator.
export function reachability(work: Work) {
  const solved = new Set<string>();
  for (;;) {
    const a = access(work, solved);
    const next = work.puzzles.filter((p) => a.isUnlocked("puzzles", p.id) && !solved.has(p.id));
    if (next.length === 0) break;
    next.forEach((p) => solved.add(p.id));
  }
  return { solved, access: access(work, solved) };
}
