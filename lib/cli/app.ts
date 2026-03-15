import { createInterface } from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";
import { DialogueNode } from "../types";
import {
  buildPreferredPathOptions,
  DEFAULT_DICT_SOURCE,
  DEFAULT_SOURCES,
  evaluateCounterOutput,
  explorePaths,
  formatPathAsChat,
  formatPathMetrics,
  getBooleanName,
  getConversationName,
  getCounterName,
  loadDictionary,
  loadNodes,
  type LoadedSource,
  type PathResult,
  resolveContent,
  resolveStartNodes,
  sourceLabel,
  summarizeResults,
} from "../core/pathfinder";

type CliArgs = {
  sources: string[];
  dictSource?: string;
  startId?: number;
  maxDepth: number;
  maxPaths: number;
};

export async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));
  const dictionary = args.dictSource
    ? await loadDictionary(args.dictSource)
    : new Map<string, string>();

  const rl = createInterface({ input, output });
  const checkAnswers = new Map<string, boolean>();
  const counterValues = new Map<string, number>();

  const chosenSources =
    args.sources.length > 0
      ? args.sources
      : [await promptForSource(rl, DEFAULT_SOURCES)];

  const loadedSources: LoadedSource[] = [];
  for (const source of chosenSources) {
    const nodes = await loadNodes(source);
    if (nodes.length === 0) {
      continue;
    }

    loadedSources.push({
      source,
      nodes,
      byId: new Map<number, DialogueNode>(nodes.map((node) => [node.Id, node])),
      startNodes: resolveStartNodes(nodes),
    });
  }

  if (loadedSources.length === 0) {
    rl.close();
    throw new Error("No dialogue nodes found in any source.");
  }

  const askBooleanDecision = async (
    cacheScope: string,
    conversationLabel: string,
    node: DialogueNode,
    booleanName: string,
  ): Promise<boolean> => {
    const key = `${cacheScope}:${booleanName}`;
    if (checkAnswers.has(key)) {
      return checkAnswers.get(key)!;
    }

    const prompt = [
      `Conversation: ${conversationLabel}`,
      `Node ${node.Id} checks a boolean condition.`,
      `Boolean: ${booleanName}`,
      node.Content
        ? `Content: ${resolveContent(node.Content, dictionary)}`
        : "",
      "Is the condition TRUE for this run? (y/n): ",
    ]
      .filter(Boolean)
      .join("\n");

    let answer = "";
    while (!["y", "yes", "n", "no"].includes(answer)) {
      answer = (await rl.question(prompt)).trim().toLowerCase();
    }

    const value = answer.startsWith("y");
    checkAnswers.set(key, value);
    return value;
  };

  const askCounterBranch = async (
    cacheScope: string,
    conversationLabel: string,
    node: DialogueNode,
  ): Promise<number[]> => {
    const counterName = getCounterName(node);
    const key = `${cacheScope}:${counterName}`;
    const outputs = node.Outputs ?? [];
    if (outputs.length === 0) {
      return [...new Set(node.Outgoing ?? [])];
    }

    if (!counterValues.has(key)) {
      const promptLines = [
        `Conversation: ${conversationLabel}`,
        `Node ${node.Id} checks a counter condition.`,
        `Counter: ${counterName}`,
        node.Content
          ? `Content: ${resolveContent(node.Content, dictionary)}`
          : "",
        "Available conditions:",
        ...outputs.map((item, index) => {
          const expression = item.Expression?.trim() || "(no expression)";
          const outgoing = (item.Outgoing ?? []).join(", ") || "(none)";
          return `${index + 1}. ${expression} -> [${outgoing}]`;
        }),
      ].filter(Boolean);

      let parsedValue: number | undefined;
      while (parsedValue === undefined) {
        const answer = (
          await rl.question(
            `${promptLines.join("\n")}\nEnter numeric value for ${counterName}: `,
          )
        ).trim();
        const numeric = Number(answer);
        if (!Number.isNaN(numeric) && Number.isFinite(numeric)) {
          parsedValue = numeric;
        }
      }

      counterValues.set(key, parsedValue);
    }

    const value = counterValues.get(key)!;
    const matched = outputs.filter((item) =>
      evaluateCounterOutput(item, value),
    );
    const selected =
      matched[0] ??
      outputs.find((item) => item.Expression?.trim().toLowerCase() === "false");

    return [...new Set(selected?.Outgoing ?? [])];
  };

  const selected = await selectConversationsToSimulate(
    rl,
    loadedSources,
    args.startId,
  );

  for (const item of selected) {
    const conversationName = getConversationName(item.source, item.startNode);
    const decisionScope = `${item.source}#${item.startNode.Id}`;
    const resolveText = (value: string) => resolveContent(value, dictionary);

    console.log(`\n===== Source: ${item.source} =====`);

    const results = await explorePaths({
      byId: item.byId,
      node: item.startNode,
      maxDepth: args.maxDepth,
      maxPaths: args.maxPaths,
      resolveText,
      askBooleanDecision: (node) =>
        askBooleanDecision(
          decisionScope,
          conversationName,
          node,
          getBooleanName(node)
        ),
      askCounterBranch: (node) =>
        askCounterBranch(decisionScope, conversationName, node),
    });

    if (results.length === 0) {
      console.log(`\n=== ${conversationName} ===`);
      console.log("No valid end path was found from the selected start node.");
      continue;
    }

    const ranked = summarizeResults(results);

    console.log(`\n=== ${conversationName} (startId=${item.startNode.Id}) ===`);
    printResult(
      "Best chemistry path",
      ranked.byChemistry,
      false,
      ranked.thermostatEnabled,
    );
    if (ranked.byThermostat) {
      printResult("Best thermostat path", ranked.byThermostat, false, true);
    }
    printResult(
      "Most boolean activations",
      ranked.byBooleans,
      false,
      ranked.thermostatEnabled,
    );
    printResult(
      "Best overall path",
      ranked.byOverall,
      true,
      ranked.thermostatEnabled,
    );

    const preferredPath = await askPreferredPathSelection(rl, [
      { label: "Best chemistry path", result: ranked.byChemistry },
      ...(ranked.byThermostat
        ? [{ label: "Best thermostat path", result: ranked.byThermostat }]
        : []),
      { label: "Most boolean activations", result: ranked.byBooleans },
      { label: "Best overall path", result: ranked.byOverall },
    ]);

    if (preferredPath) {
      const chatLines = formatPathAsChat(
        preferredPath,
        item.byId,
        sourceLabel(item.source),
        resolveText,
      );
      console.log("\nPreferred path excerpt:");
      if (chatLines.length === 0) {
        console.log("- (no dialogue text available on this path)");
      } else {
        for (const line of chatLines) {
          console.log(`- ${line}`);
        }
      }
    }
  }

  rl.close();

  if (checkAnswers.size > 0) {
    console.log("\nBoolean checks used:");
    for (const [id, value] of checkAnswers.entries()) {
      console.log(`- ${id}: ${value ? "TRUE" : "FALSE"}`);
    }
  }

  if (counterValues.size > 0) {
    console.log("\nCounter values used:");
    for (const [id, value] of counterValues.entries()) {
      console.log(`- ${id}: ${value}`);
    }
  }
}

function parseArgs(argv: string[]): CliArgs {
  const getValue = (flag: string): string | undefined => {
    const idx = argv.indexOf(flag);
    return idx >= 0 ? argv[idx + 1] : undefined;
  };

  const getValues = (flag: string): string[] => {
    const values: string[] = [];
    for (let i = 0; i < argv.length; i += 1) {
      if (argv[i] === flag && argv[i + 1]) {
        values.push(argv[i + 1]);
      }
    }
    return values;
  };

  const sources = [
    ...getValues("--source"),
    ...getValues("--url"),
    ...getValues("--file"),
  ];

  const startIdRaw = getValue("--startId");
  const maxDepthRaw = getValue("--maxDepth");
  const maxPathsRaw = getValue("--maxPaths");
  const dictSource = getValue("--dict") ?? DEFAULT_DICT_SOURCE;

  return {
    sources,
    dictSource,
    startId: startIdRaw ? Number(startIdRaw) : undefined,
    maxDepth: maxDepthRaw ? Number(maxDepthRaw) : 100,
    maxPaths: maxPathsRaw ? Number(maxPathsRaw) : 5000,
  };
}

async function promptForSource(
  rl: ReturnType<typeof createInterface>,
  sources: string[],
): Promise<string> {
  console.log("\nSelect the chatroom you want to simulate:\n");
  sources.forEach((source, index) => {
    console.log(`${index + 1}. ${sourceLabel(source)} [${source}]`);
  });

  while (true) {
    const answer = (
      await rl.question(
        `\nEnter chatroom option number (1-${sources.length}): `,
      )
    ).trim();
    const numeric = Number(answer);
    if (
      Number.isInteger(numeric) &&
      numeric >= 1 &&
      numeric <= sources.length
    ) {
      return sources[numeric - 1];
    }
  }
}

async function selectConversationsToSimulate(
  rl: ReturnType<typeof createInterface>,
  loadedSources: LoadedSource[],
  startId?: number,
): Promise<
  Array<{
    source: string;
    byId: Map<number, DialogueNode>;
    startNode: DialogueNode;
  }>
> {
  if (typeof startId === "number") {
    const matches = loadedSources
      .map((item) => ({
        source: item.source,
        byId: item.byId,
        startNode: item.startNodes.find((node) => node.Id === startId),
      }))
      .filter(
        (
          item,
        ): item is {
          source: string;
          byId: Map<number, DialogueNode>;
          startNode: DialogueNode;
        } => Boolean(item.startNode),
      );

    if (matches.length === 0) {
      throw new Error(
        `Start node ${startId} was not found in provided sources.`,
      );
    }

    return [matches[0]];
  }

  const flat = loadedSources.flatMap((item) =>
    item.startNodes.map((startNode) => ({
      source: item.source,
      byId: item.byId,
      startNode,
    })),
  );

  if (flat.length === 1) {
    return [flat[0]];
  }

  console.log("\nSelect the conversation you want to simulate:\n");
  flat.forEach((item, index) => {
    const label = getConversationName(item.source, item.startNode);
    console.log(
      `${index + 1}. ${label} (startId=${item.startNode.Id}) [${item.source}]`,
    );
  });

  while (true) {
    const answer = (
      await rl.question(`\nEnter option number (1-${flat.length}) or startId: `)
    ).trim();
    const numeric = Number(answer);
    if (!Number.isInteger(numeric)) {
      continue;
    }

    if (numeric >= 1 && numeric <= flat.length) {
      return [flat[numeric - 1]];
    }

    const matches = flat.filter((item) => item.startNode.Id === numeric);
    if (matches.length === 1) {
      return [matches[0]];
    }

    if (matches.length > 1) {
      console.log(
        `startId ${numeric} exists in multiple sources. Choose by option number instead.`,
      );
    }
  }
}

async function askPreferredPathSelection(
  rl: ReturnType<typeof createInterface>,
  options: Array<{ label: string; result: PathResult }>,
): Promise<PathResult | undefined> {
  const selectable = buildPreferredPathOptions(options);
  if (selectable.length === 0) {
    return undefined;
  }

  console.log("\nWhich path do you prefer?");
  selectable.forEach((option, index) => {
    console.log(
      `${index + 1}. ${option.label}${formatPathMetrics(option.result)}`,
    );
  });

  while (true) {
    const answer = (
      await rl.question(`Enter option number (1-${selectable.length}): `)
    ).trim();
    const numeric = Number(answer);
    if (
      Number.isInteger(numeric) &&
      numeric >= 1 &&
      numeric <= selectable.length
    ) {
      return selectable[numeric - 1].result;
    }
  }
}

function printResult(
  title: string,
  result: PathResult,
  includeOverall = false,
  includeThermostat = true,
): void {
  console.log(`\n${title}:`);
  console.log(`- Path: ${result.path.join(" -> ")}`);
  console.log(`- Chemistry: ${result.chemistry}`);
  if (includeThermostat) {
    console.log(`- Thermostat: ${result.thermostat}`);
  }
  console.log(`- Boolean activations: ${result.activatedBooleans}`);
  if (includeOverall) {
    const thermostatScore = includeThermostat ? result.thermostat * 2 : 0;
    console.log(
      `- Overall score: ${result.chemistry * 3 + thermostatScore + result.activatedBooleans}`,
    );
  }
}
