import React from 'react';
import { Text } from 'ink';

interface HelloProps {
  name?: string;
}

const Hello: React.FC<HelloProps> = ({ name = 'World' }) => {
  return <Text>Hello, {name}!</Text>;
};

export default Hello;
