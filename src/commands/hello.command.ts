import React from 'react';
import { render } from 'ink';
import Hello from '../components/Hello.js';

export interface HelloOptions {
  name?: string;
}

export class HelloCommand {
  execute(options: HelloOptions): void {
    render(React.createElement(Hello, { name: options.name }));
  }
}
