import React from 'react';
import { render } from 'ink';
import Hello from '../components/Hello.js';
import { BaseCommand } from './base.command.js';
import { NoteService } from '../domain/note.service.js';

export interface HelloOptions {
  name?: string;
}

export class HelloCommand extends BaseCommand {
  constructor(noteService?: NoteService) {
    super(noteService);
  }

  async execute(options: HelloOptions): Promise<void> {
    // Ensure today's note exists before executing the hello command
    await this.ensureTodaysNoteExists();

    render(React.createElement(Hello, { name: options.name }));
  }
}
