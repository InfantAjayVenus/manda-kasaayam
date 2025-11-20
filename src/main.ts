#!/usr/bin/env node
import { Command } from 'commander';
import { HelloCommand } from './commands/hello.command.js';
import { MandaCommand } from './commands/manda.command.js';

const program = new Command();

program
  .name('manda')
  .description('A Terminal User Interface (TUI) application')
  .version('1.0.0');

// Default action: open today's note
program
  .description('Open or create today\'s note')
  .action(async () => {
    const mandaCommand = new MandaCommand();
    await mandaCommand.execute();
  });

// Hello command (for testing/demo purposes)
program
  .command('hello')
  .description('Display a hello message')
  .option('-n, --name <name>', 'Name to greet')
  .action(async (options) => {
    const helloCommand = new HelloCommand();
    await helloCommand.execute(options);
  });

program.parse();
