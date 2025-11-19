#!/usr/bin/env node
import { Command } from 'commander';
import { HelloCommand } from './commands/hello.command.js';

const program = new Command();

program
  .name('manda')
  .description('A Terminal User Interface (TUI) application')
  .version('1.0.0');

program
  .command('manda')
  .description('Display a hello message')
  .option('-n, --name <name>', 'Name to greet')
  .action((options) => {
    const helloCommand = new HelloCommand();
    helloCommand.execute(options);
  });

program.parse();
