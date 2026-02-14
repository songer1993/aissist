import figlet from "figlet";
import chalk from "chalk";

export function printBrand() {
  // Suppress banner in non-interactive/agentic environments
  if (process.env.AISSIST_QUIET === '1' || process.env.CI) {
    return;
  }
  console.log(
    chalk.cyanBright(
      figlet.textSync("Aissist", { horizontalLayout: "default" })
    )
  );
  console.log(chalk.gray("Personal AI Assistant CLI\n"));
}
