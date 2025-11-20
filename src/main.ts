#!/usr/bin/env node
import { Command } from 'commander';
import { HelloCommand } from './commands/hello.command.js';
import { MandaCommand } from './commands/manda.command.js';
import { SeeCommand } from './commands/see.command.js';
import { DoCommand } from './commands/do.command.js';

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

// See command: preview notes
program
  .command('see')
  .description('Preview notes with navigation')
  .option('--yester', 'Preview yesterday\'s note instead')
  .option('--date <date>', 'Preview note for specific date (YYYY-MM-DD format)')
  .action(async (options) => {
    const seeCommand = new SeeCommand();
    await seeCommand.execute(options);
  });

// Do command: interactive task management
program
  .command('do')
  .description('Interactive task management for notes')
  .option('--yester', 'Manage tasks from yesterday\'s note instead')
  .option('--date <date>', 'Manage tasks for specific date (YYYY-MM-DD format)')
  .action(async (options) => {
    const doCommand = new DoCommand();
    await doCommand.execute(options);
  });

program.parse();
